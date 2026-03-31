import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  getDailySalesSummary,
  getSales,
  getSalesRangeSummary,
  type SaleRecord,
  type SalesSummary,
} from "@/lib/api";
import {
  AdminPage,
  EmptyState,
  FilterChip,
  InfoPill,
  MetricCard,
  PageHeader,
  PageSection,
  SectionTitle,
} from "@/components/AdminUI";
import { downloadCsv, exportPrintableReport } from "@/lib/export";
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

  const isRangeMode = Boolean(from && to);
  const averageSaleValue =
    summary && summary.totalSales > 0
      ? Math.round(summary.totalRevenueGyd / summary.totalSales)
      : 0;
  const windowLabel = isRangeMode ? `${from} to ${to}` : date;

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
        voided: voidedFilter === "all" ? undefined : voidedFilter === "true",
      }),
    ])
      .then(([summaryResponse, salesResponse]) => {
        setSummary(summaryResponse);
        setSales(salesResponse.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [date, from, to, voidedFilter]);

  const activeSales = useMemo(
    () => sales.filter((sale) => !sale.voided).length,
    [sales]
  );
  const voidedSales = useMemo(
    () => sales.filter((sale) => sale.voided).length,
    [sales]
  );

  function handleExportSalesCsv() {
    downloadCsv(
      `netsurf-sales-${windowLabel}.csv`,
      [
        "Sale Number",
        "Created At",
        "Items",
        "Subtotal (GYD)",
        "Discount (GYD)",
        "Tax (GYD)",
        "Total (GYD)",
        "Payment Method",
        "Status",
        "Note",
      ],
      sales.map((sale) => [
        sale.saleNumber,
        new Date(sale.createdAt).toLocaleString(),
        sale.itemsCount,
        sale.subtotalGyd,
        sale.discountGyd,
        sale.taxGyd,
        sale.totalGyd,
        sale.paymentMethod ?? "Split",
        sale.voided ? "Voided" : "Completed",
        sale.voided ? sale.voidReason : sale.notes,
      ])
    );
  }

  function handleExportSalesPdf() {
    if (!summary) return;

    exportPrintableReport({
      title: "Sales Ledger Snapshot",
      subtitle: `POS performance for ${windowLabel}.`,
      generatedAt: new Date().toLocaleString(),
      metrics: [
        { label: "Sales", value: String(summary.totalSales), note: `${activeSales} active` },
        {
          label: "Revenue",
          value: formatGYD(summary.totalRevenueGyd),
          note: `${summary.itemsSold} items sold`,
        },
        {
          label: "Average Sale",
          value: formatGYD(averageSaleValue),
          note: `${voidedSales} voided`,
        },
      ],
      sections: [
        {
          title: "Sales by Category",
          columns: ["Category", "Revenue", "Quantity Sold"],
          rows: summary.byCategory.map((entry) => [
            entry.categoryName,
            formatGYD(entry.revenueGyd),
            entry.quantitySold,
          ]),
        },
        {
          title: "Payment Methods",
          columns: ["Method", "Amount", "Sale Count"],
          rows: summary.byPaymentMethod.map((entry) => [
            entry.method,
            formatGYD(entry.amountGyd),
            entry.saleCount,
          ]),
        },
        {
          title: "Top Products",
          columns: ["Product", "Quantity Sold", "Revenue"],
          rows: summary.topProducts.map((entry) => [
            entry.productName,
            entry.quantitySold,
            formatGYD(entry.revenueGyd),
          ]),
        },
        {
          title: "Sales Ledger",
          columns: ["Sale #", "Created", "Items", "Total", "Payment", "Status"],
          rows: sales.map((sale) => [
            sale.saleNumber,
            new Date(sale.createdAt).toLocaleString(),
            sale.itemsCount,
            formatGYD(sale.totalGyd),
            sale.paymentMethod ?? "Split",
            sale.voided ? "Voided" : "Completed",
          ]),
        },
      ],
    });
  }

  return (
    <AdminPage className="max-w-[1500px]">
      <PageHeader
        eyebrow="Sales"
        title="Revenue flow, voids, and transaction history"
        description="Review the live POS ledger with day or range-based windows, payment-method mix, category performance, and export-ready sales summaries for management or reconciliation."
        actions={
          <>
            <button
              type="button"
              onClick={handleExportSalesCsv}
              className="admin-button-secondary rounded-full px-5 py-3 text-sm font-bold"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={handleExportSalesPdf}
              className="admin-button-secondary rounded-full px-5 py-3 text-sm font-bold"
              disabled={!summary}
            >
              Export PDF
            </button>
          </>
        }
        meta={
          <>
            <InfoPill tone="green">{windowLabel}</InfoPill>
            <InfoPill>{sales.length} ledger entries</InfoPill>
            <InfoPill tone={voidedSales > 0 ? "amber" : "green"}>
              {voidedSales > 0 ? `${voidedSales} voided` : "No voids in view"}
            </InfoPill>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Sales"
          value={String(summary?.totalSales ?? 0)}
          note="Transactions in the reporting window"
        />
        <MetricCard
          label="Revenue"
          value={formatGYD(summary?.totalRevenueGyd ?? 0)}
          note="Gross collected after discounts"
          tone="green"
        />
        <MetricCard
          label="Items Sold"
          value={String(summary?.itemsSold ?? 0)}
          note="Units sold in the current window"
          tone="slate"
        />
        <MetricCard
          label="Average Sale"
          value={formatGYD(averageSaleValue)}
          note={`${activeSales} active, ${voidedSales} voided`}
          tone={voidedSales > 0 ? "amber" : "green"}
        />
      </div>

      <PageSection className="p-6 sm:p-7">
        <SectionTitle
          title="Reporting Window"
          description="Toggle between a single day and a custom date range, then refine the ledger by sale status."
          action={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setDate(today);
                  setFrom("");
                  setTo("");
                }}
                className="admin-button-secondary rounded-full px-4 py-2 text-sm font-semibold"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  const monthStart = new Date();
                  monthStart.setDate(1);
                  setFrom(monthStart.toISOString().slice(0, 10));
                  setTo(today);
                }}
                className="admin-button-secondary rounded-full px-4 py-2 text-sm font-semibold"
              >
                This Month
              </button>
            </div>
          }
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <FieldLabel label="Single Day">
            <input
              type="date"
              name="sales_date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setFrom("");
                setTo("");
              }}
              className="admin-input w-full rounded-[1.2rem] px-4 py-3 text-sm outline-none"
            />
          </FieldLabel>

          <FieldLabel label="Range From">
            <input
              type="date"
              name="sales_from"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="admin-input w-full rounded-[1.2rem] px-4 py-3 text-sm outline-none"
            />
          </FieldLabel>

          <FieldLabel label="Range To">
            <input
              type="date"
              name="sales_to"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="admin-input w-full rounded-[1.2rem] px-4 py-3 text-sm outline-none"
            />
          </FieldLabel>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {[
            { value: "all", label: "All Sales" },
            { value: "false", label: "Completed" },
            { value: "true", label: "Voided" },
          ].map((option) => (
            <FilterChip
              key={option.value}
              type="button"
              active={voidedFilter === option.value}
              onClick={() => setVoidedFilter(option.value as typeof voidedFilter)}
            >
              {option.label}
            </FilterChip>
          ))}
        </div>
      </PageSection>

      <div className="grid gap-6 xl:grid-cols-3">
        <SummaryListCard
          title="By Category"
          description="The categories actually driving revenue in the active window."
          items={
            summary?.byCategory.map((entry) => ({
              label: entry.categoryName,
              value: `${formatGYD(entry.revenueGyd)} · ${entry.quantitySold} sold`,
            })) ?? []
          }
        />
        <SummaryListCard
          title="By Payment Method"
          description="How customers are settling transactions."
          items={
            summary?.byPaymentMethod.map((entry) => ({
              label: entry.method,
              value: `${formatGYD(entry.amountGyd)} · ${entry.saleCount} sales`,
            })) ?? []
          }
        />
        <SummaryListCard
          title="Top Products"
          description="The fastest movers in the selected range."
          items={
            summary?.topProducts.map((entry) => ({
              label: entry.productName,
              value: `${entry.quantitySold} sold · ${formatGYD(entry.revenueGyd)}`,
            })) ?? []
          }
        />
      </div>

      <PageSection className="p-0">
        <div className="px-6 pb-0 pt-6 sm:px-7 sm:pt-7">
          <SectionTitle
            title="Sales Ledger"
            description="Open any transaction for full line-item detail, payment history, or void review."
          />
        </div>

        {loading ? (
          <div className="px-6 pb-7 pt-4 text-center text-sm text-muted-foreground sm:px-7">
            Loading sales…
          </div>
        ) : sales.length === 0 ? (
          <div className="px-6 pb-7 pt-2 sm:px-7">
            <EmptyState
              title="No sales found"
              description="Try another date window or toggle the ledger filter to expand the current view."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-y border-primary/8 bg-primary/4">
                  <th className="px-5 py-4 text-left text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
                    Sale #
                  </th>
                  <th className="px-5 py-4 text-left text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
                    Time
                  </th>
                  <th className="px-5 py-4 text-left text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
                    Items
                  </th>
                  <th className="px-5 py-4 text-left text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
                    Total
                  </th>
                  <th className="px-5 py-4 text-left text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
                    Payment
                  </th>
                  <th className="px-5 py-4 text-left text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/8">
                {sales.map((sale) => (
                  <tr
                    key={sale.id}
                    onClick={() =>
                      navigate({
                        to: "/sales/$id",
                        params: { id: String(sale.id) },
                      })
                    }
                    className={`cursor-pointer transition-[background-color] hover:bg-primary/3 ${
                      sale.voided ? "bg-red-50/50" : ""
                    }`}
                  >
                    <td className="px-5 py-4 font-semibold text-foreground">
                      {sale.saleNumber}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {new Date(sale.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 tabular-nums text-foreground">
                      {sale.itemsCount}
                    </td>
                    <td className="px-5 py-4 font-semibold tabular-nums text-foreground">
                      {formatGYD(sale.totalGyd)}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {sale.paymentMethod ?? "Split"}
                    </td>
                    <td className="px-5 py-4">
                      <InfoPill tone={sale.voided ? "red" : "green"}>
                        {sale.voided ? "Voided" : "Completed"}
                      </InfoPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageSection>
    </AdminPage>
  );
}

function SummaryListCard({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <PageSection className="p-6 sm:p-7">
      <SectionTitle title={title} description={description} />
      <div className="space-y-3">
        {items.length === 0 ? (
          <EmptyState title="No data yet" description="Once sales are recorded, this summary will populate automatically." />
        ) : (
          items.map((item) => (
            <div
              key={`${title}-${item.label}`}
              className="rounded-[1.35rem] border border-primary/10 bg-white/78 px-4 py-3"
            >
              <p className="font-semibold text-foreground">{item.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.value}</p>
            </div>
          ))
        )}
      </div>
    </PageSection>
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
