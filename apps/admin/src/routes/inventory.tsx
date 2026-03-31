import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  adjustInventory,
  getInventory,
  getInventoryAlerts,
  getStockMovements,
  restockInventory,
  type InventoryAlert,
  type InventoryItem,
  type StockMovement,
} from "@/lib/api";

export const Route = createFileRoute("/inventory")({
  component: InventoryPage,
});

function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProduct, setActiveProduct] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState(0);
  const [restockNotes, setRestockNotes] = useState("");
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustNotes, setAdjustNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [inventoryResponse, alertRows, movementResponse] = await Promise.all([
        getInventory(),
        getInventoryAlerts(),
        getStockMovements({ limit: 25 }),
      ]);
      setItems(inventoryResponse.data);
      setAlerts(alertRows);
      setMovements(movementResponse.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData().catch(console.error);
  }, []);

  async function handleRestock() {
    if (!activeProduct || restockQty <= 0) return;
    setSaving(true);
    try {
      await restockInventory({
        productId: activeProduct.id,
        quantity: restockQty,
        notes: restockNotes,
      });
      setActiveProduct(null);
      setRestockQty(0);
      setRestockNotes("");
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  async function handleAdjust() {
    if (!activeProduct || adjustNotes.trim().length < 2) return;
    setSaving(true);
    try {
      await adjustInventory({
        productId: activeProduct.id,
        newQty: adjustQty,
        notes: adjustNotes,
      });
      setActiveProduct(null);
      setAdjustQty(0);
      setAdjustNotes("");
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  const lowStockCount = items.filter((item) => item.stockQty <= item.lowStockThreshold).length;
  const outOfStockCount = items.filter((item) => item.stockQty === 0).length;

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black">Inventory</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor tracked stock, restock products, and review movement history.
        </p>
      </div>

      {alerts.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Low-stock alert:{" "}
          {alerts.map((alert) => `${alert.name} (${alert.stockQty})`).join(", ")}
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Tracked SKUs" value={String(items.length)} />
        <StatCard label="Low Stock" value={String(lowStockCount)} accent="#C4941A" />
        <StatCard label="Out of Stock" value={String(outOfStockCount)} accent="#B91C1C" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="rounded-2xl border border-border bg-white">
          {loading ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Loading inventory...
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
                      Current Stock
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold tracking-wide text-muted-foreground uppercase">
                      Threshold
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold tracking-wide text-muted-foreground uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-5 py-4">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.sku || item.slug}</p>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {item.categoryName ?? "Uncategorized"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            item.stockQty === 0
                              ? "bg-red-100 text-red-700"
                              : item.stockQty <= item.lowStockThreshold
                                ? "bg-amber-100 text-amber-700"
                                : "bg-green-100 text-green-700"
                          }`}
                        >
                          {item.stockQty}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {item.lowStockThreshold}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setActiveProduct(item);
                              setRestockQty(0);
                              setRestockNotes("");
                              setAdjustQty(item.stockQty);
                              setAdjustNotes("");
                            }}
                            className="rounded-full border border-border px-3 py-1 text-xs font-semibold transition-colors hover:bg-muted"
                          >
                            Restock
                          </button>
                          <button
                            onClick={() => {
                              setActiveProduct(item);
                              setAdjustQty(item.stockQty);
                              setAdjustNotes("");
                              setRestockQty(0);
                              setRestockNotes("");
                            }}
                            className="rounded-full border border-border px-3 py-1 text-xs font-semibold transition-colors hover:bg-muted"
                          >
                            Adjust
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-white p-5">
            <h2 className="text-base font-bold">Stock Actions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeProduct
                ? `Selected: ${activeProduct.name}`
                : "Choose a product from the table to restock or adjust."}
            </p>

            {activeProduct && (
              <div className="mt-4 space-y-5">
                <div className="rounded-2xl border border-border bg-muted/10 p-4">
                  <p className="text-sm font-bold">Restock</p>
                  <div className="mt-3 space-y-3">
                    <input
                      type="number"
                      min={1}
                      value={restockQty}
                      onChange={(event) => setRestockQty(Number(event.target.value))}
                      className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2D5016]"
                      placeholder="Quantity to add"
                    />
                    <textarea
                      rows={3}
                      value={restockNotes}
                      onChange={(event) => setRestockNotes(event.target.value)}
                      className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2D5016]"
                      placeholder="Optional restock note"
                    />
                    <button
                      onClick={handleRestock}
                      disabled={saving || restockQty <= 0}
                      className="w-full rounded-full px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: "#2D5016" }}
                    >
                      {saving ? "Saving..." : "Restock Item"}
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-muted/10 p-4">
                  <p className="text-sm font-bold">Adjust</p>
                  <div className="mt-3 space-y-3">
                    <input
                      type="number"
                      min={0}
                      value={adjustQty}
                      onChange={(event) => setAdjustQty(Number(event.target.value))}
                      className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2D5016]"
                      placeholder="Set stock to"
                    />
                    <textarea
                      rows={3}
                      value={adjustNotes}
                      onChange={(event) => setAdjustNotes(event.target.value)}
                      className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2D5016]"
                      placeholder="Reason for adjustment"
                    />
                    <button
                      onClick={handleAdjust}
                      disabled={saving || adjustNotes.trim().length < 2}
                      className="w-full rounded-full border border-border px-4 py-2.5 text-sm font-bold transition-colors hover:bg-muted disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Adjust Stock"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-white p-5">
            <h2 className="text-base font-bold">Recent Movements</h2>
            <div className="mt-4 space-y-3">
              {movements.map((movement) => (
                <div
                  key={movement.id}
                  className="rounded-2xl border border-border bg-muted/10 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{movement.productName ?? "Unknown Product"}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        movement.quantityChange > 0
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {movement.quantityChange > 0 ? "+" : ""}
                      {movement.quantityChange}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {movement.type} · {new Date(movement.createdAt).toLocaleString()}
                  </p>
                  {movement.notes && (
                    <p className="mt-1 text-sm text-muted-foreground">{movement.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = "#2D5016",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}
