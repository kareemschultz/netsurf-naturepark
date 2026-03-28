import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getStats, getBookings, getCalendar, type Stats, type Booking } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { cabins, formatGYD } from "@workspace/shared";
import { format, differenceInCalendarDays } from "date-fns";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function DashboardPage() {
  const now = new Date();
  const todayStr = format(now, "yyyy-MM-dd");

  const [stats, setStats] = useState<Stats | null>(null);
  const [pending, setPending] = useState<Booking[]>([]);
  const [arrivalsToday, setArrivalsToday] = useState<Booking[]>([]);
  const [departuresToday, setDeparturesToday] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getStats(),
      getBookings({ status: "pending", limit: 6 }),
      getCalendar(now.getFullYear(), now.getMonth() + 1),
    ]).then(([s, b, cal]) => {
      setStats(s);
      setPending(b.data);
      const active = cal.bookings.filter(
        (bk) => bk.status === "confirmed" || bk.status === "pending"
      );
      setArrivalsToday(active.filter((bk) => bk.checkIn === todayStr));
      setDeparturesToday(active.filter((bk) => bk.checkOut === todayStr));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(now, "EEEE, d MMMM yyyy")}
          </p>
        </div>
        <Link
          to="/bookings"
          search={{ status: "pending" }}
          className="text-xs font-bold px-4 py-2 rounded-full border-2 transition-colors hover:text-white"
          style={{ borderColor: "#2D5016", color: "#2D5016" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#2D5016";
            (e.currentTarget as HTMLAnchorElement).style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent";
            (e.currentTarget as HTMLAnchorElement).style.color = "#2D5016";
          }}
        >
          View all bookings →
        </Link>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 h-28 animate-pulse border border-border" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Pending"
            value={stats?.pending ?? 0}
            accentColor="#C4941A"
            accent
            note={stats?.pending ? "Needs action" : "All clear"}
          />
          <StatCard
            label="Confirmed"
            value={stats?.confirmed ?? 0}
            accentColor="#2D5016"
            accent
            note="Active bookings"
          />
          <StatCard
            label="Revenue"
            value={formatGYD(stats?.revenueGyd ?? 0)}
            accentColor="#2D5016"
            note="Confirmed only"
            small
          />
          <StatCard
            label="Total Requests"
            value={stats?.total ?? 0}
            accentColor="#6b7280"
            note={`${stats?.declined ?? 0} declined`}
          />
        </div>
      )}

      {/* Today's activity */}
      {!loading && (arrivalsToday.length > 0 || departuresToday.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <TodayCard
            title="Check-ins Today"
            bookings={arrivalsToday}
            color="#2D5016"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L12 22M5 9l7-7 7 7" />
              </svg>
            }
          />
          <TodayCard
            title="Check-outs Today"
            bookings={departuresToday}
            color="#C4941A"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22L12 2M5 15l7 7 7-7" />
              </svg>
            }
          />
        </div>
      )}

      {/* Pending requests */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="font-bold text-base">Pending Requests</h2>
            {(stats?.pending ?? 0) > 0 && (
              <span
                className="text-xs font-bold text-white rounded-full w-5 h-5 flex items-center justify-center"
                style={{ backgroundColor: "#C4941A" }}
              >
                {stats?.pending}
              </span>
            )}
          </div>
          <Link
            to="/bookings"
            search={{ status: "pending" }}
            className="text-xs font-semibold hover:underline"
            style={{ color: "#2D5016" }}
          >
            See all →
          </Link>
        </div>

        {loading ? (
          <div className="divide-y divide-border">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="px-6 py-4 animate-pulse flex gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
                <div className="h-5 bg-muted rounded w-20" />
              </div>
            ))}
          </div>
        ) : pending.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-3xl mb-3">🎉</p>
            <p className="text-sm font-semibold text-foreground">All caught up!</p>
            <p className="text-xs text-muted-foreground mt-1">No pending booking requests.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {pending.map((b) => (
              <BookingRow key={b.id} booking={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label, value, accentColor, note, small, accent,
}: {
  label: string;
  value: number | string;
  accentColor: string;
  note?: string;
  small?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className="bg-white rounded-2xl p-5 border border-border relative overflow-hidden"
    >
      {accent && (
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
          style={{ backgroundColor: accentColor }}
        />
      )}
      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest mb-2">
        {label}
      </p>
      <p
        className={`font-black leading-none ${small ? "text-xl" : "text-3xl"}`}
        style={{ color: accentColor }}
      >
        {value}
      </p>
      {note && (
        <p className="text-xs text-muted-foreground mt-2">{note}</p>
      )}
    </div>
  );
}

function TodayCard({
  title, bookings, color, icon,
}: {
  title: string;
  bookings: Booking[];
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
        <span style={{ color }}>{icon}</span>
        <h3 className="font-bold text-sm">{title}</h3>
        <span
          className="ml-auto text-xs font-bold text-white rounded-full px-2 py-0.5"
          style={{ backgroundColor: color }}
        >
          {bookings.length}
        </span>
      </div>
      <div className="divide-y divide-border">
        {bookings.map((b) => {
          const cabin = cabins.find((c) => c.slug === b.cabinSlug);
          const nights = differenceInCalendarDays(new Date(b.checkOut), new Date(b.checkIn));
          return (
            <Link
              key={b.id}
              to="/bookings/$id"
              params={{ id: String(b.id) }}
              className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{b.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {cabin?.name ?? b.cabinSlug} · {nights} night{nights !== 1 ? "s" : ""}
                </p>
              </div>
              <StatusBadge status={b.status} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function BookingRow({ booking: b }: { booking: Booking }) {
  const cabin = cabins.find((c) => c.slug === b.cabinSlug);
  const nights = differenceInCalendarDays(new Date(b.checkOut), new Date(b.checkIn));
  return (
    <Link
      to="/bookings/$id"
      params={{ id: String(b.id) }}
      className="flex items-center gap-4 px-6 py-4 hover:bg-muted/40 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{b.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {cabin?.name ?? b.cabinSlug} · {b.checkIn} → {b.checkOut}
          <span className="mx-1.5 text-border">·</span>
          {nights} night{nights !== 1 ? "s" : ""}
          <span className="mx-1.5 text-border">·</span>
          {b.guests} guest{b.guests !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold" style={{ color: "#2D5016" }}>
          {formatGYD(b.estimatedTotalGyd)}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {format(new Date(b.createdAt), "d MMM, HH:mm")}
        </p>
      </div>
    </Link>
  );
}
