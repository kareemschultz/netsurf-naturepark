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
import {
  AdminPage,
  EmptyState,
  InfoPill,
  MetricCard,
  PageHeader,
  PageSection,
  SectionTitle,
} from "@/components/AdminUI";
import { StatusBadge } from "@/components/StatusBadge";
import { cabins, formatGYD } from "@workspace/shared";

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
          (booking) => booking.status === "confirmed" || booking.status === "pending"
        );

        setArrivalsToday(active.filter((booking) => booking.checkIn === todayStr));
        setDeparturesToday(active.filter((booking) => booking.checkOut === todayStr));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [now, todayStr]);

  return (
    <AdminPage className="max-w-[1450px]">
      <PageHeader
        eyebrow="Dashboard"
        title="Operations control room"
        description="Track reservations, revenue, inventory pressure, and day-of activity from one surface. This is the landing view for what needs attention now, not a dead summary page."
        meta={
          <>
            <InfoPill>{format(now, "EEEE, d MMMM yyyy")}</InfoPill>
            <InfoPill tone={inventoryAlerts.length > 0 ? "amber" : "green"}>
              {inventoryAlerts.length} stock alerts
            </InfoPill>
            <InfoPill tone={(stats?.pending ?? 0) > 0 ? "amber" : "neutral"}>
              {stats?.pending ?? 0} pending approvals
            </InfoPill>
          </>
        }
        actions={
          <>
            <Link
              to="/reports"
              className="admin-button-secondary rounded-2xl px-4 py-3 text-sm font-bold"
            >
              Open Reports
            </Link>
            <Link
              to="/pos"
              className="admin-button-primary rounded-2xl px-4 py-3 text-sm font-bold"
            >
              Open POS
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Pending Requests"
          value={loading ? "..." : String(stats?.pending ?? 0)}
          note="Bookings needing review"
          tone="amber"
        />
        <MetricCard
          label="Confirmed Stays"
          value={loading ? "..." : String(stats?.confirmed ?? 0)}
          note="Current confirmed reservation count"
        />
        <MetricCard
          label="Today's POS Revenue"
          value={loading ? "..." : formatGYD(salesSummary?.totalRevenueGyd ?? 0)}
          note={loading ? "Loading sales summary" : `${salesSummary?.totalSales ?? 0} sales today`}
          tone="green"
        />
        <MetricCard
          label="Low Stock Alerts"
          value={loading ? "..." : String(inventoryAlerts.length)}
          note={inventoryAlerts.length > 0 ? "Restock review recommended" : "Inventory looks healthy"}
          tone={inventoryAlerts.length > 0 ? "red" : "slate"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <PageSection className="p-6">
          <SectionTitle
            title="Pending approvals"
            description="Highest-priority booking requests waiting for action."
            action={
              <Link
                to="/bookings"
                search={{ status: "pending" }}
                className="text-sm font-bold text-primary hover:underline"
              >
                See all
              </Link>
            }
          />

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 rounded-[1.4rem] border border-border bg-white/60 animate-pulse"
                />
              ))}
            </div>
          ) : pending.length === 0 ? (
            <EmptyState
              title="No pending requests"
              description="There are no booking approvals waiting in the queue right now."
              action={
                <Link
                  to="/calendar"
                  className="admin-button-secondary inline-flex rounded-2xl px-4 py-3 text-sm font-bold"
                >
                  Open Calendar
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {pending.map((booking) => (
                <Link
                  key={booking.id}
                  to="/bookings/$id"
                  params={{ id: String(booking.id) }}
                  className="block rounded-[1.4rem] border border-primary/8 bg-white/72 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/18 hover:shadow-[0_18px_30px_rgb(23_48_13_/10%)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-bold text-foreground">{booking.name}</p>
                        <StatusBadge status={booking.status} />
                        <InfoPill>{booking.stayType === "day_use" ? "Day use" : "Overnight"}</InfoPill>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {getCabinName(booking.cabinSlug)} · {booking.contact}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {booking.checkIn} to {booking.checkOut} · {booking.guests} guest
                        {booking.guests === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-primary">
                        {formatGYD(booking.estimatedTotalGyd)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Submitted {format(new Date(booking.createdAt), "d MMM, h:mm a")}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </PageSection>

        <PageSection className="p-6">
          <SectionTitle
            title="Today on property"
            description="Check-ins, check-outs, and stock pressure for the current day."
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <TodayListCard
              title="Arrivals"
              tone="green"
              bookings={arrivalsToday}
              emptyCopy="No arrivals scheduled today."
            />
            <TodayListCard
              title="Departures"
              tone="amber"
              bookings={departuresToday}
              emptyCopy="No departures scheduled today."
            />
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-primary/10 bg-primary/4 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-foreground">Inventory watchlist</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pull the top alerts into view without leaving the dashboard.
                </p>
              </div>
              <Link to="/inventory" className="text-sm font-bold text-primary hover:underline">
                View inventory
              </Link>
            </div>

            <div className="mt-4 space-y-2">
              {inventoryAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No products are below threshold right now.</p>
              ) : (
                inventoryAlerts.slice(0, 4).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between rounded-[1.1rem] border border-white/70 bg-white/80 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{alert.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {alert.categoryName ?? "Uncategorized"} · threshold {alert.lowStockThreshold}
                      </p>
                    </div>
                    <InfoPill tone={alert.stockQty === 0 ? "red" : "amber"}>
                      {alert.stockQty} left
                    </InfoPill>
                  </div>
                ))
              )}
            </div>
          </div>
        </PageSection>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <QuickLinkCard
          to="/pos"
          title="POS terminal"
          description="Ring up walk-in sales, collect payment, and print receipts."
          accent="green"
        />
        <QuickLinkCard
          to="/products"
          title="Catalog and menus"
          description="Manage beverage items, categories, pricing, and stock rules."
          accent="amber"
        />
        <QuickLinkCard
          to="/inventory"
          title="Inventory control"
          description="Restock fast-moving items and review movement history."
          accent="slate"
        />
        <QuickLinkCard
          to="/reports"
          title="Reports and exports"
          description="Open charts, revenue summaries, and PDF or CSV exports."
          accent="green"
        />
      </div>
    </AdminPage>
  );
}

function TodayListCard({
  title,
  bookings,
  tone,
  emptyCopy,
}: {
  title: string;
  bookings: Booking[];
  tone: "green" | "amber";
  emptyCopy: string;
}) {
  const toneClass =
    tone === "green"
      ? {
          badge: "bg-primary/10 text-primary border-primary/10",
          dot: "bg-primary",
        }
      : {
          badge: "bg-amber-50 text-amber-700 border-amber-200/70",
          dot: "bg-amber-500",
        };

  return (
    <div className="rounded-[1.5rem] border border-primary/8 bg-white/76 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${toneClass.dot}`} />
          <p className="text-sm font-bold text-foreground">{title}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneClass.badge}`}>
          {bookings.length}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyCopy}</p>
        ) : (
          bookings.map((booking) => {
            const nights = differenceInCalendarDays(
              new Date(booking.checkOut),
              new Date(booking.checkIn)
            );

            return (
              <div
                key={booking.id}
                className="rounded-[1.1rem] border border-primary/8 bg-primary/4 px-3 py-2.5"
              >
                <p className="text-sm font-semibold text-foreground">{booking.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {getCabinName(booking.cabinSlug)} ·{" "}
                  {booking.stayType === "day_use"
                    ? "Day use"
                    : `${nights} night${nights === 1 ? "" : "s"}`}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function QuickLinkCard({
  to,
  title,
  description,
  accent,
}: {
  to: "/pos" | "/products" | "/inventory" | "/reports";
  title: string;
  description: string;
  accent: "green" | "amber" | "slate";
}) {
  const accentClass = {
    green: "from-primary/14 to-primary/2",
    amber: "from-amber-200/30 to-amber-50/10",
    slate: "from-slate-200/40 to-slate-50/10",
  }[accent];

  return (
    <Link
      to={to}
      className={`admin-surface block rounded-[1.7rem] bg-gradient-to-br ${accentClass} p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_34px_rgb(23_48_13_/10%)]`}
    >
      <p className="admin-kicker">Quick launch</p>
      <h3 className="mt-3 text-xl font-black tracking-tight text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      <p className="mt-5 text-sm font-bold text-primary">Open view</p>
    </Link>
  );
}

function getCabinName(slug: string) {
  return cabins.find((cabin) => cabin.slug === slug)?.name ?? slug;
}
