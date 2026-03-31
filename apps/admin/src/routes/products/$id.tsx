import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ProductForm, type ProductFormValues } from "@/components/ProductForm";
import {
  deleteProduct,
  getCategories,
  getProduct,
  updateProduct,
  type Category,
  type Product,
} from "@/lib/api";

export const Route = createFileRoute("/products/$id")({
  component: EditProductPage,
});

function EditProductPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getCategories(), getProduct(Number(id))])
      .then(([categoryRows, productRow]) => {
        setCategories(categoryRows);
        setProduct(productRow);
      })
      .catch(() => navigate({ to: "/products" }))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(values: ProductFormValues) {
    setSaving(true);
    try {
      const updated = await updateProduct(Number(id), {
        ...values,
        sku: values.sku || null,
      });
      setProduct(updated);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!window.confirm("Deactivate this product?")) return;
    setSaving(true);
    try {
      const updated = await deleteProduct(Number(id));
      setProduct(updated);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading product...</div>;
  }

  if (!product) return null;

  return (
    <div className="mx-auto max-w-4xl p-8">
      <Link
        to="/products"
        className="mb-5 inline-block text-xs text-muted-foreground hover:text-foreground"
      >
        ← Back to products
      </Link>

      <div className="rounded-3xl border border-border bg-white p-6 md:p-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-black">{product.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Update product details, pricing, and stock tracking rules.
            </p>
          </div>
          {product.isActive && (
            <button
              onClick={handleDeactivate}
              disabled={saving}
              className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
            >
              Deactivate
            </button>
          )}
        </div>

        <ProductForm
          categories={categories}
          product={product}
          saving={saving}
          submitLabel="Save Changes"
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
