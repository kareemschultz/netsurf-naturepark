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
  FilterChip,
  InfoPill,
  MetricCard,
  PageHeader,
  PageSection,
  SearchField,
  SectionTitle,
} from "@/components/AdminUI";
import { downloadCsv, exportPrintableReport } from "@/lib/export";
import { formatGYD } from "@workspace/shared";

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
            <button
              type="button"
              onClick={handleExportCatalog}
              className="admin-button-secondary rounded-full px-5 py-3 text-sm font-bold"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={handleExportCatalogPdf}
              className="admin-button-secondary rounded-full px-5 py-3 text-sm font-bold"
            >
              Export PDF
            </button>
            <Link
              to="/products/new"
              className="admin-button-primary rounded-full px-5 py-3 text-sm font-bold"
            >
              New Product
            </Link>
          </>
        }
        meta={
          <>
            <InfoPill tone="green">{products.length} products in view</InfoPill>
            <InfoPill>{activeCategoryName}</InfoPill>
            {lowStockProducts > 0 ? (
              <InfoPill tone="amber">{lowStockProducts} low-stock items</InfoPill>
            ) : (
              <InfoPill tone="green">Inventory levels stable</InfoPill>
            )}
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory("all");
                    setSearch("");
                  }}
                  className="admin-button-secondary rounded-full px-4 py-2 text-sm font-semibold"
                >
                  Reset Filters
                </button>
              ) : null
            }
          />

          <div className="flex flex-wrap gap-2">
            <FilterChip
              type="button"
              active={activeCategory === "all"}
              onClick={() => setActiveCategory("all")}
            >
              All
            </FilterChip>
            {categories.map((category) => (
              <FilterChip
                key={category.id}
                type="button"
                active={activeCategory === category.id}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.name}
              </FilterChip>
            ))}
          </div>

          <div className="mt-4">
            <SearchField
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              label="Search products"
              placeholder="Search by name, description, or SKU…"
              inputProps={{ name: "product_search" }}
            />
          </div>

          {loading ? (
            <div className="mt-6 rounded-[1.7rem] border border-dashed border-primary/14 bg-primary/4 px-6 py-12 text-center text-sm text-muted-foreground">
              Loading products…
            </div>
          ) : products.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="No products matched this view"
                description="Try another category or search term. Seeded beverage products remain available once the filters are cleared."
                action={
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategory("all");
                      setSearch("");
                    }}
                    className="admin-button-primary rounded-full px-4 py-2.5 text-sm font-bold"
                  >
                    Clear Filters
                  </button>
                }
              />
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
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
                    className="group rounded-[1.7rem] border border-primary/10 bg-white/72 p-5 shadow-[0_18px_40px_rgb(22_36_12_/6%)] transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/18 hover:shadow-[0_24px_50px_rgb(22_36_12_/10%)]"
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
                      <span className="rounded-full border border-primary/10 bg-primary/6 px-3 py-1 text-xs font-semibold text-primary">
                        {formatGYD(product.priceGyd)}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <InfoPill tone={stockTone}>
                        {product.trackStock
                          ? `${product.stockQty} in stock`
                          : "Service item"}
                      </InfoPill>
                      <InfoPill tone={product.isActive ? "green" : "neutral"}>
                        {product.isActive ? "Active" : "Inactive"}
                      </InfoPill>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 rounded-[1.3rem] border border-primary/8 bg-primary/4 p-4 text-sm">
                      <div>
                        <p className="text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
                          SKU
                        </p>
                        <p className="mt-1 truncate font-semibold text-foreground">
                          {product.sku || product.slug}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
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
                  className="rounded-[1.4rem] border border-primary/10 bg-white/78 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-foreground">{category.name}</p>
                      <p className="mt-1 text-xs font-semibold text-muted-foreground">
                        {category.productCount ?? 0} products
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(category)}
                      className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-[background-color,border-color,color] hover:border-red-300 hover:bg-red-100"
                    >
                      Delete
                    </button>
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

          <div className="mt-5 rounded-[1.6rem] border border-primary/10 bg-primary/4 p-5">
            <h3 className="text-base font-black tracking-tight text-foreground">
              Add Category
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a new menu group with a clean staff-facing label and optional note.
            </p>

            <div className="mt-4 space-y-3">
              <FieldLabel label="Category Name">
                <input
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
                  className="admin-input w-full rounded-[1.2rem] px-4 py-3 text-sm outline-none"
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
                  className="admin-input w-full rounded-[1.4rem] px-4 py-3 text-sm outline-none"
                />
              </FieldLabel>

              <FieldLabel label="Sort Order">
                <input
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
                  className="admin-input w-full rounded-[1.2rem] px-4 py-3 text-sm outline-none"
                />
              </FieldLabel>

              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={savingCategory || !newCategory.name.trim()}
                className="admin-button-primary w-full rounded-full px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingCategory ? "Saving…" : "Create Category"}
              </button>
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
    <label className="block">
      <span className="mb-2 block text-xs font-bold tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}
