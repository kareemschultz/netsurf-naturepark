import type { ReactNode } from "react";
import { useDeferredValue, useEffect, useReducer, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
import { cn } from "@workspace/ui/lib/utils";

const terminalHighlights = [
  "Search-forward catalog browsing",
  "Stock-aware item cards",
  "Receipt-first checkout posture",
] as const;

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

type PosViewMode = "standard" | "terminal";
type StockFocus = "all" | "available" | "low";

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
  const reduceMotion = useReducedMotion() ?? false;
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFocus, setStockFocus] = useState<StockFocus>("all");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [viewMode, setViewMode] = useState<PosViewMode>(() => {
    const saved = window.localStorage.getItem("netsurf-pos-view-mode");
    return saved === "terminal" ? "terminal" : "standard";
  });
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

  useEffect(() => {
    window.localStorage.setItem("netsurf-pos-view-mode", viewMode);
  }, [viewMode]);

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
    const matchesStock =
      stockFocus === "all"
        ? true
        : stockFocus === "available"
          ? !product.trackStock || product.stockQty > 0
          : product.trackStock && product.stockQty <= product.lowStockThreshold;
    return matchesCategory && matchesSearch && matchesStock;
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
  const isTerminalView = viewMode === "terminal";
  const terminalSearchClass =
    "border-white/10 bg-white/[0.06] shadow-none backdrop-blur-sm [&_svg]:text-white/38 [&_input]:text-white [&_input]:placeholder:text-white/30";
  const terminalChipClass =
    "!border-white/10 !bg-white/[0.06] !text-white/72 !shadow-none hover:!bg-white/[0.1] hover:!text-white";
  const terminalActiveChipClass =
    "!border-amber-300/30 !bg-amber-300/14 !text-amber-100 !shadow-none hover:!bg-amber-300/18 hover:!text-amber-50";

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
    <AdminPage className={cn("max-w-[1680px]", isTerminalView ? "relative isolate" : "max-w-[1600px]")}>
      {isTerminalView ? <PosTerminalBackdrop reduceMotion={reduceMotion} /> : null}

      <div className="relative z-10 space-y-6">
        {isTerminalView ? (
          <motion.section
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
            className="admin-surface relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(196,148,26,0.18),transparent_20%),radial-gradient(circle_at_82%_18%,rgba(83,125,46,0.18),transparent_24%),linear-gradient(135deg,rgba(16,34,8,0.98),rgba(12,24,7,0.98))] p-6 text-white shadow-[0_28px_80px_rgb(7_15_4_/32%)] sm:p-8"
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:54px_54px] opacity-20 [mask-image:linear-gradient(180deg,rgba(0,0,0,0.88),transparent_96%)]" />
              <motion.div
                aria-hidden
                className="absolute -left-14 top-16 h-40 w-40 rounded-full bg-amber-300/20 blur-3xl"
                animate={
                  reduceMotion
                    ? undefined
                    : { x: [0, 28, -12, 0], y: [0, -16, 18, 0], opacity: [0.32, 0.48, 0.34, 0.32] }
                }
                transition={{ duration: 18, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
              />
              <motion.div
                aria-hidden
                className="absolute bottom-[-2rem] right-[-1rem] h-56 w-56 rounded-full bg-emerald-300/18 blur-3xl"
                animate={
                  reduceMotion
                    ? undefined
                    : { x: [0, -24, 16, 0], y: [0, -20, 10, 0], scale: [1, 1.08, 0.96, 1] }
                }
                transition={{ duration: 20, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
              />
            </div>

            <div className="relative z-10 grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] xl:items-end">
              <div>
                <p className="text-[11px] font-bold tracking-[0.24em] text-white/45 uppercase">
                  POS Console
                </p>
                <h1 className="mt-4 max-w-[12ch] text-5xl leading-[0.94] font-black tracking-[-0.045em] text-white">
                  Point of sale terminal
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-white/68 sm:text-[0.98rem]">
                  Run walk-in sales, keep the catalog visible, and finish transactions
                  without burying staff in a cramped cart. Terminal view now leans into
                  a darker console shell with clearer contrast, faster scanning, and a
                  cleaner receipt posture.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <PosMetricBadge terminal>{products.length} active products</PosMetricBadge>
                  <PosMetricBadge terminal tone={lowStockCatalog > 0 ? "amber" : "green"}>
                    {lowStockCatalog} low-stock items
                  </PosMetricBadge>
                  <PosMetricBadge terminal>{cartUnits} units in cart</PosMetricBadge>
                  <PosMetricBadge terminal>Terminal view</PosMetricBadge>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {terminalHighlights.map((highlight, index) => (
                    <motion.div
                      key={highlight}
                      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.34,
                        delay: reduceMotion ? 0 : 0.12 + index * 0.05,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="rounded-[1.4rem] border border-white/10 bg-white/[0.06] px-4 py-4 backdrop-blur-sm"
                    >
                      <p className="text-[11px] font-bold tracking-[0.2em] text-white/38 uppercase">
                        Focus
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white/82">{highlight}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 xl:justify-self-end">
                <div className="rounded-[1.8rem] border border-white/10 bg-black/10 p-4 backdrop-blur-sm">
                  <p className="text-[11px] font-bold tracking-[0.22em] text-white/42 uppercase">
                    Layout mode
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/72">
                    Switch between the lighter operations board and the darker console posture.
                  </p>
                  <div className="mt-4">
                    <PosViewModeToggle
                      terminal
                      viewMode={viewMode}
                      onChange={setViewMode}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/products"
                    className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-white/14"
                  >
                    Manage Catalog
                  </Link>
                  <Link
                    to="/sales"
                    className="rounded-2xl border border-amber-300/24 bg-amber-300/14 px-4 py-3 text-sm font-bold text-amber-50 transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-amber-300/18"
                  >
                    View Sales
                  </Link>
                </div>
              </div>
            </div>
          </motion.section>
        ) : (
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
                <InfoPill>{isTerminalView ? "Terminal view" : "Standard view"}</InfoPill>
              </>
            }
            actions={
              <div className="flex flex-wrap items-center gap-3">
                <PosViewModeToggle viewMode={viewMode} onChange={setViewMode} />
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
              </div>
            }
          />
        )}

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

        <div
          className={cn(
            "grid gap-6",
            isTerminalView
              ? "xl:grid-cols-[minmax(0,1.86fr)_minmax(390px,0.8fr)]"
              : "xl:grid-cols-[minmax(0,1.65fr)_minmax(360px,0.95fr)]"
          )}
        >
          <PageSection
            className={cn(
              "relative overflow-hidden p-6",
              isTerminalView
                ? "border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(196,148,26,0.14),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(83,125,46,0.16),transparent_26%),linear-gradient(180deg,rgba(17,37,10,0.98),rgba(12,24,7,0.98))] text-white shadow-[0_26px_70px_rgb(8_16_4_/28%)]"
                : undefined
            )}
          >
            {isTerminalView ? (
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:38px_38px] opacity-20" />
                <motion.div
                  aria-hidden
                  className="absolute right-10 top-10 h-28 w-28 rounded-full bg-amber-300/16 blur-3xl"
                  animate={
                    reduceMotion
                      ? undefined
                      : { x: [0, 14, -10, 0], y: [0, 10, -8, 0], opacity: [0.28, 0.42, 0.3, 0.28] }
                  }
                  transition={{ duration: 16, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                />
              </div>
            ) : null}

            <div className="relative z-10">
              {isTerminalView ? (
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-bold tracking-[0.22em] text-white/38 uppercase">
                      Catalog deck
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
                      Ready-to-sell menu
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">
                      Search quickly, filter by stock posture, and keep product cards readable at a glance even when the terminal is under pressure.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <PosMetricBadge terminal tone="green">
                      {filteredProducts.length} visible products
                    </PosMetricBadge>
                    <PosMetricBadge terminal>
                      {categoryFilter === "all" ? "All categories" : categoryFilter}
                    </PosMetricBadge>
                  </div>
                </div>
              ) : (
                <SectionTitle
                  title="Catalog"
                  description="Filter by category, search quickly, and keep out-of-stock products visible but clearly disabled."
                />
              )}

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                <SearchField
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  label="Search POS catalog"
                  placeholder="Search by product name, description, or SKU…"
                  inputProps={{ name: "pos_search" }}
                  className={isTerminalView ? terminalSearchClass : undefined}
                />
                <div className="admin-scrollbar flex flex-wrap gap-2 overflow-x-auto">
                  {categories.map((category) => (
                    <FilterChip
                      key={category.slug}
                      type="button"
                      active={categoryFilter === category.slug}
                      onClick={() => setCategoryFilter(category.slug)}
                      className={
                        isTerminalView
                          ? categoryFilter === category.slug
                            ? terminalActiveChipClass
                            : terminalChipClass
                          : undefined
                      }
                    >
                      {category.name}
                    </FilterChip>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <FilterChip
                  type="button"
                  active={stockFocus === "all"}
                  onClick={() => setStockFocus("all")}
                  className={
                    isTerminalView
                      ? stockFocus === "all"
                        ? terminalActiveChipClass
                        : terminalChipClass
                      : undefined
                  }
                >
                  All Stock
                </FilterChip>
                <FilterChip
                  type="button"
                  active={stockFocus === "available"}
                  onClick={() => setStockFocus("available")}
                  className={
                    isTerminalView
                      ? stockFocus === "available"
                        ? terminalActiveChipClass
                        : terminalChipClass
                      : undefined
                  }
                >
                  Available Now
                </FilterChip>
                <FilterChip
                  type="button"
                  active={stockFocus === "low"}
                  onClick={() => setStockFocus("low")}
                  className={
                    isTerminalView
                      ? stockFocus === "low"
                        ? terminalActiveChipClass
                        : terminalChipClass
                      : undefined
                  }
                >
                  Low Stock
                </FilterChip>
                {search || categoryFilter !== "all" || stockFocus !== "all" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setCategoryFilter("all");
                      setStockFocus("all");
                    }}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold transition-[background-color,color,transform]",
                      isTerminalView
                        ? "border border-white/12 bg-white/8 text-white/76 hover:bg-white/12 hover:text-white"
                        : "admin-button-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Clear Filters
                  </button>
                ) : null}
              </div>

              <div className="mt-6">
                {loading ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div
                        key={index}
                        className={cn(
                          "h-48 rounded-[1.7rem] animate-pulse",
                          isTerminalView
                            ? "border border-white/10 bg-white/8"
                            : "border border-border bg-white/70"
                        )}
                      />
                    ))}
                  </div>
                ) : filteredProducts.length === 0 ? (
                  isTerminalView ? (
                    <TerminalEmptyState
                      title="No products match this filter"
                      description="Try another category or search term. The catalog only shows active products, so unavailable items stay out of checkout until they are reactivated."
                    />
                  ) : (
                    <EmptyState
                      title="No products match this filter"
                      description="Try a different category or search term. The catalog only shows active products, so unavailable items remain hidden from checkout until they are reactivated."
                    />
                  )
                ) : (
                  <div
                    className={cn(
                      "grid gap-4 sm:grid-cols-2",
                      isTerminalView ? "2xl:grid-cols-4" : "2xl:grid-cols-3"
                    )}
                  >
                    {filteredProducts.map((product) => {
                      const cartQuantity =
                        cart.items.find((item) => item.product.id === product.id)?.quantity ?? 0;
                      const isOutOfStock = product.trackStock && product.stockQty <= cartQuantity;
                      const remainingStock = Math.max(product.stockQty - cartQuantity, 0);

                      return (
                        <motion.button
                          key={product.id}
                          whileHover={isOutOfStock || reduceMotion ? undefined : { y: -4 }}
                          whileTap={isOutOfStock || reduceMotion ? undefined : { scale: 0.985 }}
                          type="button"
                          onClick={() => dispatch({ type: "ADD_ITEM", product })}
                          disabled={isOutOfStock}
                          className={cn(
                            "group relative overflow-hidden rounded-[1.8rem] border p-5 text-left transition-[background-color,border-color,box-shadow,transform,opacity]",
                            isOutOfStock
                              ? isTerminalView
                                ? "cursor-not-allowed border-white/8 bg-white/6 opacity-55"
                                : "cursor-not-allowed border-border bg-muted/30 opacity-60"
                              : isTerminalView
                                ? "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] shadow-[0_18px_28px_rgb(0_0_0_/18%)] hover:border-white/18 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.06))] hover:shadow-[0_24px_36px_rgb(0_0_0_/24%)]"
                                : "border-primary/8 bg-white/85 hover:border-primary/18 hover:shadow-[0_22px_34px_rgb(23_48_13_/10%)]"
                          )}
                        >
                          {isTerminalView ? (
                            <span className="pointer-events-none absolute right-3 top-3 h-20 w-20 rounded-full bg-amber-300/10 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
                          ) : null}

                          <p className={cn("admin-kicker", isTerminalView ? "text-white/40" : undefined)}>
                            {product.categoryName ?? "Uncategorized"}
                          </p>
                          <h2
                            className={cn(
                              "mt-3 text-xl font-black tracking-tight",
                              isTerminalView ? "text-white" : "text-foreground"
                            )}
                          >
                            {product.name}
                          </h2>
                          <p
                            className={cn(
                              "mt-2 min-h-12 text-sm leading-6",
                              isTerminalView ? "text-white/60" : "text-muted-foreground"
                            )}
                          >
                            {product.description || "No internal note provided for this item."}
                          </p>

                          <div className="mt-5 flex items-center justify-between gap-3">
                            <span className={cn("text-xl font-black", isTerminalView ? "text-amber-100" : "text-primary")}>
                              {formatGYD(product.priceGyd)}
                            </span>

                            {product.trackStock ? (
                              <PosStockBadge
                                terminal={isTerminalView}
                                remaining={remainingStock}
                                low={product.stockQty <= product.lowStockThreshold}
                              />
                            ) : (
                              <PosMetricBadge terminal={isTerminalView}>Non-stock item</PosMetricBadge>
                            )}
                          </div>

                          {product.sku ? (
                            <p
                              className={cn(
                                "mt-3 text-xs font-medium",
                                isTerminalView ? "text-white/40" : "text-muted-foreground"
                              )}
                            >
                              SKU {product.sku}
                            </p>
                          ) : null}
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </PageSection>

          <PageSection
            className={cn(
              "relative overflow-hidden p-6 xl:sticky xl:top-6 xl:self-start",
              isTerminalView
                ? "border-primary/16 bg-[radial-gradient(circle_at_top_right,rgba(196,148,26,0.1),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,244,235,0.96))] shadow-[0_26px_60px_rgb(27_42_15_/12%)]"
                : undefined
            )}
          >
            {isTerminalView ? (
              <div className="pointer-events-none absolute inset-0">
                <motion.div
                  aria-hidden
                  className="absolute right-2 top-6 h-24 w-24 rounded-full bg-amber-300/14 blur-2xl"
                  animate={
                    reduceMotion
                      ? undefined
                      : { x: [0, 12, -10, 0], y: [0, -10, 8, 0], opacity: [0.22, 0.35, 0.24, 0.22] }
                  }
                  transition={{ duration: 16, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                />
              </div>
            ) : null}

            <div className="relative z-10">
              <SectionTitle
                title={isTerminalView ? "Receipt deck" : "Checkout"}
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
                      className={cn(
                        "rounded-[1.4rem] border p-4",
                        isTerminalView
                          ? "border-primary/10 bg-white/78 shadow-[0_12px_30px_rgb(23_48_13_/6%)]"
                          : "border-primary/8 bg-primary/4"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{item.product.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatGYD(item.product.priceGyd)} each
                          </p>
                        </div>
                        <button
                          type="button"
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
                            type="button"
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
                            type="button"
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
                      name="discount_gyd"
                      inputMode="numeric"
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
                      name="tax_gyd"
                      inputMode="numeric"
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
                        type="button"
                        active={paymentMethod === method.value}
                        onClick={() => setPaymentMethod(method.value)}
                      >
                        {method.label}
                      </FilterChip>
                    ))}
                  </div>
                </div>

                {paymentMethod === "card" || paymentMethod === "transfer" ? (
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold tracking-[0.16em] text-muted-foreground uppercase">
                      Reference
                    </span>
                    <input
                      name="payment_reference"
                      autoComplete="off"
                      value={paymentReference}
                      onChange={(event) => setPaymentReference(event.target.value)}
                      className="admin-input w-full rounded-[1.2rem] px-4 py-3 text-sm outline-none"
                      placeholder="Card auth or transfer reference…"
                    />
                  </label>
                ) : null}

                <label className="block">
                  <span className="mb-2 block text-xs font-bold tracking-[0.16em] text-muted-foreground uppercase">
                    Internal Note
                  </span>
                  <textarea
                    name="pos_notes"
                    rows={3}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    className="admin-input w-full rounded-[1.2rem] px-4 py-3 text-sm outline-none"
                    placeholder="Optional shift or transaction note…"
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
                  type="button"
                  onClick={handleCompleteSale}
                  disabled={submitting || cart.items.length === 0 || totalGyd < 0}
                  className={cn(
                    "w-full rounded-[1.2rem] px-5 py-3.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50",
                    isTerminalView
                      ? "border border-primary/12 bg-[linear-gradient(135deg,#2d5016,#203c10)] text-white shadow-[0_18px_30px_rgb(32_60_16_/18%)]"
                      : "admin-button-primary"
                  )}
                >
                  {submitting ? "Completing sale…" : "Complete Sale"}
                </button>
              </div>
            </div>
          </PageSection>
        </div>
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

function PosViewModeToggle({
  viewMode,
  onChange,
  terminal = false,
}: {
  viewMode: PosViewMode;
  onChange: (mode: PosViewMode) => void;
  terminal?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-full p-1",
        terminal
          ? "border border-white/10 bg-white/8"
          : "border border-primary/10 bg-white/70"
      )}
    >
      {(["standard", "terminal"] as const).map((mode) => {
        const active = viewMode === mode;

        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-[background-color,color,transform]",
              terminal
                ? active
                  ? "bg-white text-[#16310c] shadow-[0_12px_24px_rgb(0_0_0_/16%)]"
                  : "text-white/72 hover:bg-white/10 hover:text-white"
                : active
                  ? "admin-button-primary"
                  : "text-muted-foreground hover:text-foreground"
            )}
          >
            {mode === "terminal" ? "Terminal View" : "Standard View"}
          </button>
        );
      })}
    </div>
  );
}

function PosMetricBadge({
  children,
  tone = "neutral",
  terminal = false,
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "amber" | "red";
  terminal?: boolean;
}) {
  const terminalToneClass = {
    neutral: "border-white/10 bg-white/8 text-white/78",
    green: "border-emerald-300/20 bg-emerald-300/12 text-emerald-50",
    amber: "border-amber-300/22 bg-amber-300/12 text-amber-50",
    red: "border-red-300/18 bg-red-400/10 text-red-50",
  }[tone];

  const defaultTone = {
    neutral: "border-primary/10 bg-white/70 text-primary/80",
    green: "border-primary/12 bg-primary/8 text-primary",
    amber: "border-amber-200/70 bg-amber-50 text-amber-800",
    red: "border-red-200/70 bg-red-50 text-red-700",
  }[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
        terminal ? terminalToneClass : defaultTone
      )}
    >
      {children}
    </span>
  );
}

function PosStockBadge({
  remaining,
  low,
  terminal = false,
}: {
  remaining: number;
  low: boolean;
  terminal?: boolean;
}) {
  const tone = remaining === 0 ? "red" : low ? "amber" : "green";
  return (
    <PosMetricBadge terminal={terminal} tone={tone}>
      {remaining} left
    </PosMetricBadge>
  );
}

function TerminalEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.7rem] border border-dashed border-white/14 bg-white/[0.04] p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/8">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-amber-100"
        >
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/62">
        {description}
      </p>
    </div>
  );
}

function PosTerminalBackdrop({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[980px] overflow-hidden rounded-[3rem]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(196,148,26,0.12),transparent_18%),radial-gradient(circle_at_88%_14%,rgba(45,80,22,0.12),transparent_18%),linear-gradient(180deg,rgba(12,25,7,0.14),transparent_76%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(45,80,22,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(45,80,22,0.06)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:linear-gradient(180deg,rgba(0,0,0,0.78),transparent_95%)]" />

      <motion.div
        aria-hidden
        className="absolute -left-12 top-20 h-56 w-56 rounded-full bg-amber-300/16 blur-3xl"
        animate={
          reduceMotion
            ? undefined
            : { x: [0, 20, -12, 0], y: [0, 14, -8, 0], scale: [1, 1.06, 0.98, 1] }
        }
        transition={{ duration: 20, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute right-[-3rem] top-28 h-72 w-72 rounded-full bg-emerald-300/14 blur-3xl"
        animate={
          reduceMotion
            ? undefined
            : { x: [0, -18, 12, 0], y: [0, -16, 10, 0], scale: [1, 0.96, 1.08, 1] }
        }
        transition={{ duration: 22, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute bottom-10 left-[24%] h-48 w-48 rounded-full bg-white/12 blur-3xl"
        animate={
          reduceMotion
            ? undefined
            : { x: [0, 16, -10, 0], y: [0, -10, 6, 0], opacity: [0.22, 0.34, 0.24, 0.22] }
        }
        transition={{ duration: 18, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />
    </div>
  );
}
