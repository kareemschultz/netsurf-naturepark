import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { differenceInCalendarDays, format } from "date-fns";
import {
  getBookings,
  getCalendar,
  getDailySalesSummary,
  getInventoryAlerts,
  getStats,
  type Booking,
  type InventoryAlert,
  type SalesSummary,
  type Stats,
} from "@/lib/api";
import { AdminPage, MetricCard, EmptyState } from "@/components/AdminUI";
import { StatusBadge } from "@/components/StatusBadge";
import { cabins, formatGYD } from "@workspace/shared";
import { buttonVariants } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@workspace/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function DashboardPage() {
  const [now] = useState(() => new Date());
  const todayStr = format(now, "yyyy-MM-dd");

  const [stats, setStats] = useState<Stats | null>(null);
  const [pending, setPending] = useState<Booking[]>([]);
  const [arrivalsToday, setArrivalsToday] = useState<Booking[]>([]);
  const [departuresToday, setDeparturesToday] = useState<Booking[]>([]);
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getStats(),
      getBookings({ status: "pending", limit: 6 }),
      getCalendar(now.getFullYear(), now.getMonth() + 1),
      getDailySalesSummary(todayStr),
      getInventoryAlerts(),
    ])
      .then(([bookingStats, bookingResponse, calendarResponse, summary, alerts]) => {
        setStats(bookingStats);
        setPending(bookingResponse.data);
        setSalesSummary(summary);
        setInventoryAlerts(alerts);

        const active = calendarResponse.bookings.filter(
          (b) => b.status === "confirmed" || b.status === "pending"
        );
        setArrivalsToday(active.filter((b) => b.checkIn === todayStr));
        setDeparturesToday(active.filter((b) => b.checkOut === todayStr));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [now, todayStr]);

  return (
    <AdminPage className="max-w-[1450px]">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {format(now, "EEEE, d MMMM yyyy")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/reports"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Reports
          </Link>
          <Link
            to="/pos"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Open POS
          </Link>
        </div>
      </div>

      {/* KPI stat cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Pending Requests"
          value={loading ? "..." : String(stats?.pending ?? 0)}
          note="Requires action"
          tone="amber"
        />
        <MetricCard
          label="Confirmed Stays"
          value={loading ? "..." : String(stats?.confirmed ?? 0)}
          note="Active reservations"
          tone="green"
        />
        <MetricCard
          label="Today's Revenue"
          value={loading ? "..." : formatGYD(salesSummary?.totalRevenueGyd ?? 0)}
          note={loading ? "Loading..." : `${salesSummary?.totalSales ?? 0} sales today`}
          tone="green"
        />
        <MetricCard
          label="Stock Alerts"
          value={loading ? "..." : String(inventoryAlerts.length)}
          note={inventoryAlerts.length > 0 ? "Restock recommended" : "Inventory healthy"}
          tone={inventoryAlerts.length > 0 ? "red" : "slate"}
        />
      </div>

      {/* Main content: bookings table + today sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Bookings — 2 cols */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Bookings</CardTitle>
                  <CardDescription>Pending requests requiring review</CardDescription>
                </div>
                <Link
                  to="/bookings"
                  search={{ status: "pending" }}
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                >
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              ) : pending.length === 0 ? (
                <EmptyState
                  title="No pending requests"
                  description="All booking requests have been reviewed."
                  variant="bookings"
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Guest</TableHead>
                        <TableHead>Cabin</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Guests</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pending.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <div className="min-w-0">
                              <Link
                                to="/bookings/$id"
                                params={{ id: String(booking.id) }}
                                className="font-medium text-foreground hover:text-primary hover:underline"
                              >
                                {booking.name}
                              </Link>
                              <p className="text-xs text-muted-foreground">{booking.contact}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {getCabinName(booking.cabinSlug)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm">
                            {booking.checkIn} – {booking.checkOut}
                          </TableCell>
                          <TableCell className="text-center tabular-nums">
                            {booking.guests}
                          </TableCell>
                          <TableCell className="font-medium tabular-nums text-primary">
                            {formatGYD(booking.estimatedTotalGyd)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={booking.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar — today on property + alerts */}
        <div className="space-y-5">
          <TodayCard
            title="Arrivals"
            tone="green"
            bookings={arrivalsToday}
            emptyCopy="No arrivals today."
            loading={loading}
          />
          <TodayCard
            title="Departures"
            tone="amber"
            bookings={departuresToday}
            emptyCopy="No departures today."
            loading={loading}
          />

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Inventory Alerts</CardTitle>
                <Link
                  to="/inventory"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                >
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full rounded-md" />
                  ))}
                </div>
              ) : inventoryAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No products below threshold.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {inventoryAlerts.slice(0, 4).map((alert) => (
                    <AlertRow key={alert.id} alert={alert} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminPage>
  );
}

function TodayCard({
  title,
  bookings,
  tone,
  emptyCopy,
  loading,
}: {
  title: string;
  bookings: Booking[];
  tone: "green" | "amber";
  emptyCopy: string;
  loading: boolean;
}) {
  const dotClass = tone === "green" ? "bg-primary" : "bg-amber-500";
  const countVariant: "default" | "outline" = tone === "green" ? "default" : "outline";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${dotClass}`} />
            <CardTitle>{title}</CardTitle>
          </div>
          <Badge variant={countVariant} className="tabular-nums">
            {loading ? "..." : bookings.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-10 w-full rounded-md" />
        ) : bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyCopy}</p>
        ) : (
          <div className="space-y-1.5">
            {bookings.map((booking) => {
              const nights = differenceInCalendarDays(
                new Date(booking.checkOut),
                new Date(booking.checkIn)
              );
              return (
                <div
                  key={booking.id}
                  className="rounded-lg border border-border bg-muted/30 px-3 py-2"
                >
                  <p className="text-sm font-medium text-foreground">{booking.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {getCabinName(booking.cabinSlug)} ·{" "}
                    {booking.stayType === "day_use"
                      ? "Day use"
                      : `${nights} night${nights === 1 ? "" : "s"}`}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AlertRow({ alert }: { alert: InventoryAlert }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{alert.name}</p>
        <p className="text-xs text-muted-foreground">
          {alert.categoryName ?? "Uncategorized"} · threshold {alert.lowStockThreshold}
        </p>
      </div>
      <Badge
        variant={alert.stockQty === 0 ? "destructive" : "outline"}
        className="ml-2 shrink-0 tabular-nums"
      >
        {alert.stockQty} left
      </Badge>
    </div>
  );
}

function getCabinName(slug: string) {
  return cabins.find((c) => c.slug === slug)?.name ?? slug;
}
