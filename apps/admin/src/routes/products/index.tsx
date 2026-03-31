import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  createCategory,
  deleteCategory,
  getCategories,
  getProducts,
  type Category,
  type Product,
} from "@/lib/api";
import { formatGYD } from "@workspace/shared";

export const Route = createFileRoute("/products/")({
  component: ProductsPage,
});

function ProductsPage() {
  const navigate = useNavigate();
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

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-black">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage sellable items, prices, stock rules, and product categories.
          </p>
        </div>
        <Link
          to="/products/new"
          className="rounded-full px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#2D5016" }}
        >
          + New Product
        </Link>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory("all")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                activeCategory === "all"
                  ? "text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
              style={activeCategory === "all" ? { backgroundColor: "#2D5016" } : undefined}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  activeCategory === category.id
                    ? "text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
                style={
                  activeCategory === category.id
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
            placeholder="Search by name, description, or SKU..."
            className="mb-4 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2D5016]"
          />

          <div className="overflow-hidden rounded-2xl border border-border">
            {loading ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                Loading products...
              </div>
            ) : products.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                No products matched that filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-5 py-3 text-left text-xs font-bold tracking-wide text-muted-foreground uppercase">
                        Product
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-bold tracking-wide text-muted-foreground uppercase">
                        Category
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-bold tracking-wide text-muted-foreground uppercase">
                        Price
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-bold tracking-wide text-muted-foreground uppercase">
                        Stock
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-bold tracking-wide text-muted-foreground uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className="cursor-pointer transition-colors hover:bg-muted/20"
                        onClick={() =>
                          navigate({
                            to: "/products/$id",
                            params: { id: String(product.id) },
                          })
                        }
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.sku || product.slug}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">
                          {product.categoryName ?? "Uncategorized"}
                        </td>
                        <td className="px-5 py-4 font-semibold">
                          {formatGYD(product.priceGyd)}
                        </td>
                        <td className="px-5 py-4">
                          {product.trackStock ? (
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                product.stockQty === 0
                                  ? "bg-red-100 text-red-700"
                                  : product.stockQty <= product.lowStockThreshold
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-green-100 text-green-700"
                              }`}
                            >
                              {product.stockQty} in stock
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Service / non-stock
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              product.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {product.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5">
          <h2 className="text-base font-bold">Categories</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Quick category setup for the POS catalog.
          </p>

          <div className="mt-4 space-y-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="rounded-2xl border border-border bg-muted/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{category.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {category.productCount ?? 0} products
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(category)}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
                {category.description && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {category.description}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-border bg-muted/10 p-4">
            <h3 className="text-sm font-bold">Add Category</h3>
            <div className="mt-3 space-y-3">
              <input
                value={newCategory.name}
                onChange={(event) =>
                  setNewCategory((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Food & Drinks"
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2D5016]"
              />
              <textarea
                rows={3}
                value={newCategory.description}
                onChange={(event) =>
                  setNewCategory((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Optional internal description"
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2D5016]"
              />
              <input
                type="number"
                min={0}
                value={newCategory.sortOrder}
                onChange={(event) =>
                  setNewCategory((current) => ({
                    ...current,
                    sortOrder: Number(event.target.value),
                  }))
                }
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2D5016]"
                placeholder="Sort order"
              />
              <button
                onClick={handleCreateCategory}
                disabled={savingCategory || !newCategory.name.trim()}
                className="w-full rounded-full px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: "#2D5016" }}
              >
                {savingCategory ? "Saving..." : "Create Category"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
