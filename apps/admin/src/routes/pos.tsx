import { useDeferredValue, useEffect, useReducer, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  createSale,
  getPosProducts,
  type CompletedSaleResponse,
  type Product,
} from "@/lib/api";
import {
  AdminPage,
  EmptyState,
  FilterChip,
  InfoPill,
  PageHeader,
  PageSection,
  SearchField,
  SectionTitle,
} from "@/components/AdminUI";
import { formatGYD, paymentMethods, type PaymentMethod } from "@workspace/shared";

export const Route = createFileRoute("/pos")({
  component: PosPage,
});

type CartItem = {
  product: Product;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  discountGyd: number;
  taxGyd: number;
};

type CartAction =
  | { type: "ADD_ITEM"; product: Product }
  | { type: "REMOVE_ITEM"; productId: number }
  | { type: "UPDATE_QTY"; productId: number; quantity: number }
  | { type: "CLEAR_CART" }
  | { type: "APPLY_DISCOUNT"; discountGyd: number }
  | { type: "APPLY_TAX"; taxGyd: number };

const INITIAL_CART: CartState = {
  items: [],
  discountGyd: 0,
  taxGyd: 0,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((item) => item.product.id === action.product.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.product.id === action.product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }

      return {
        ...state,
        items: [...state.items, { product: action.product, quantity: 1 }],
      };
    }
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((item) => item.product.id !== action.productId),
      };
    case "UPDATE_QTY":
      return {
        ...state,
        items: state.items
          .map((item) =>
            item.product.id === action.productId
              ? { ...item, quantity: action.quantity }
              : item
          )
          .filter((item) => item.quantity > 0),
      };
    case "CLEAR_CART":
      return INITIAL_CART;
    case "APPLY_DISCOUNT":
      return { ...state, discountGyd: action.discountGyd };
    case "APPLY_TAX":
      return { ...state, taxGyd: action.taxGyd };
    default:
      return state;
  }
}

function PosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [cart, dispatch] = useReducer(cartReducer, INITIAL_CART);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [paymentReference, setPaymentReference] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<CompletedSaleResponse | null>(null);

  async function loadProducts() {
    setLoading(true);
    try {
      setProducts(await getPosProducts());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts().catch(console.error);
  }, []);

  const categories = [
    { slug: "all", name: "All Products" },
    ...Array.from(
      new Map(
        products.map((product) => [
          product.categorySlug ?? product.categoryName ?? "uncategorized",
          {
            slug: product.categorySlug ?? product.categoryName ?? "uncategorized",
            name: product.categoryName ?? "Uncategorized",
          },
        ])
      ).values()
    ),
  ];

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      categoryFilter === "all" || product.categorySlug === categoryFilter;
    const text = `${product.name} ${product.description} ${product.sku ?? ""}`.toLowerCase();
    const matchesSearch = text.includes(deferredSearch.trim().toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const subtotalGyd = cart.items.reduce(
    (sum, item) => sum + item.product.priceGyd * item.quantity,
    0
  );
  const totalGyd = subtotalGyd - cart.discountGyd + cart.taxGyd;
  const cartUnits = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockCatalog = products.filter(
    (product) => product.trackStock && product.stockQty <= product.lowStockThreshold
  ).length;

  async function handleCompleteSale() {
    if (cart.items.length === 0 || totalGyd < 0) return;

    setSubmitting(true);
    setError(null);
    try {
      const completedSale = await createSale({
        items: cart.items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        paymentMethod,
        paymentReference: paymentReference || null,
        discountGyd: cart.discountGyd,
        taxGyd: cart.taxGyd,
        notes,
      });

      setReceipt(completedSale);
      dispatch({ type: "CLEAR_CART" });
      setPaymentMethod("cash");
      setPaymentReference("");
      setNotes("");
      await loadProducts();
    } catch (saleError) {
      setError((saleError as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function printReceipt() {
    if (!receipt) return;

    const win = window.open("", "_blank", "width=720,height=900");
    if (!win) return;

    const itemsHtml = receipt.items
      .map(
        (item) => `
          <tr>
            <td>${item.productName}</td>
            <td>${item.quantity}</td>
            <td>${formatGYD(item.lineTotalGyd)}</td>
          </tr>
        `
      )
      .join("");

    win.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${receipt.sale.saleNumber}</title>
          <style>
            body { font-family: "DM Sans", "Segoe UI", sans-serif; padding: 32px; color: #1f2d18; }
            .card { border: 1px solid #dbe5d5; border-radius: 28px; padding: 24px; }
            .eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: .2em; color: #64715d; font-weight: 700; }
            h1 { margin: 8px 0 0; font-size: 32px; }
            .muted { color: #64715d; }
            table { width: 100%; border-collapse: collapse; margin-top: 18px; }
            th, td { text-align: left; padding: 12px 0; border-bottom: 1px solid #dbe5d5; font-size: 14px; }
            th { font-size: 11px; text-transform: uppercase; letter-spacing: .15em; color: #64715d; }
            .totals { margin-top: 18px; }
            .totals div { display: flex; justify-content: space-between; padding: 6px 0; }
            .total { font-weight: 800; font-size: 18px; color: #1f4120; border-top: 1px solid #dbe5d5; margin-top: 8px; padding-top: 12px; }
          </style>
        </head>
        <body>
          <section class="card">
            <p class="eyebrow">Netsurf Nature Park</p>
            <h1>${receipt.sale.saleNumber}</h1>
            <p class="muted">${new Date(receipt.sale.createdAt).toLocaleString()}</p>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <div class="totals">
              <div><span>Subtotal</span><span>${formatGYD(receipt.sale.subtotalGyd)}</span></div>
              <div><span>Discount</span><span>${formatGYD(receipt.sale.discountGyd)}</span></div>
              <div><span>Tax</span><span>${formatGYD(receipt.sale.taxGyd)}</span></div>
              <div class="total"><span>Total</span><span>${formatGYD(receipt.sale.totalGyd)}</span></div>
            </div>
          </section>
        </body>
      </html>
    `);

    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <AdminPage className="max-w-[1600px]">
      <PageHeader
        eyebrow="POS"
        title="Point of sale terminal"
        description="Run walk-in sales, keep the catalog visible, and finish transactions without burying staff in a cramped cart. The terminal is tuned for quick scanning, stock awareness, and a cleaner receipt flow."
        meta={
          <>
            <InfoPill>{products.length} active products</InfoPill>
            <InfoPill tone={lowStockCatalog > 0 ? "amber" : "green"}>
              {lowStockCatalog} low-stock items
            </InfoPill>
            <InfoPill>{cartUnits} units in cart</InfoPill>
          </>
        }
        actions={
          <>
            <Link
              to="/products"
              className="admin-button-secondary rounded-2xl px-4 py-3 text-sm font-bold"
            >
              Manage Catalog
            </Link>
            <Link
              to="/sales"
              className="admin-button-primary rounded-2xl px-4 py-3 text-sm font-bold"
            >
              View Sales
            </Link>
          </>
        }
      />

      <AnimatePresence>
        {error ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700"
          >
            {error}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(360px,0.95fr)]">
        <PageSection className="p-6">
          <SectionTitle
            title="Catalog"
            description="Filter by category, search quickly, and keep out-of-stock products visible but clearly disabled."
          />

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
            <SearchField
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by product name, description, or SKU..."
            />
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <FilterChip
                  key={category.slug}
                  active={categoryFilter === category.slug}
                  onClick={() => setCategoryFilter(category.slug)}
                >
                  {category.name}
                </FilterChip>
              ))}
            </div>
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-48 rounded-[1.7rem] border border-border bg-white/70 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <EmptyState
                title="No products match this filter"
                description="Try a different category or search term. The catalog only shows active products, so unavailable items remain hidden from checkout until they are reactivated."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {filteredProducts.map((product) => {
                  const cartQuantity =
                    cart.items.find((item) => item.product.id === product.id)?.quantity ?? 0;
                  const isOutOfStock = product.trackStock && product.stockQty <= cartQuantity;

                  return (
                    <motion.button
                      key={product.id}
                      whileHover={isOutOfStock ? undefined : { y: -4 }}
                      whileTap={isOutOfStock ? undefined : { scale: 0.985 }}
                      onClick={() => dispatch({ type: "ADD_ITEM", product })}
                      disabled={isOutOfStock}
                      className={`group relative rounded-[1.8rem] border p-5 text-left transition-all ${
                        isOutOfStock
                          ? "cursor-not-allowed border-border bg-muted/30 opacity-60"
                          : "border-primary/8 bg-white/85 hover:border-primary/18 hover:shadow-[0_22px_34px_rgb(23_48_13_/10%)]"
                      }`}
                    >
                      <p className="admin-kicker">
                        {product.categoryName ?? "Uncategorized"}
                      </p>
                      <h2 className="mt-3 text-xl font-black tracking-tight text-foreground">
                        {product.name}
                      </h2>
                      <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">
                        {product.description || "No internal note provided for this item."}
                      </p>

                      <div className="mt-5 flex items-center justify-between gap-3">
                        <span className="text-xl font-black text-primary">
                          {formatGYD(product.priceGyd)}
                        </span>

                        {product.trackStock ? (
                          <InfoPill tone={product.stockQty === 0 ? "red" : product.stockQty <= product.lowStockThreshold ? "amber" : "green"}>
                            {Math.max(product.stockQty - cartQuantity, 0)} left
                          </InfoPill>
                        ) : (
                          <InfoPill>Non-stock item</InfoPill>
                        )}
                      </div>

                      {product.sku ? (
                        <p className="mt-3 text-xs font-medium text-muted-foreground">
                          SKU {product.sku}
                        </p>
                      ) : null}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </PageSection>

        <PageSection className="p-6 xl:sticky xl:top-6 xl:self-start">
          <SectionTitle
            title="Checkout"
            description={`${cart.items.length} line item${cart.items.length === 1 ? "" : "s"} · ${cartUnits} unit${cartUnits === 1 ? "" : "s"} in cart`}
            action={
              cart.items.length > 0 ? (
                <button
                  onClick={() => dispatch({ type: "CLEAR_CART" })}
                  className="text-sm font-bold text-muted-foreground hover:text-foreground"
                >
                  Clear cart
                </button>
              ) : null
            }
          />

          <div className="space-y-3">
            {cart.items.length === 0 ? (
              <EmptyState
                title="Cart is empty"
                description="Select products from the catalog to start the sale. Out-of-stock items remain visible but cannot be added."
              />
            ) : (
              cart.items.map((item) => (
                <div
                  key={item.product.id}
                  className="rounded-[1.4rem] border border-primary/8 bg-primary/4 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{item.product.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatGYD(item.product.priceGyd)} each
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        dispatch({ type: "REMOVE_ITEM", productId: item.product.id })
                      }
                      className="text-xs font-bold text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          dispatch({
                            type: "UPDATE_QTY",
                            productId: item.product.id,
                            quantity: item.quantity - 1,
                          })
                        }
                        className="admin-button-secondary flex h-9 w-9 items-center justify-center rounded-full text-base font-bold"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          dispatch({
                            type: "UPDATE_QTY",
                            productId: item.product.id,
                            quantity: item.quantity + 1,
                          })
                        }
                        disabled={item.product.trackStock && item.quantity >= item.product.stockQty}
                        className="admin-button-secondary flex h-9 w-9 items-center justify-center rounded-full text-base font-bold disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    <p className="font-black text-primary">
                      {formatGYD(item.product.priceGyd * item.quantity)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-5 space-y-4 rounded-[1.7rem] border border-primary/8 bg-white/76 p-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <label className="block">
                <span className="mb-2 block text-xs font-bold tracking-[0.16em] text-muted-foreground uppercase">
                  Discount (GYD)
                </span>
                <input
                  type="number"
                  min={0}
                  value={cart.discountGyd}
                  onChange={(event) =>
                    dispatch({
                      type: "APPLY_DISCOUNT",
                      discountGyd: Number(event.target.value),
                    })
                  }
                  className="admin-input w-full rounded-[1.2rem] px-4 py-3 text-sm outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold tracking-[0.16em] text-muted-foreground uppercase">
                  Tax (GYD)
                </span>
                <input
                  type="number"
                  min={0}
                  value={cart.taxGyd}
                  onChange={(event) =>
                    dispatch({
                      type: "APPLY_TAX",
                      taxGyd: Number(event.target.value),
                    })
                  }
                  className="admin-input w-full rounded-[1.2rem] px-4 py-3 text-sm outline-none"
                />
              </label>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold tracking-[0.16em] text-muted-foreground uppercase">
                Payment Method
              </p>
              <div className="flex flex-wrap gap-2">
                {paymentMethods.map((method) => (
                  <FilterChip
                    key={method.value}
                    active={paymentMethod === method.value}
                    onClick={() => setPaymentMethod(method.value)}
                  >
                    {method.label}
                  </FilterChip>
                ))}
              </div>
            </div>

            {(paymentMethod === "card" || paymentMethod === "transfer") ? (
              <label className="block">
                <span className="mb-2 block text-xs font-bold tracking-[0.16em] text-muted-foreground uppercase">
                  Reference
                </span>
                <input
                  value={paymentReference}
                  onChange={(event) => setPaymentReference(event.target.value)}
                  className="admin-input w-full rounded-[1.2rem] px-4 py-3 text-sm outline-none"
                  placeholder="Card auth or transfer reference"
                />
              </label>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-xs font-bold tracking-[0.16em] text-muted-foreground uppercase">
                Internal Note
              </span>
              <textarea
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="admin-input w-full rounded-[1.2rem] px-4 py-3 text-sm outline-none"
                placeholder="Optional shift or transaction note"
              />
            </label>

            <div className="space-y-2 rounded-[1.3rem] border border-primary/8 bg-primary/4 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold text-foreground">{formatGYD(subtotalGyd)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-semibold text-foreground">{formatGYD(cart.discountGyd)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-semibold text-foreground">{formatGYD(cart.taxGyd)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-primary/10 pt-3 text-base">
                <span className="font-bold text-foreground">Total</span>
                <span className="text-xl font-black text-primary">
                  {formatGYD(totalGyd)}
                </span>
              </div>
            </div>

            <button
              onClick={handleCompleteSale}
              disabled={submitting || cart.items.length === 0 || totalGyd < 0}
              className="admin-button-primary w-full rounded-[1.2rem] px-5 py-3.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Completing sale..." : "Complete Sale"}
            </button>
          </div>
        </PageSection>
      </div>

      <AnimatePresence>
        {receipt ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#071003]/46 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="admin-surface w-full max-w-2xl rounded-[2rem] p-6 sm:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="admin-kicker">Sale complete</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-foreground">
                    {receipt.sale.saleNumber}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {new Date(receipt.sale.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setReceipt(null)}
                  className="text-sm font-bold text-muted-foreground hover:text-foreground"
                >
                  Close
                </button>
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-primary/8 bg-primary/4 p-4">
                <div className="space-y-2">
                  {receipt.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-foreground">
                        {item.productName} x {item.quantity}
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatGYD(item.lineTotalGyd)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-2 border-t border-primary/10 pt-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatGYD(receipt.sale.subtotalGyd)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span>{formatGYD(receipt.sale.discountGyd)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatGYD(receipt.sale.taxGyd)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-primary/10 pt-3 text-base font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatGYD(receipt.sale.totalGyd)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={printReceipt}
                  className="admin-button-secondary rounded-2xl px-4 py-3 text-sm font-bold"
                >
                  Print Receipt
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Receipt for sale ${receipt.sale.saleNumber}. Total: ${formatGYD(receipt.sale.totalGyd)}.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  Share on WhatsApp
                </a>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </AdminPage>
  );
}
