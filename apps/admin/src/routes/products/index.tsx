import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  createCategory,
  deleteCategory,
  getCategories,
  getProducts,
  type Category,
  type Product,
} from "@/lib/api";
import {
  AdminPage,
  EmptyState,
  MetricCard,
  PageHeader,
  PageSection,
  SectionTitle,
} from "@/components/AdminUI";
import { downloadCsv, exportPrintableReport } from "@/lib/export";
import { formatGYD } from "@workspace/shared";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";

export const Route = createFileRoute("/products/")({
  component: ProductsPage,
});

function ProductsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingCategory, setSavingCategory] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    sortOrder: 0,
  });

  useEffect(() => {
    setLoading(true);

    Promise.all([
      getCategories(),
      getProducts({
        categoryId: activeCategory === "all" ? undefined : activeCategory,
        search: search.trim() || undefined,
        limit: 100,
      }),
    ])
      .then(([categoryRows, productResponse]) => {
        setCategories(categoryRows);
        setProducts(productResponse.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeCategory, search, refreshKey]);

  const trackedProducts = useMemo(
    () => products.filter((product) => product.trackStock).length,
    [products]
  );
  const activeProducts = useMemo(
    () => products.filter((product) => product.isActive).length,
    [products]
  );
  const lowStockProducts = useMemo(
    () =>
      products.filter(
        (product) => product.trackStock && product.stockQty <= product.lowStockThreshold
      ).length,
    [products]
  );

  async function handleCreateCategory() {
    setSavingCategory(true);

    try {
      await createCategory({
        name: newCategory.name,
        description: newCategory.description,
        sortOrder: newCategory.sortOrder,
      });
      setNewCategory({ name: "", description: "", sortOrder: 0 });
      setRefreshKey((value) => value + 1);
    } finally {
      setSavingCategory(false);
    }
  }

  async function handleDeleteCategory(category: Category) {
    if (!window.confirm(`Delete category "${category.name}"?`)) return;

    await deleteCategory(category.id);
    if (activeCategory === category.id) setActiveCategory("all");
    setRefreshKey((value) => value + 1);
  }

  function handleExportCatalog() {
    downloadCsv(
      `netsurf-catalog-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "Name",
        "Category",
        "SKU",
        "Price (GYD)",
        "Track Stock",
        "Stock Qty",
        "Low Stock Threshold",
        "Status",
      ],
      products.map((product) => [
        product.name,
        product.categoryName ?? "Uncategorized",
        product.sku ?? "",
        product.priceGyd,
        product.trackStock ? "Yes" : "No",
        product.stockQty,
        product.lowStockThreshold,
        product.isActive ? "Active" : "Inactive",
      ])
    );
  }

  function handleExportCatalogPdf() {
    exportPrintableReport({
      title: "Catalog & Menu Sheet",
      subtitle:
        activeCategory === "all"
          ? "Current sellable catalog with pricing and stock posture."
          : `Filtered to ${categories.find((category) => category.id === activeCategory)?.name ?? "selected category"}.`,
      generatedAt: new Date().toLocaleString(),
      metrics: [
        { label: "Products", value: String(products.length), note: `${activeProducts} active` },
        {
          label: "Tracked",
          value: String(trackedProducts),
          note: `${lowStockProducts} low-stock items`,
        },
        { label: "Categories", value: String(categories.length), note: "POS menu groups" },
      ],
      sections: [
        {
          title: "Catalog",
          columns: [
            "Product",
            "Category",
            "SKU",
            "Price",
            "Tracked",
            "Stock",
            "Threshold",
            "Status",
          ],
          rows: products.map((product) => [
            product.name,
            product.categoryName ?? "Uncategorized",
            product.sku ?? "",
            formatGYD(product.priceGyd),
            product.trackStock ? "Yes" : "No",
            product.trackStock ? product.stockQty : "Service",
            product.trackStock ? product.lowStockThreshold : "N/A",
            product.isActive ? "Active" : "Inactive",
          ]),
        },
        {
          title: "Categories",
          columns: ["Category", "Products", "Description"],
          rows: categories.map((category) => [
            category.name,
            category.productCount ?? 0,
            category.description || "No description",
          ]),
        },
      ],
    });
  }

  const activeCategoryName =
    activeCategory === "all"
      ? "All categories"
      : categories.find((category) => category.id === activeCategory)?.name ?? "Selected category";

  return (
    <AdminPage className="max-w-[1500px]">
      <PageHeader
        eyebrow="Catalog"
        title="Menus, categories, and sellable items"
        description="Shape the front-of-house catalog with clear categories, pricing, and stock-aware status. This view is tuned for quick staff scanning, seeded beverage products, and export-ready menu snapshots."
        actions={
          <>
            <Button variant="outline" onClick={handleExportCatalog}>
              Export CSV
            </Button>
            <Button variant="outline" onClick={handleExportCatalogPdf}>
              Export PDF
            </Button>
            <Link to="/products/new">
              <Button>New Product</Button>
            </Link>
          </>
        }
        meta={
          <>
            <Badge variant="secondary">{products.length} products in view</Badge>
            <Badge variant="outline">{activeCategoryName}</Badge>
            {lowStockProducts > 0 ? (
              <Badge variant="destructive">{lowStockProducts} low-stock items</Badge>
            ) : (
              <Badge variant="secondary">Inventory levels stable</Badge>
            )}
          </>
        }
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Catalog View"
          value={String(products.length)}
          note="Products in the active filter set"
        />
        <MetricCard
          label="Active Items"
          value={String(activeProducts)}
          note="Visible to the POS terminal"
          tone="green"
        />
        <MetricCard
          label="Tracked SKUs"
          value={String(trackedProducts)}
          note="Stock-controlled products"
          tone="slate"
        />
        <MetricCard
          label="Low-Stock Risk"
          value={String(lowStockProducts)}
          note="Products at or below threshold"
          tone={lowStockProducts > 0 ? "amber" : "green"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_24rem]">
        <PageSection className="p-6 sm:p-7">
          <SectionTitle
            title="Catalog Browser"
            description="Filter by category, refine the menu search, and open any product for detailed edits."
            action={
              activeCategory !== "all" || search ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveCategory("all");
                    setSearch("");
                  }}
                >
                  Reset Filters
                </Button>
              ) : null
            }
          />

          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory("all")}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>

          <div className="mt-4">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, description, or SKU…"
              aria-label="Search products"
            />
          </div>

          {loading ? (
            <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground">
              Loading products…
            </div>
          ) : products.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="No products matched this view"
                description="Try another category or search term. Seeded beverage products remain available once the filters are cleared."
                action={
                  <Button
                    onClick={() => {
                      setActiveCategory("all");
                      setSearch("");
                    }}
                  >
                    Clear Filters
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
              {products.map((product) => {
                const stockTone =
                  !product.trackStock
                    ? "neutral"
                    : product.stockQty === 0
                      ? "red"
                      : product.stockQty <= product.lowStockThreshold
                        ? "amber"
                        : "green";

                return (
                  <Link
                    key={product.id}
                    to="/products/$id"
                    params={{ id: String(product.id) }}
                    className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-border/80 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-black tracking-tight text-foreground">
                          {product.name}
                        </p>
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {product.categoryName ?? "Uncategorized"}
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {formatGYD(product.priceGyd)}
                      </Badge>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge
                        variant={
                          stockTone === "red"
                            ? "destructive"
                            : stockTone === "amber"
                              ? "outline"
                              : "secondary"
                        }
                      >
                        {product.trackStock ? `${product.stockQty} in stock` : "Service item"}
                      </Badge>
                      <Badge variant={product.isActive ? "secondary" : "outline"}>
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm">
                      <div>
                        <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-muted-foreground">
                          SKU
                        </p>
                        <p className="mt-1 truncate font-semibold text-foreground">
                          {product.sku || product.slug}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-muted-foreground">
                          Threshold
                        </p>
                        <p className="mt-1 font-semibold text-foreground">
                          {product.trackStock ? product.lowStockThreshold : "N/A"}
                        </p>
                      </div>
                    </div>

                    {product.description ? (
                      <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {product.description}
                      </p>
                    ) : (
                      <p className="mt-4 text-sm leading-6 text-muted-foreground">
                        No internal description yet.
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </PageSection>

        <PageSection className="p-6 sm:p-7">
          <SectionTitle
            title="Category Control"
            description="Keep the menu structure tight so staff can scan the POS quickly."
          />

          <div className="space-y-3">
            {categories.length === 0 ? (
              <EmptyState
                title="No categories yet"
                description="Create the first category to organize the menu and product catalog."
              />
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-foreground">{category.name}</p>
                      <p className="mt-1 text-xs font-semibold text-muted-foreground">
                        {category.productCount ?? 0} products
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteCategory(category)}
                    >
                      Delete
                    </Button>
                  </div>

                  {category.description ? (
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {category.description}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </div>

          <div className="mt-5 rounded-xl border border-border bg-muted/30 p-5">
            <h3 className="text-base font-black tracking-tight text-foreground">
              Add Category
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a new menu group with a clean staff-facing label and optional note.
            </p>

            <div className="mt-4 space-y-3">
              <FieldLabel label="Category Name">
                <Input
                  name="category_name"
                  autoComplete="off"
                  value={newCategory.name}
                  onChange={(event) =>
                    setNewCategory((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Soft Drinks…"
                />
              </FieldLabel>

              <FieldLabel label="Internal Description">
                <textarea
                  name="category_description"
                  rows={3}
                  autoComplete="off"
                  value={newCategory.description}
                  onChange={(event) =>
                    setNewCategory((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Optional internal description…"
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </FieldLabel>

              <FieldLabel label="Sort Order">
                <Input
                  type="number"
                  min={0}
                  name="category_sort_order"
                  inputMode="numeric"
                  value={newCategory.sortOrder}
                  onChange={(event) =>
                    setNewCategory((current) => ({
                      ...current,
                      sortOrder: Number(event.target.value),
                    }))
                  }
                  placeholder="0"
                />
              </FieldLabel>

              <Button
                type="button"
                className="w-full"
                onClick={handleCreateCategory}
                disabled={savingCategory || !newCategory.name.trim()}
              >
                {savingCategory ? "Saving…" : "Create Category"}
              </Button>
            </div>
          </div>
        </PageSection>
      </div>
    </AdminPage>
  );
}

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold tracking-[0.18em] uppercase text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
