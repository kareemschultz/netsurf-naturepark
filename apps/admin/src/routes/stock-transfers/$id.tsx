import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  dispatchStockTransfer,
  getProduct,
  getProducts,
  getStockTransfer,
  receiveStockTransfer,
  updateStockTransfer,
  type Product,
  type StockTransferDetail,
} from "@/lib/api";

export const Route = createFileRoute("/stock-transfers/$id")({
  component: StockTransferDetailPage,
});

type EditableLine = {
  productId: number;
  name: string;
  qtyDispatched: number;
};

type ReceiveLine = {
  id: number;
  qtyReceived: number;
  discrepancyNotes: string;
};

function StockTransferDetailPage() {
  const { id } = Route.useParams();
  const [transfer, setTransfer] = useState<StockTransferDetail | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draftDispatcher, setDraftDispatcher] = useState("");
  const [draftNotes, setDraftNotes] = useState("");
  const [draftItems, setDraftItems] = useState<EditableLine[]>([]);
  const [selectedProductId, setSelectedProductId] = useState(0);
  const [selectedQty, setSelectedQty] = useState(1);
  const [receivedBy, setReceivedBy] = useState("");
  const [receiveItems, setReceiveItems] = useState<ReceiveLine[]>([]);

  async function loadTransfer() {
    const transferResponse = await getStockTransfer(Number(id));
    setTransfer(transferResponse);
    setDraftDispatcher(transferResponse.dispatchedBy);
    setDraftNotes(transferResponse.notes);
    setDraftItems(
      transferResponse.items.map((item) => ({
        productId: item.productId,
        name: item.productNameSnapshot,
        qtyDispatched: item.qtyDispatched,
      }))
    );
    setReceiveItems(
      transferResponse.items.map((item) => ({
        id: item.id,
        qtyReceived: item.qtyReceived ?? item.qtyDispatched,
        discrepancyNotes: item.discrepancyNotes,
      }))
    );
  }

  useEffect(() => {
    Promise.all([
      loadTransfer(),
      getProducts({ active: true, limit: 200 }),
    ])
      .then(([, productResponse]) =>
        setProducts(productResponse.data.filter((product) => product.trackStock))
      )
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  function addDraftItem() {
    const product = products.find((entry) => entry.id === selectedProductId);
    if (!product || selectedQty <= 0) return;

    setDraftItems((current) => {
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

  async function saveDraft() {
    if (!transfer) return;
    setSaving(true);
    try {
      const updated = await updateStockTransfer(transfer.id, {
        dispatchedBy: draftDispatcher,
        notes: draftNotes,
        items: draftItems.map((item) => ({
          productId: item.productId,
          qtyDispatched: item.qtyDispatched,
        })),
      });
      setTransfer(updated);
      await loadTransfer();
    } finally {
      setSaving(false);
    }
  }

  async function handleDispatch() {
    if (!transfer) return;
    setSaving(true);
    try {
      await updateStockTransfer(transfer.id, {
        dispatchedBy: draftDispatcher,
        notes: draftNotes,
        items: draftItems.map((item) => ({
          productId: item.productId,
          qtyDispatched: item.qtyDispatched,
        })),
      });
      await dispatchStockTransfer(transfer.id);
      await loadTransfer();
    } finally {
      setSaving(false);
    }
  }

  async function handleReceive() {
    if (!transfer || !receivedBy.trim()) return;
    setSaving(true);
    try {
      const updated = await receiveStockTransfer({
        id: transfer.id,
        receivedBy,
        items: receiveItems,
      });
      setTransfer(updated);
      await loadTransfer();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading transfer...</div>;
  }

  if (!transfer) return null;

  return (
    <div className="mx-auto max-w-5xl p-8">
      <Link
        to="/stock-transfers"
        className="mb-5 inline-block text-xs text-muted-foreground hover:text-foreground"
      >
        ← Back to stock transfers
      </Link>

      <div className="rounded-3xl border border-border bg-white p-6 md:p-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
              Stock Transfer
            </p>
            <h1 className="text-2xl font-black">{transfer.transferNumber}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Created {new Date(transfer.createdAt).toLocaleString()}
            </p>
          </div>
          <span
            className={`rounded-full px-4 py-2 text-sm font-bold ${
              transfer.status === "draft"
                ? "bg-gray-100 text-gray-600"
                : transfer.status === "dispatched"
                  ? "bg-amber-100 text-amber-700"
                  : transfer.status === "partial"
                    ? "bg-orange-100 text-orange-700"
                    : "bg-green-100 text-green-700"
            }`}
          >
            {transfer.status}
          </span>
        </div>

        {transfer.status === "draft" && (
          <div className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <input
                value={draftDispatcher}
                onChange={(event) => setDraftDispatcher(event.target.value)}
                className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2D5016]"
                placeholder="Dispatcher name"
              />
              <input
                value={draftNotes}
                onChange={(event) => setDraftNotes(event.target.value)}
                className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2D5016]"
                placeholder="Vehicle or packing notes"
              />
            </div>

            <div className="rounded-2xl border border-border bg-muted/10 p-4">
              <h2 className="text-sm font-bold">Draft Items</h2>
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
                  onClick={addDraftItem}
                  className="rounded-full border border-border px-4 py-2 text-sm font-bold transition-colors hover:bg-white"
                >
                  Add
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {draftItems.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between rounded-2xl border border-border bg-white px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.qtyDispatched} units
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setDraftItems((current) =>
                          current.filter((entry) => entry.productId !== item.productId)
                        )
                      }
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                onClick={saveDraft}
                disabled={saving || !draftDispatcher.trim() || draftItems.length === 0}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-bold transition-colors hover:bg-muted disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Draft"}
              </button>
              <button
                onClick={handleDispatch}
                disabled={saving || !draftDispatcher.trim() || draftItems.length === 0}
                className="rounded-full px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#2D5016" }}
              >
                {saving ? "Saving..." : "Mark Dispatched"}
              </button>
            </div>
          </div>
        )}

        {transfer.status === "dispatched" && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-muted/10 p-4">
              <h2 className="text-sm font-bold">Verify Receipt</h2>
              <input
                value={receivedBy}
                onChange={(event) => setReceivedBy(event.target.value)}
                className="mt-3 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2D5016]"
                placeholder="Receiving staff name"
              />
            </div>

            <div className="space-y-3">
              {transfer.items.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border bg-muted/10 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.productNameSnapshot}</p>
                      <p className="text-sm text-muted-foreground">
                        Expected {item.qtyDispatched}
                      </p>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={item.qtyDispatched}
                      value={receiveItems[index]?.qtyReceived ?? item.qtyDispatched}
                      onChange={(event) =>
                        setReceiveItems((current) =>
                          current.map((entry) =>
                            entry.id === item.id
                              ? { ...entry, qtyReceived: Number(event.target.value) }
                              : entry
                          )
                        )
                      }
                      className="w-24 rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-[#2D5016]"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={receiveItems[index]?.discrepancyNotes ?? ""}
                    onChange={(event) =>
                      setReceiveItems((current) =>
                        current.map((entry) =>
                          entry.id === item.id
                            ? { ...entry, discrepancyNotes: event.target.value }
                            : entry
                        )
                      )
                    }
                    className="mt-3 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2D5016]"
                    placeholder="Discrepancy notes (broken, missing, etc.)"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleReceive}
                disabled={saving || !receivedBy.trim()}
                className="rounded-full px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#2D5016" }}
              >
                {saving ? "Saving..." : "Verify Receipt"}
              </button>
            </div>
          </div>
        )}

        {(transfer.status === "received" || transfer.status === "partial") && (
          <div className="space-y-3">
            {transfer.items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-border bg-muted/10 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{item.productNameSnapshot}</p>
                  <span className="text-sm text-muted-foreground">
                    {item.qtyReceived ?? 0}/{item.qtyDispatched} received
                  </span>
                </div>
                {item.discrepancyNotes && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.discrepancyNotes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
