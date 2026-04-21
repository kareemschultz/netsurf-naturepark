import { useDeferredValue, useEffect, useReducer, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  createSale,
  getPosProducts,
  type CompletedSaleResponse,
  type Product,
} from "@/lib/api";
import { AdminPage } from "@/components/AdminUI";
import { formatGYD, paymentMethods, type PaymentMethod } from "@workspace/shared";
import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Input } from "@workspace/ui/components/input";
import { Separator } from "@workspace/ui/components/separator";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";

export const Route = createFileRoute("/pos")({
  component: PosPage,
});

// --- Cart state ---

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

// --- Page ---

function PosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFocus, setStockFocus] = useState<StockFocus>("all");
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

  // Opens an isolated print window for the completed sale receipt.
  function printReceipt() {
    if (!receipt) return;

    const win = window.open("", "_blank", "width=720,height=900");
    if (!win) return;

    const itemsHtml = receipt.items
      .map(
        (item) =>
          `<tr><td>${item.productName}</td><td>${item.quantity}</td><td>${formatGYD(item.lineTotalGyd)}</td></tr>`
      )
      .join("");

    const receiptHtml = [
      "<!doctype html><html><head>",
      '<meta charset="utf-8"/>',
      `<title>${receipt.sale.saleNumber}</title>`,
      "<style>",
      'body{font-family:"DM Sans","Segoe UI",sans-serif;padding:32px;color:#1f2d18}',
      ".card{border:1px solid #dbe5d5;border-radius:28px;padding:24px}",
      ".eyebrow{font-size:11px;text-transform:uppercase;letter-spacing:.2em;color:#64715d;font-weight:700}",
      "h1{margin:8px 0 0;font-size:32px}",
      ".muted{color:#64715d}",
      "table{width:100%;border-collapse:collapse;margin-top:18px}",
      "th,td{text-align:left;padding:12px 0;border-bottom:1px solid #dbe5d5;font-size:14px}",
      "th{font-size:11px;text-transform:uppercase;letter-spacing:.15em;color:#64715d}",
      ".totals{margin-top:18px}",
      ".totals div{display:flex;justify-content:space-between;padding:6px 0}",
      ".total{font-weight:800;font-size:18px;color:#1f4120;border-top:1px solid #dbe5d5;margin-top:8px;padding-top:12px}",
      "</style></head><body>",
      '<section class="card">',
      '<p class="eyebrow">Netsurf Nature Park</p>',
      `<h1>${receipt.sale.saleNumber}</h1>`,
      `<p class="muted">${new Date(receipt.sale.createdAt).toLocaleString()}</p>`,
      "<table><thead><tr><th>Item</th><th>Qty</th><th>Total</th></tr></thead>",
      `<tbody>${itemsHtml}</tbody></table>`,
      '<div class="totals">',
      `<div><span>Subtotal</span><span>${formatGYD(receipt.sale.subtotalGyd)}</span></div>`,
      `<div><span>Discount</span><span>${formatGYD(receipt.sale.discountGyd)}</span></div>`,
      `<div><span>Tax</span><span>${formatGYD(receipt.sale.taxGyd)}</span></div>`,
      `<div class="total"><span>Total</span><span>${formatGYD(receipt.sale.totalGyd)}</span></div>`,
      "</div></section></body></html>",
    ].join("");

    win.document.open();
    win.document.write(receiptHtml);
    win.document.close();
    win.focus();
    win.print();
  }

  // --- Receipt / sale-complete view ---
  if (receipt) {
    return (
      <AdminPage className="max-w-[1680px]">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-full max-w-lg">
            <Card className="shadow-lg">
              <CardHeader className="pb-2 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-green-600"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Sale Complete
                </p>
                <CardTitle className="text-2xl font-bold">{receipt.sale.saleNumber}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {new Date(receipt.sale.createdAt).toLocaleString()}
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="space-y-2">
                    {receipt.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="text-foreground">
                          {item.productName} &times; {item.quantity}
                        </span>
                        <span className="font-semibold text-foreground">
                          {formatGYD(item.lineTotalGyd)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-3" />
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatGYD(receipt.sale.subtotalGyd)}</span>
                    </div>
                    {receipt.sale.discountGyd > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Discount</span>
                        <span className="text-green-600">
                          -{formatGYD(receipt.sale.discountGyd)}
                        </span>
                      </div>
                    )}
                    {receipt.sale.taxGyd > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Tax</span>
                        <span>{formatGYD(receipt.sale.taxGyd)}</span>
                      </div>
                    )}
                    <Separator className="my-1" />
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-base font-bold text-foreground">Total</span>
                      <span className="text-2xl font-bold text-primary">
                        {formatGYD(receipt.sale.totalGyd)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={printReceipt} className="flex-1">
                    Print Receipt
                  </Button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Receipt for sale ${receipt.sale.saleNumber}. Total: ${formatGYD(receipt.sale.totalGyd)}.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-1 items-center justify-center rounded-md bg-[#25D366] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    Share on WhatsApp
                  </a>
                </div>
                <Button className="w-full" onClick={() => setReceipt(null)}>
                  New Sale
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminPage>
    );
  }

  // --- Main POS layout ---
  return (
    <AdminPage className="max-w-[1680px]">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            POS
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Point of Sale
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline">{products.length} products</Badge>
            <Badge
              variant="outline"
              className={cn(
                lowStockCatalog > 0
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-primary/20 bg-primary/10 text-primary"
              )}
            >
              {lowStockCatalog} low-stock
            </Badge>
            {cartUnits > 0 && (
              <Badge
                variant="outline"
                className="border-primary/20 bg-primary/10 text-primary"
              >
                {cartUnits} in cart
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/products">
            <Button variant="outline" size="sm">
              Manage Catalog
            </Button>
          </Link>
          <Link to="/sales">
            <Button size="sm">View Sales</Button>
          </Link>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Two-panel layout */}
      <div className="flex min-h-[calc(100vh-14rem)] flex-col gap-6 md:flex-row md:items-start">
        {/* Products panel */}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name, description, or SKU..."
              className="pl-9"
              aria-label="Search POS catalog"
              name="pos_search"
              autoComplete="off"
            />
          </div>

          {/* Category + stock filters */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setCategoryFilter(cat.slug)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                    categoryFilter === cat.slug
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["all", "available", "low"] as const).map((focus) => {
                const label =
                  focus === "all" ? "All Stock" : focus === "available" ? "Available Now" : "Low Stock";
                return (
                  <button
                    key={focus}
                    type="button"
                    onClick={() => setStockFocus(focus)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      stockFocus === focus
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
              {(search || categoryFilter !== "all" || stockFocus !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCategoryFilter("all");
                    setStockFocus("all");
                  }}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Product grid */}
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-xl" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
              </div>
              <p className="font-semibold text-foreground">No products match</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Try a different category, search term, or stock filter.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {filteredProducts.map((product) => {
                const cartQuantity =
                  cart.items.find((item) => item.product.id === product.id)?.quantity ?? 0;
                const isOutOfStock = product.trackStock && product.stockQty <= cartQuantity;
                const remainingStock = Math.max(product.stockQty - cartQuantity, 0);

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => dispatch({ type: "ADD_ITEM", product })}
                    disabled={isOutOfStock}
                    className={cn(
                      "group relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-150",
                      isOutOfStock
                        ? "cursor-not-allowed border-border bg-muted/40 opacity-60"
                        : "border-border bg-card hover:border-primary/40 hover:ring-2 hover:ring-primary/20 hover:shadow-md"
                    )}
                  >
                    {isOutOfStock && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60">
                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                          Out of stock
                        </span>
                      </div>
                    )}
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {product.categoryName ?? "Uncategorized"}
                    </p>
                    <h2 className="mt-2 text-base font-bold leading-tight tracking-tight text-foreground">
                      {product.name}
                    </h2>
                    {product.description && (
                      <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {product.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-lg font-bold text-primary">
                        {formatGYD(product.priceGyd)}
                      </span>
                      {product.trackStock ? (
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                            remainingStock === 0
                              ? "border-red-200 bg-red-50 text-red-700"
                              : remainingStock <= product.lowStockThreshold
                                ? "border-amber-200 bg-amber-50 text-amber-800"
                                : "border-primary/20 bg-primary/10 text-primary"
                          )}
                        >
                          {remainingStock} left
                        </span>
                      ) : (
                        <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          Non-stock
                        </span>
                      )}
                    </div>
                    {product.sku && (
                      <p className="mt-2 text-[10px] text-muted-foreground">SKU {product.sku}</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart panel */}
        <div className="w-full md:sticky md:top-6 md:w-[380px] md:shrink-0">
          <Card className="flex flex-col shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold">Current Order</CardTitle>
                  {cart.items.length > 0 && (
                    <Badge variant="secondary" className="rounded-full px-2 text-xs">
                      {cartUnits}
                    </Badge>
                  )}
                </div>
                {cart.items.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={() => dispatch({ type: "CLEAR_CART" })}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-5 pt-0">
              {cart.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mb-2 text-muted-foreground/50"
                  >
                    <circle cx="8" cy="21" r="1" />
                    <circle cx="19" cy="21" r="1" />
                    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                  </svg>
                  <p className="text-sm font-medium text-muted-foreground">Cart is empty</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">Tap a product to add it</p>
                </div>
              ) : (
                <ScrollArea className="max-h-64">
                  <div className="space-y-2 pr-2">
                    {cart.items.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-start justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatGYD(item.product.priceGyd)} each
                          </p>
                          <div className="mt-2 flex items-center gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-full text-xs"
                              onClick={() =>
                                dispatch({
                                  type: "UPDATE_QTY",
                                  productId: item.product.id,
                                  quantity: item.quantity - 1,
                                })
                              }
                            >
                              -
                            </Button>
                            <span className="w-6 text-center text-sm font-bold tabular-nums text-foreground">
                              {item.quantity}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-full text-xs"
                              onClick={() =>
                                dispatch({
                                  type: "UPDATE_QTY",
                                  productId: item.product.id,
                                  quantity: item.quantity + 1,
                                })
                              }
                              disabled={
                                item.product.trackStock &&
                                item.quantity >= item.product.stockQty
                              }
                            >
                              +
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 pt-0.5">
                          <p className="text-sm font-bold text-primary">
                            {formatGYD(item.product.priceGyd * item.quantity)}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              dispatch({ type: "REMOVE_ITEM", productId: item.product.id })
                            }
                            className="text-[10px] font-semibold text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              <Separator />

              {/* Discount & Tax */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="discount_gyd"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Discount (GYD)
                  </label>
                  <Input
                    id="discount_gyd"
                    type="number"
                    name="discount_gyd"
                    inputMode="numeric"
                    min={0}
                    value={cart.discountGyd}
                    onChange={(e) =>
                      dispatch({ type: "APPLY_DISCOUNT", discountGyd: Number(e.target.value) })
                    }
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="tax_gyd"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Tax (GYD)
                  </label>
                  <Input
                    id="tax_gyd"
                    type="number"
                    name="tax_gyd"
                    inputMode="numeric"
                    min={0}
                    value={cart.taxGyd}
                    onChange={(e) =>
                      dispatch({ type: "APPLY_TAX", taxGyd: Number(e.target.value) })
                    }
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              {/* Payment method tabs */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Payment Method
                </p>
                <Tabs
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                >
                  <TabsList className="h-auto w-full flex-wrap gap-1 bg-muted/60 p-1">
                    {paymentMethods.map((method) => (
                      <TabsTrigger
                        key={method.value}
                        value={method.value}
                        className="flex-1 rounded-lg text-xs"
                      >
                        {method.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              {/* Reference */}
              {(paymentMethod === "card" || paymentMethod === "transfer") && (
                <div>
                  <label
                    htmlFor="payment_reference"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Reference
                  </label>
                  <Input
                    id="payment_reference"
                    name="payment_reference"
                    autoComplete="off"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Card auth or transfer reference..."
                    className="h-9 text-sm"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label
                  htmlFor="pos_notes"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Internal Note
                </label>
                <textarea
                  id="pos_notes"
                  name="pos_notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional shift or transaction note..."
                  className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/70"
                />
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium tabular-nums">{formatGYD(subtotalGyd)}</span>
                </div>
                {cart.discountGyd > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium tabular-nums text-green-600">
                      -{formatGYD(cart.discountGyd)}
                    </span>
                  </div>
                )}
                {cart.taxGyd > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium tabular-nums">{formatGYD(cart.taxGyd)}</span>
                  </div>
                )}
                <Separator className="my-1" />
                <div className="flex items-center justify-between pt-1">
                  <span className="text-base font-bold text-foreground">Total</span>
                  <span className="text-2xl font-bold text-primary tabular-nums">
                    {formatGYD(totalGyd)}
                  </span>
                </div>
              </div>

              {/* Charge button */}
              <Button
                type="button"
                size="lg"
                className="w-full text-base font-bold"
                onClick={handleCompleteSale}
                disabled={submitting || cart.items.length === 0 || totalGyd < 0}
              >
                {submitting
                  ? "Completing sale..."
                  : cart.items.length > 0
                    ? `Charge ${formatGYD(totalGyd)}`
                    : "Add items to charge"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminPage>
  );
}
