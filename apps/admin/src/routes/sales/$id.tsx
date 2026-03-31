import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getSale, voidSale, type SaleDetail } from "@/lib/api";
import { formatGYD } from "@workspace/shared";

export const Route = createFileRoute("/sales/$id")({
  component: SaleDetailPage,
});

function SaleDetailPage() {
  const { id } = Route.useParams();
  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [voidReason, setVoidReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSale(Number(id))
      .then(setSale)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleVoid() {
    if (!sale || voidReason.trim().length < 2) return;
    if (!window.confirm(`Void sale ${sale.saleNumber}?`)) return;

    setSaving(true);
    try {
      const updated = await voidSale(sale.id, voidReason.trim());
      setSale((current) =>
        current
          ? {
              ...current,
              ...updated,
            }
          : current
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading sale...</div>;
  }

  if (!sale) return null;

  return (
    <div className="mx-auto max-w-5xl p-8">
      <Link
        to="/sales"
        className="mb-5 inline-block text-xs text-muted-foreground hover:text-foreground"
      >
        ← Back to sales
      </Link>

      <div className="rounded-3xl border border-border bg-white p-6 md:p-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
              Sale Detail
            </p>
            <h1 className="text-2xl font-black">{sale.saleNumber}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {new Date(sale.createdAt).toLocaleString()}
            </p>
          </div>
          <span
            className={`rounded-full px-4 py-2 text-sm font-bold ${
              sale.voided
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {sale.voided ? "Voided" : "Completed"}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="rounded-2xl border border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-5 py-3 text-left text-xs font-bold tracking-wide text-muted-foreground uppercase">
                      Item
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold tracking-wide text-muted-foreground uppercase">
                      Qty
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold tracking-wide text-muted-foreground uppercase">
                      Unit
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold tracking-wide text-muted-foreground uppercase">
                      Line Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sale.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-5 py-4 font-semibold">{item.productName}</td>
                      <td className="px-5 py-4">{item.quantity}</td>
                      <td className="px-5 py-4">{formatGYD(item.unitPriceGyd)}</td>
                      <td className="px-5 py-4 font-semibold">
                        {formatGYD(item.lineTotalGyd)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-muted/10 p-4">
              <h2 className="text-sm font-bold">Totals</h2>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatGYD(sale.subtotalGyd)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span>{formatGYD(sale.discountGyd)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatGYD(sale.taxGyd)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2 font-bold">
                  <span>Total</span>
                  <span>{formatGYD(sale.totalGyd)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-muted/10 p-4">
              <h2 className="text-sm font-bold">Payments</h2>
              <div className="mt-3 space-y-2">
                {sale.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="rounded-xl border border-border bg-white px-3 py-2 text-sm"
                  >
                    <p className="font-semibold">{payment.method}</p>
                    <p className="text-muted-foreground">
                      {formatGYD(payment.amountGyd)}
                      {payment.reference ? ` · ${payment.reference}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {sale.voided ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Voided{sale.voidedAt ? ` on ${new Date(sale.voidedAt).toLocaleString()}` : ""}.
                {sale.voidReason ? ` Reason: ${sale.voidReason}` : ""}
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-muted/10 p-4">
                <h2 className="text-sm font-bold">Void Sale</h2>
                <textarea
                  rows={3}
                  value={voidReason}
                  onChange={(event) => setVoidReason(event.target.value)}
                  className="mt-3 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2D5016]"
                  placeholder="Reason for voiding this sale"
                />
                <button
                  onClick={handleVoid}
                  disabled={saving || voidReason.trim().length < 2}
                  className="mt-3 rounded-full bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "Voiding..." : "Void Sale"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
