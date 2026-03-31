import { useEffect, useState } from "react";
import type { Category, Product } from "@/lib/api";

export interface ProductFormValues {
  name: string;
  categoryId: number;
  description: string;
  priceGyd: number;
  sku: string;
  trackStock: boolean;
  stockQty: number;
  lowStockThreshold: number;
  isActive: boolean;
}

const EMPTY_VALUES: ProductFormValues = {
  name: "",
  categoryId: 0,
  description: "",
  priceGyd: 0,
  sku: "",
  trackStock: false,
  stockQty: 0,
  lowStockThreshold: 5,
  isActive: true,
};

function toFormValues(product?: Product | null): ProductFormValues {
  if (!product) return EMPTY_VALUES;
  return {
    name: product.name,
    categoryId: product.categoryId,
    description: product.description,
    priceGyd: product.priceGyd,
    sku: product.sku ?? "",
    trackStock: product.trackStock,
    stockQty: product.stockQty,
    lowStockThreshold: product.lowStockThreshold,
    isActive: product.isActive,
  };
}

export function ProductForm({
  categories,
  product,
  saving,
  submitLabel,
  onSubmit,
}: {
  categories: Category[];
  product?: Product | null;
  saving?: boolean;
  submitLabel: string;
  onSubmit: (values: ProductFormValues) => Promise<void> | void;
}) {
  const [values, setValues] = useState<ProductFormValues>(toFormValues(product));

  useEffect(() => {
    setValues(toFormValues(product));
  }, [product]);

  useEffect(() => {
    if (values.categoryId !== 0 || categories.length === 0) return;
    setValues((current) => ({
      ...current,
      categoryId: categories[0]?.id ?? 0,
    }));
  }, [categories, values.categoryId]);

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        await onSubmit(values);
      }}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold tracking-wide text-muted-foreground uppercase">
            Product Name
          </span>
          <input
            required
            value={values.name}
            onChange={(event) =>
              setValues((current) => ({ ...current, name: event.target.value }))
            }
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2D5016]"
            placeholder="Bottled Water"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-bold tracking-wide text-muted-foreground uppercase">
            Category
          </span>
          <select
            required
            value={values.categoryId}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                categoryId: Number(event.target.value),
              }))
            }
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2D5016]"
          >
            <option value={0} disabled>
              Select a category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-bold tracking-wide text-muted-foreground uppercase">
            Price (GYD)
          </span>
          <input
            required
            type="number"
            min={0}
            value={values.priceGyd}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                priceGyd: Number(event.target.value),
              }))
            }
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2D5016]"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-bold tracking-wide text-muted-foreground uppercase">
            SKU
          </span>
          <input
            value={values.sku}
            onChange={(event) =>
              setValues((current) => ({ ...current, sku: event.target.value }))
            }
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2D5016]"
            placeholder="SKU-001"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-bold tracking-wide text-muted-foreground uppercase">
          Description
        </span>
        <textarea
          rows={4}
          value={values.description}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2D5016]"
          placeholder="Short internal description or notes for staff."
        />
      </label>

      <div className="rounded-2xl border border-border bg-muted/20 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold">Stock Tracking</p>
            <p className="text-xs text-muted-foreground">
              Turn this on for physical items sold at the park.
            </p>
          </div>
          <label className="inline-flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={values.trackStock}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  trackStock: event.target.checked,
                }))
              }
            />
            Track stock
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold tracking-wide text-muted-foreground uppercase">
              Current Stock
            </span>
            <input
              type="number"
              min={0}
              disabled={!values.trackStock}
              value={values.stockQty}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  stockQty: Number(event.target.value),
                }))
              }
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:bg-muted/60 focus:border-[#2D5016]"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold tracking-wide text-muted-foreground uppercase">
              Low Stock Threshold
            </span>
            <input
              type="number"
              min={0}
              disabled={!values.trackStock}
              value={values.lowStockThreshold}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  lowStockThreshold: Number(event.target.value),
                }))
              }
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:bg-muted/60 focus:border-[#2D5016]"
            />
          </label>
        </div>
      </div>

      <label className="inline-flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(event) =>
            setValues((current) => ({ ...current, isActive: event.target.checked }))
          }
        />
        Product is active
      </label>

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={saving || categories.length === 0 || values.categoryId === 0}
          className="rounded-full px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: "#2D5016" }}
        >
          {saving ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
