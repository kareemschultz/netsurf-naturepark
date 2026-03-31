import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  getDailySalesSummary,
  getSales,
  getSalesRangeSummary,
  type SaleRecord,
  type SalesSummary,
} from "@/lib/api";
import { formatGYD } from "@workspace/shared";

export const Route = createFileRoute("/sales/")({
  component: SalesPage,
});

function SalesPage() {
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [voidedFilter, setVoidedFilter] = useState<"all" | "false" | "true">("all");
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const summaryPromise =
      from && to ? getSalesRangeSummary(from, to) : getDailySalesSummary(date);

    Promise.all([
      summaryPromise,
      getSales({
        date: from && to ? undefined : date,
        from: from || undefined,
        to: to || undefined,
        limit: 100,
        voided:
          voidedFilter === "all" ? undefined : voidedFilter === "true",
      }),
    ])
      .then(([summaryResponse, salesResponse]) => {
        setSummary(summaryResponse);
        setSales(salesResponse.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [date, from, to, voidedFilter]);

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-black">Sales</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review POS history, revenue totals, and top-selling products.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setFrom("");
              setTo("");
            }}
            className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-[#2D5016]"
          />
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-[#2D5016]"
          />
          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-[#2D5016]"
          />
        </div>
      </div>

      <div className="mb-6 flex gap-2">
        {[
          { value: "all", label: "All" },
          { value: "false", label: "Active" },
          { value: "true", label: "Voided" },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setVoidedFilter(option.value as typeof voidedFilter)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              voidedFilter === option.value
                ? "text-white"
                : "bg-white text-muted-foreground hover:text-foreground"
            }`}
            style={
              voidedFilter === option.value
                ? { backgroundColor: "#2D5016" }
                : undefined
            }
          >
            {option.label}
          </button>
        ))}
      </div>

      {summary && (
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <SummaryCard label="Sales" value={String(summary.totalSales)} />
          <SummaryCard
            label="Revenue"
            value={formatGYD(summary.totalRevenueGyd)}
            accent="#2D5016"
          />
          <SummaryCard label="Items Sold" value={String(summary.itemsSold)} accent="#C4941A" />
        </div>
      )}

      <div className="mb-6 grid gap-6 xl:grid-cols-3">
        <SummaryListCard
          title="By Category"
          items={
            summary?.byCategory.map((entry) => ({
              label: entry.categoryName,
              value: `${formatGYD(entry.revenueGyd)} · ${entry.quantitySold} sold`,
            })) ?? []
          }
        />
        <SummaryListCard
          title="By Payment Method"
          items={
            summary?.byPaymentMethod.map((entry) => ({
              label: entry.method,
              value: `${formatGYD(entry.amountGyd)} · ${entry.saleCount} sales`,
            })) ?? []
          }
        />
        <SummaryListCard
          title="Top Products"
          items={
            summary?.topProducts.map((entry) => ({
              label: entry.productName,
              value: `${entry.quantitySold} sold · ${formatGYD(entry.revenueGyd)}`,
            })) ?? []
          }
        />
      </div>

      <div className="rounded-2xl border border-border bg-white">
        {loading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Loading sales...
          </div>
        ) : sales.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No sales found for that filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-5 py-3 text-left text-xs font-bold tracking-wide text-muted-foreground uppercase">
                    Sale #
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-bold tracking-wide text-muted-foreground uppercase">
                    Time
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-bold tracking-wide text-muted-foreground uppercase">
                    Items
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-bold tracking-wide text-muted-foreground uppercase">
                    Total
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-bold tracking-wide text-muted-foreground uppercase">
                    Payment
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-bold tracking-wide text-muted-foreground uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sales.map((sale) => (
                  <tr
                    key={sale.id}
                    onClick={() =>
                      navigate({
                        to: "/sales/$id",
                        params: { id: String(sale.id) },
                      })
                    }
                    className={`cursor-pointer transition-colors hover:bg-muted/20 ${
                      sale.voided ? "bg-red-50/50" : ""
                    }`}
                  >
                    <td className="px-5 py-4 font-semibold">{sale.saleNumber}</td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {new Date(sale.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">{sale.itemsCount}</td>
                    <td className="px-5 py-4 font-semibold">
                      {formatGYD(sale.totalGyd)}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {sale.paymentMethod ?? "Split"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          sale.voided
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {sale.voided ? "Voided" : "Completed"}
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
  );
}

function SummaryCard({
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

function SummaryListCard({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <h2 className="text-base font-bold">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet.</p>
        ) : (
          items.map((item) => (
            <div
              key={`${title}-${item.label}`}
              className="rounded-2xl border border-border bg-muted/10 px-4 py-3"
            >
              <p className="font-semibold">{item.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.value}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
