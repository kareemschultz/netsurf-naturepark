import { useEffect, useReducer, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  createSale,
  getPosProducts,
  type CompletedSaleResponse,
  type Product,
} from "@/lib/api";
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
    const matchesSearch = text.includes(search.trim().toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const subtotalGyd = cart.items.reduce(
    (sum, item) => sum + item.product.priceGyd * item.quantity,
    0
  );
  const totalGyd = subtotalGyd - cart.discountGyd + cart.taxGyd;

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
    const win = window.open("", "_blank", "width=600,height=800");
    if (!win) return;

    const itemsHtml = receipt.items
      .map(
        (item) =>
          `<tr><td>${item.productName}</td><td>${item.quantity}</td><td>${formatGYD(item.lineTotalGyd)}</td></tr>`
      )
      .join("");

    win.document.write(`
      <html>
        <head>
          <title>${receipt.sale.saleNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            td, th { padding: 8px 0; border-bottom: 1px solid #ddd; text-align: left; }
          </style>
        </head>
        <body>
          <h1>Netsurf Nature Park</h1>
          <p>Receipt ${receipt.sale.saleNumber}</p>
          <p>${new Date(receipt.sale.createdAt).toLocaleString()}</p>
          <table>
            <thead>
              <tr><th>Item</th><th>Qty</th><th>Total</th></tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <p>Subtotal: ${formatGYD(receipt.sale.subtotalGyd)}</p>
          <p>Discount: ${formatGYD(receipt.sale.discountGyd)}</p>
          <p>Tax: ${formatGYD(receipt.sale.taxGyd)}</p>
          <p><strong>Total: ${formatGYD(receipt.sale.totalGyd)}</strong></p>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <div className="mx-auto max-w-[1600px] p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black">POS Terminal</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ring up in-park sales, manage the cart, and issue printable or WhatsApp receipts.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.95fr)]">
        <section className="rounded-3xl border border-border bg-white p-5">
          <div className="mb-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.slug}
                onClick={() => setCategoryFilter(category.slug)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  categoryFilter === category.slug
                    ? "text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
                style={
                  categoryFilter === category.slug
                    ? { backgroundColor: "#2D5016" }
                    : undefined
                }
              >
                {category.name}
              </button>
            ))}
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products..."
            className="mb-5 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2D5016]"
          />

          {loading ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Loading catalog...
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => {
                const cartQuantity =
                  cart.items.find((item) => item.product.id === product.id)?.quantity ?? 0;
                const isOutOfStock = product.trackStock && product.stockQty <= cartQuantity;

                return (
                  <button
                    key={product.id}
                    onClick={() => dispatch({ type: "ADD_ITEM", product })}
                    disabled={isOutOfStock}
                    className={`rounded-3xl border p-5 text-left transition-all ${
                      isOutOfStock
                        ? "cursor-not-allowed border-border bg-muted/30 opacity-55"
                        : "border-border bg-white hover:-translate-y-0.5 hover:border-[#2D5016]/40 hover:shadow-md"
                    }`}
                  >
                    <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                      {product.categoryName ?? "Uncategorized"}
                    </p>
                    <h2 className="mt-2 text-lg font-black">{product.name}</h2>
                    <p className="mt-1 min-h-10 text-sm text-muted-foreground">
                      {product.description || "No description"}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-lg font-black" style={{ color: "#2D5016" }}>
                        {formatGYD(product.priceGyd)}
                      </span>
                      {product.trackStock ? (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            product.stockQty === 0
                              ? "bg-red-100 text-red-700"
                              : product.stockQty <= product.lowStockThreshold
                                ? "bg-amber-100 text-amber-700"
                                : "bg-green-100 text-green-700"
                          }`}
                        >
                          {product.stockQty - cartQuantity} left
                        </span>
                      ) : (
                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                          Service
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <aside className="rounded-3xl border border-border bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black">Cart</h2>
              <p className="text-sm text-muted-foreground">
                {cart.items.length} line item{cart.items.length !== 1 ? "s" : ""}
              </p>
            </div>
            {cart.items.length > 0 && (
              <button
                onClick={() => dispatch({ type: "CLEAR_CART" })}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>

          <div className="space-y-3">
            {cart.items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-8 text-center text-sm text-muted-foreground">
                Select products from the catalog to start a sale.
              </div>
            ) : (
              cart.items.map((item) => (
                <div
                  key={item.product.id}
                  className="rounded-2xl border border-border bg-muted/10 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatGYD(item.product.priceGyd)} each
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        dispatch({
                          type: "REMOVE_ITEM",
                          productId: item.product.id,
                        })
                      }
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          dispatch({
                            type: "UPDATE_QTY",
                            productId: item.product.id,
                            quantity: item.quantity - 1,
                          })
                        }
                        className="h-8 w-8 rounded-full border border-border text-sm font-bold transition-colors hover:bg-white"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                      <button
                        onClick={() =>
                          dispatch({
                            type: "UPDATE_QTY",
                            productId: item.product.id,
                            quantity: item.quantity + 1,
                          })
                        }
                        disabled={item.product.trackStock && item.quantity >= item.product.stockQty}
                        className="h-8 w-8 rounded-full border border-border text-sm font-bold transition-colors hover:bg-white disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    <p className="font-semibold">
                      {formatGYD(item.product.priceGyd * item.quantity)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-5 space-y-4 rounded-2xl border border-border bg-muted/10 p-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold tracking-wide text-muted-foreground uppercase">
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
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2D5016]"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold tracking-wide text-muted-foreground uppercase">
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
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2D5016]"
                />
              </label>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Payment Method
              </p>
              <div className="flex flex-wrap gap-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.value}
                    onClick={() => setPaymentMethod(method.value)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      paymentMethod === method.value
                        ? "text-white"
                        : "bg-white text-muted-foreground hover:text-foreground"
                    }`}
                    style={
                      paymentMethod === method.value
                        ? { backgroundColor: "#2D5016" }
                        : undefined
                    }
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            {(paymentMethod === "card" || paymentMethod === "transfer") && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold tracking-wide text-muted-foreground uppercase">
                  Reference
                </span>
                <input
                  value={paymentReference}
                  onChange={(event) => setPaymentReference(event.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2D5016]"
                  placeholder="Card auth or transfer reference"
                />
              </label>
            )}

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Notes
              </span>
              <textarea
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2D5016]"
                placeholder="Optional internal note"
              />
            </label>

            <div className="space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatGYD(subtotalGyd)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-semibold">{formatGYD(cart.discountGyd)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-semibold">{formatGYD(cart.taxGyd)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2 text-base">
                <span className="font-bold">Total</span>
                <span className="font-black" style={{ color: "#2D5016" }}>
                  {formatGYD(totalGyd)}
                </span>
              </div>
            </div>

            <button
              onClick={handleCompleteSale}
              disabled={submitting || cart.items.length === 0 || totalGyd < 0}
              className="w-full rounded-full px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: "#2D5016" }}
            >
              {submitting ? "Completing Sale..." : "Complete Sale"}
            </button>
          </div>
        </aside>
      </div>

      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                  Sale Complete
                </p>
                <h2 className="text-2xl font-black">{receipt.sale.saleNumber}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {new Date(receipt.sale.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setReceipt(null)}
                className="text-sm font-semibold text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>

            <div className="rounded-2xl border border-border bg-muted/10 p-4">
              <div className="space-y-2">
                {receipt.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span>
                      {item.productName} × {item.quantity}
                    </span>
                    <span className="font-semibold">{formatGYD(item.lineTotalGyd)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>{formatGYD(receipt.sale.subtotalGyd)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Discount</span>
                  <span>{formatGYD(receipt.sale.discountGyd)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tax</span>
                  <span>{formatGYD(receipt.sale.taxGyd)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2 font-bold">
                  <span>Total</span>
                  <span>{formatGYD(receipt.sale.totalGyd)}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={printReceipt}
                className="rounded-full border border-border px-4 py-2 text-sm font-bold transition-colors hover:bg-muted"
              >
                Print Receipt
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Receipt for sale ${receipt.sale.saleNumber} — Total: ${formatGYD(
                    receipt.sale.totalGyd
                  )}. Thank you!`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-[#25D366] px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                Share on WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
