import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, startOfMonth } from "date-fns";
import {
  getInventory,
  getInventoryAlerts,
  getSalesRangeSummary,
  getStats,
  type InventoryItem,
  type SalesSummary,
  type Stats,
} from "@/lib/api";
import {
  AdminPage,
  InfoPill,
  MetricCard,
  PageHeader,
  PageSection,
  SectionTitle,
} from "@/components/AdminUI";
import { downloadSectionedCsv, exportPrintableReport } from "@/lib/export";
import { formatGYD } from "@workspace/shared";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
});

const chartPalette = ["#2d5016", "#c4941a", "#557b2f", "#6f8f57", "#8aa76c", "#d1a84d"];
type ChartValue = number | string | ReadonlyArray<number | string> | undefined;

function toChartNumber(value: ChartValue) {
  if (Array.isArray(value)) {
    return Number(value[0] ?? 0);
  }
  return Number(value ?? 0);
}

function formatCurrencyTooltip(value: ChartValue) {
  return formatGYD(toChartNumber(value));
}

function formatTopProductTooltip(
  value: ChartValue,
  name: string | number | undefined
) {
  const numericValue = toChartNumber(value);
  const label = name === "revenueGyd" ? "Revenue" : "Units";
  const display = name === "revenueGyd" ? formatGYD(numericValue) : String(numericValue);
  return [display, label] as const;
}

function ReportsPage() {
  const today = new Date();
  const [from, setFrom] = useState(format(startOfMonth(today), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(today, "yyyy-MM-dd"));
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [alertCount, setAlertCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    Promise.all([
      getSalesRangeSummary(from, to),
      getStats(),
      getInventory(),
      getInventoryAlerts(),
    ])
      .then(([salesSummary, bookingStats, inventoryResponse, alerts]) => {
        setSummary(salesSummary);
        setStats(bookingStats);
        setInventory(inventoryResponse.data);
        setAlertCount(alerts.length);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [from, to]);

  const inventoryByCategory = useMemo(() => {
    const totals = new Map<string, number>();

    for (const item of inventory) {
      const key = item.categoryName ?? "Uncategorized";
      totals.set(key, (totals.get(key) ?? 0) + item.stockQty);
    }

    return Array.from(totals.entries())
      .map(([name, stockQty]) => ({ name, stockQty }))
      .sort((a, b) => b.stockQty - a.stockQty);
  }, [inventory]);

  const bookingMix = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Pending", value: stats.pending },
      { name: "Confirmed", value: stats.confirmed },
      { name: "Declined", value: stats.declined },
      { name: "Cancelled", value: stats.cancelled },
    ];
  }, [stats]);

  const lowStockRows = useMemo(
    () =>
      inventory
        .filter((item) => item.stockQty <= item.lowStockThreshold)
        .sort((a, b) => a.stockQty - b.stockQty)
        .slice(0, 10),
    [inventory]
  );

  function handleExportCsv() {
    if (!summary) return;

    downloadSectionedCsv(`netsurf-report-${from}-to-${to}.csv`, [
      {
        title: "Sales By Category",
        columns: ["Category", "Revenue (GYD)", "Quantity Sold"],
        rows: summary.byCategory.map((entry) => [
          entry.categoryName,
          entry.revenueGyd,
          entry.quantitySold,
        ]),
      },
      {
        title: "Payment Methods",
        columns: ["Method", "Amount (GYD)", "Sale Count"],
        rows: summary.byPaymentMethod.map((entry) => [
          entry.method,
          entry.amountGyd,
          entry.saleCount,
        ]),
      },
      {
        title: "Top Products",
        columns: ["Product", "Quantity Sold", "Revenue (GYD)"],
        rows: summary.topProducts.map((entry) => [
          entry.productName,
          entry.quantitySold,
          entry.revenueGyd,
        ]),
      },
      {
        title: "Inventory By Category",
        columns: ["Category", "Units In Stock"],
        rows: inventoryByCategory.map((entry) => [entry.name, entry.stockQty]),
      },
      {
        title: "Low Stock Items",
        columns: ["Product", "Category", "Stock", "Threshold"],
        rows: lowStockRows.map((item) => [
          item.name,
          item.categoryName ?? "Uncategorized",
          item.stockQty,
          item.lowStockThreshold,
        ]),
      },
    ]);
  }

  function handleExportPdf() {
    if (!summary || !stats) return;

    exportPrintableReport({
      title: "Operations Report",
      subtitle: `Sales and stock overview for ${from} to ${to}.`,
      generatedAt: new Date().toLocaleString(),
      metrics: [
        {
          label: "Sales",
          value: String(summary.totalSales),
          note: `${summary.itemsSold} items sold`,
        },
        {
          label: "Revenue",
          value: formatGYD(summary.totalRevenueGyd),
          note: `${summary.byPaymentMethod.length} payment methods`,
        },
        {
          label: "Inventory Alerts",
          value: String(alertCount),
          note: `${inventory.length} tracked items`,
        },
      ],
      sections: [
        {
          title: "Bookings",
          columns: ["Status", "Count"],
          rows: bookingMix.map((entry) => [entry.name, entry.value]),
        },
        {
          title: "Sales By Category",
          columns: ["Category", "Revenue", "Quantity Sold"],
          rows: summary.byCategory.map((entry) => [
            entry.categoryName,
            formatGYD(entry.revenueGyd),
            entry.quantitySold,
          ]),
        },
        {
          title: "Payment Methods",
          columns: ["Method", "Amount", "Sales"],
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
          title: "Stock by Category",
          columns: ["Category", "Units In Stock"],
          rows: inventoryByCategory.map((entry) => [entry.name, entry.stockQty]),
        },
        {
          title: "Low Stock Items",
          columns: ["Product", "Category", "Stock", "Threshold"],
          rows: lowStockRows.map((item) => [
            item.name,
            item.categoryName ?? "Uncategorized",
            item.stockQty,
            item.lowStockThreshold,
          ]),
        },
      ],
    });
  }

  return (
    <AdminPage className="max-w-[1500px]">
      <PageHeader
        eyebrow="Reports"
        title="Sales, stock, and occupancy at a glance"
        description="Responsive operational reporting for revenue, payment mix, booking pressure, and inventory health. Use the date range to refocus the reporting window, then export the current view as CSV or PDF."
        meta={
          <>
            <InfoPill tone="green">Interactive charts</InfoPill>
            <InfoPill>{inventory.length} tracked products</InfoPill>
            <InfoPill tone={alertCount > 0 ? "amber" : "neutral"}>
              {alertCount} low-stock alerts
            </InfoPill>
          </>
        }
        actions={
          <>
            <div className="flex flex-wrap gap-2">
              <input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="admin-input rounded-2xl px-4 py-3 text-sm outline-none"
              />
              <input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="admin-input rounded-2xl px-4 py-3 text-sm outline-none"
              />
            </div>
            <button
              onClick={handleExportCsv}
              disabled={!summary}
              className="admin-button-secondary rounded-2xl px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Export CSV
            </button>
            <button
              onClick={handleExportPdf}
              disabled={!summary || !stats}
              className="admin-button-primary rounded-2xl px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Export PDF
            </button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Sales"
          value={loading ? "..." : String(summary?.totalSales ?? 0)}
          note={loading ? "Loading sales window" : `${summary?.itemsSold ?? 0} items sold`}
        />
        <MetricCard
          label="Revenue"
          value={loading ? "..." : formatGYD(summary?.totalRevenueGyd ?? 0)}
          note="Current reporting window"
          tone="amber"
        />
        <MetricCard
          label="Bookings"
          value={loading ? "..." : String(stats?.total ?? 0)}
          note={loading ? "Loading booking state" : `${stats?.pending ?? 0} pending requests`}
          tone="slate"
        />
        <MetricCard
          label="Stock Alerts"
          value={loading ? "..." : String(alertCount)}
          note={loading ? "Loading inventory state" : `${inventory.length} tracked items`}
          tone={alertCount > 0 ? "red" : "green"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Revenue by category"
          description="What is actually selling in the selected window."
        >
          <ResponsiveChart>
            <BarChart data={summary?.byCategory ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dde7d6" vertical={false} />
              <XAxis dataKey="categoryName" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip formatter={(value) => formatCurrencyTooltip(value)} />
              <Bar dataKey="revenueGyd" radius={[8, 8, 0, 0]} fill="#2d5016" />
            </BarChart>
          </ResponsiveChart>
        </ChartCard>

        <ChartCard
          title="Payment method mix"
          description="How guests and visitors are settling sales."
        >
          <ResponsiveChart>
            <PieChart>
              <Pie
                data={summary?.byPaymentMethod ?? []}
                dataKey="amountGyd"
                nameKey="method"
                innerRadius={72}
                outerRadius={108}
                paddingAngle={4}
              >
                {(summary?.byPaymentMethod ?? []).map((entry, index) => (
                  <Cell key={entry.method} fill={chartPalette[index % chartPalette.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrencyTooltip(value)} />
              <Legend />
            </PieChart>
          </ResponsiveChart>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <ChartCard
          title="Top-selling products"
          description="Best performers in the current sales range."
        >
          <ResponsiveChart height={320}>
            <BarChart data={summary?.topProducts ?? []} layout="vertical" margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dde7d6" horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis
                type="category"
                dataKey="productName"
                tickLine={false}
                axisLine={false}
                width={120}
                fontSize={12}
              />
              <Tooltip formatter={(value, name) => formatTopProductTooltip(value, name)} />
              <Legend />
              <Bar dataKey="quantitySold" fill="#c4941a" radius={[0, 8, 8, 0]} />
              <Bar dataKey="revenueGyd" fill="#2d5016" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveChart>
        </ChartCard>

        <PageSection className="p-6">
          <SectionTitle
            title="Booking status mix"
            description="Current reservation pipeline across all statuses."
          />
          <ResponsiveChart height={320}>
            <PieChart>
              <Pie
                data={bookingMix}
                dataKey="value"
                nameKey="name"
                innerRadius={68}
                outerRadius={112}
                paddingAngle={4}
              >
                {bookingMix.map((entry, index) => (
                  <Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveChart>
        </PageSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <ChartCard
          title="Stock by category"
          description="Current on-hand units across tracked inventory."
        >
          <ResponsiveChart>
            <BarChart data={inventoryByCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dde7d6" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="stockQty" radius={[8, 8, 0, 0]} fill="#557b2f" />
            </BarChart>
          </ResponsiveChart>
        </ChartCard>

        <PageSection className="p-6">
          <SectionTitle
            title="Low-stock watchlist"
            description="Products already at or below their threshold."
          />
          <div className="space-y-3">
            {lowStockRows.length === 0 ? (
              <div className="rounded-[1.4rem] border border-dashed border-primary/16 bg-primary/4 px-4 py-8 text-center text-sm text-muted-foreground">
                No low-stock items in the current inventory snapshot.
              </div>
            ) : (
              lowStockRows.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[1.25rem] border border-primary/8 bg-white/70 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.categoryName ?? "Uncategorized"} · threshold {item.lowStockThreshold}
                      </p>
                    </div>
                    <InfoPill tone={item.stockQty === 0 ? "red" : "amber"}>
                      {item.stockQty} left
                    </InfoPill>
                  </div>
                </div>
              ))
            )}
          </div>
        </PageSection>
      </div>
    </AdminPage>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <PageSection className="p-6">
      <SectionTitle title={title} description={description} />
      {children}
    </PageSection>
  );
}

function ResponsiveChart({
  height = 280,
  children,
}: {
  height?: number;
  children: ReactNode;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}
