import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ProductForm, type ProductFormValues } from "@/components/ProductForm";
import { createProduct, getCategories, type Category } from "@/lib/api";

export const Route = createFileRoute("/products/new")({
  component: NewProductPage,
});

function NewProductPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCategories({ active: true })
      .then(setCategories)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(values: ProductFormValues) {
    setSaving(true);
    try {
      const created = await createProduct({
        ...values,
        sku: values.sku || null,
      });
      navigate({
        to: "/products/$id",
        params: { id: String(created.id) },
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <Link
        to="/products"
        className="mb-5 inline-block text-xs text-muted-foreground hover:text-foreground"
      >
        ← Back to products
      </Link>

      <div className="rounded-3xl border border-border bg-white p-6 md:p-8">
        <h1 className="text-2xl font-black">New Product</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a new item for the POS catalog and inventory workflow.
        </p>

        {loading ? (
          <div className="mt-6 text-sm text-muted-foreground">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
            Create at least one category on the Products page before adding items.
          </div>
        ) : (
          <div className="mt-6">
            <ProductForm
              categories={categories}
              submitLabel="Create Product"
              saving={saving}
              onSubmit={handleSubmit}
            />
          </div>
        )}
      </div>
    </div>
  );
}
