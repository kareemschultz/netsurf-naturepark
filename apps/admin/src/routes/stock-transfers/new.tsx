import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  createStockTransfer,
  dispatchStockTransfer,
  getProducts,
  type Product,
} from "@/lib/api";

export const Route = createFileRoute("/stock-transfers/new")({
  component: NewStockTransferPage,
});

type DraftLine = {
  productId: number;
  name: string;
  qtyDispatched: number;
};

function NewStockTransferPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [dispatchedBy, setDispatchedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number>(0);
  const [selectedQty, setSelectedQty] = useState(1);
  const [items, setItems] = useState<DraftLine[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProducts({ active: true, limit: 200 })
      .then((response) =>
        setProducts(response.data.filter((product) => product.trackStock))
      )
      .catch(console.error);
  }, []);

  function addItem() {
    const product = products.find((entry) => entry.id === selectedProductId);
    if (!product || selectedQty <= 0) return;

    setItems((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (existing) {
        return current.map((item) =>
          item.productId === product.id
            ? { ...item, qtyDispatched: item.qtyDispatched + selectedQty }
            : item
        );
      }
      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          qtyDispatched: selectedQty,
        },
      ];
    });
  }

  async function handleSave(dispatchNow: boolean) {
    if (!dispatchedBy.trim() || items.length === 0) return;
    setSaving(true);
    try {
      const created = await createStockTransfer({
        dispatchedBy,
        notes,
        items: items.map((item) => ({
          productId: item.productId,
          qtyDispatched: item.qtyDispatched,
        })),
      });

      if (dispatchNow) {
        await dispatchStockTransfer(created.id);
      }

      navigate({
        to: "/stock-transfers/$id",
        params: { id: String(created.id) },
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-8">
      <Link
        to="/stock-transfers"
        className="mb-5 inline-block text-xs text-muted-foreground hover:text-foreground"
      >
        ← Back to stock transfers
      </Link>

      <div className="rounded-3xl border border-border bg-white p-6 md:p-8">
        <h1 className="text-2xl font-black">New Stock Transfer</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Build a Georgetown dispatch and save it as draft or mark it dispatched.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold tracking-wide text-muted-foreground uppercase">
              Dispatched By
            </span>
            <input
              value={dispatchedBy}
              onChange={(event) => setDispatchedBy(event.target.value)}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2D5016]"
              placeholder="Staff member name"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold tracking-wide text-muted-foreground uppercase">
              Notes
            </span>
            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2D5016]"
              placeholder="Vehicle, route, packing notes..."
            />
          </label>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-muted/10 p-4">
          <h2 className="text-sm font-bold">Add Items</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_10rem_auto]">
            <select
              value={selectedProductId}
              onChange={(event) => setSelectedProductId(Number(event.target.value))}
              className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2D5016]"
            >
              <option value={0}>Select a product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={selectedQty}
              onChange={(event) => setSelectedQty(Number(event.target.value))}
              className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2D5016]"
            />
            <button
              onClick={addItem}
              className="rounded-full border border-border px-4 py-2 text-sm font-bold transition-colors hover:bg-white"
            >
              Add Item
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-8 text-center text-sm text-muted-foreground">
              Add at least one tracked product to this dispatch.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between rounded-2xl border border-border bg-muted/10 px-4 py-3"
              >
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.qtyDispatched} units dispatched
                  </p>
                </div>
                <button
                  onClick={() =>
                    setItems((current) =>
                      current.filter((entry) => entry.productId !== item.productId)
                    )
                  }
                  className="text-xs font-semibold text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            onClick={() => handleSave(false)}
            disabled={saving || !dispatchedBy.trim() || items.length === 0}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-bold transition-colors hover:bg-muted disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving || !dispatchedBy.trim() || items.length === 0}
            className="rounded-full px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#2D5016" }}
          >
            {saving ? "Saving..." : "Save & Dispatch"}
          </button>
        </div>
      </div>
    </div>
  );
}
