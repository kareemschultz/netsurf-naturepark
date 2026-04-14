import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getCalendar, type BlockedDate, type Booking, type CalendarResponse } from "@/lib/api";
import {
  AdminPage,
  MetricCard,
  PageHeader,
  PageSection,
  SectionTitle,
} from "@/components/AdminUI";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";

export const Route = createFileRoute("/calendar")({
  component: CalendarPage,
});

const monthLabel = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [calendar, setCalendar] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCalendar(year, month)
      .then(setCalendar)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [year, month]);

  const monthDate = new Date(year, month - 1, 1);
  const days = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, index) => index + 1);
  }, [year, month]);

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const bookings = calendar?.bookings ?? [];
  const blockedRows = calendar?.blocked ?? [];
  const confirmedCount = bookings.filter((booking) => booking.status === "confirmed").length;
  const pendingCount = bookings.filter((booking) => booking.status === "pending").length;

  function moveMonth(direction: -1 | 1) {
    setMonth((currentMonth) => {
      if (direction === -1) {
        if (currentMonth === 1) {
          setYear((currentYear) => currentYear - 1);
          return 12;
        }
        return currentMonth - 1;
      }

      if (currentMonth === 12) {
        setYear((currentYear) => currentYear + 1);
        return 1;
      }

      return currentMonth + 1;
    });
  }

  return (
    <AdminPage className="max-w-[1600px]">
      <PageHeader
        eyebrow="Occupancy"
        title="Cabin calendar and reservation pressure"
        description="Track confirmed stays, pending demand, and blocked ranges across the month. The calendar stays operationally useful without becoming a flat spreadsheet."
        actions={
          <>
            <Button variant="outline" onClick={() => moveMonth(-1)} aria-label="Previous month">
              Previous
            </Button>
            <Button variant="outline" onClick={() => moveMonth(1)} aria-label="Next month">
              Next
            </Button>
            {!isCurrentMonth ? (
              <Button
                onClick={() => {
                  setYear(now.getFullYear());
                  setMonth(now.getMonth() + 1);
                }}
              >
                Jump to Today
              </Button>
            ) : null}
          </>
        }
        meta={
          <>
            <Badge variant="secondary">{monthLabel.format(monthDate)}</Badge>
            <Badge variant="outline">{calendar?.cabins.length ?? 0} cabins</Badge>
            <Badge variant="outline">{blockedRows.length} blocked ranges</Badge>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Confirmed"
          value={String(confirmedCount)}
          note="Reservations with approval"
          tone="green"
        />
        <MetricCard
          label="Pending"
          value={String(pendingCount)}
          note="Requests still awaiting action"
          tone="amber"
        />
        <MetricCard
          label="Blocked"
          value={String(blockedRows.length)}
          note="Maintenance or override ranges"
          tone="red"
        />
        <MetricCard
          label="Month View"
          value={monthLabel.format(monthDate)}
          note="Active planning window"
          tone="slate"
        />
      </div>

      <PageSection className="p-6 sm:p-7">
        <SectionTitle
          title="Occupancy Grid"
          description="Select any confirmed or pending booking from the calendar to open the full reservation record."
          action={
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <span className="h-3 w-3 rounded-sm bg-emerald-500/80" />
                Confirmed
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <span className="h-3 w-3 rounded-sm bg-amber-400/80" />
                Pending
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <span className="h-3 w-3 rounded-sm bg-red-400/80" />
                Blocked
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <span className="h-3 w-3 rounded-sm bg-slate-300/80" />
                Available
              </span>
            </div>
          }
        />

        {loading || !calendar ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground">
            Loading calendar…
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <div className="min-w-[1100px]">
                <div
                  className="grid border-b border-border bg-muted/40"
                  style={{
                    gridTemplateColumns: `16rem repeat(${days.length}, minmax(2.35rem, 1fr))`,
                  }}
                >
                  <div className="border-r border-border px-5 py-4 text-[11px] font-bold tracking-[0.18em] uppercase text-muted-foreground">
                    Cabin
                  </div>
                  {days.map((day) => {
                    const isToday = isCurrentMonth && day === now.getDate();

                    return (
                      <div
                        key={day}
                        className="flex items-center justify-center border-r border-border px-1 py-3.5 text-xs font-bold last:border-r-0 text-muted-foreground"
                      >
                        {isToday ? (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
                            {day}
                          </span>
                        ) : (
                          day
                        )}
                      </div>
                    );
                  })}
                </div>

                {calendar.cabins.map((cabin) => (
                  <CalendarRow
                    key={cabin.slug}
                    cabin={cabin}
                    year={year}
                    month={month}
                    days={days}
                    columnTemplate={`16rem repeat(${days.length}, minmax(2.35rem, 1fr))`}
                    bookings={bookings}
                    blockedRows={blockedRows}
                    isCurrentMonth={isCurrentMonth}
                    today={now.getDate()}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </PageSection>

      {calendar ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {calendar.cabins.map((cabin) => {
            const cabinConfirmed = bookings.filter(
              (booking) => booking.cabinSlug === cabin.slug && booking.status === "confirmed"
            ).length;
            const cabinPending = bookings.filter(
              (booking) => booking.cabinSlug === cabin.slug && booking.status === "pending"
            ).length;
            const cabinBlocked = blockedRows.filter(
              (row) => row.cabinSlug === null || row.cabinSlug === cabin.slug
            ).length;

            return (
              <PageSection key={cabin.slug} className="p-5 sm:p-6">
                <p className="text-lg font-black tracking-tight text-foreground">{cabin.name}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="secondary">{cabinConfirmed} confirmed</Badge>
                  <Badge variant="outline">{cabinPending} pending</Badge>
                  <Badge variant="outline">{cabinBlocked} blocked</Badge>
                </div>
              </PageSection>
            );
          })}
        </div>
      ) : null}
    </AdminPage>
  );
}

function CalendarRow({
  cabin,
  year,
  month,
  days,
  columnTemplate,
  bookings,
  blockedRows,
  isCurrentMonth,
  today,
}: {
  cabin: { slug: string; name: string };
  year: number;
  month: number;
  days: number[];
  columnTemplate: string;
  bookings: Booking[];
  blockedRows: BlockedDate[];
  isCurrentMonth: boolean;
  today: number;
}) {
  return (
    <div
      className="grid border-b border-border last:border-b-0"
      style={{ gridTemplateColumns: columnTemplate }}
    >
      <div className="border-r border-border bg-muted/40 px-5 py-4">
        <p className="text-sm font-bold text-foreground">{cabin.name}</p>
        <p className="mt-0.5 text-[10px] font-medium tracking-wide uppercase text-muted-foreground">Occupancy</p>
      </div>

      {days.map((day) => {
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const booking = bookings.find(
          (entry) =>
            entry.cabinSlug === cabin.slug &&
            entry.checkIn <= dateStr &&
            entry.checkOut > dateStr &&
            ["pending", "confirmed"].includes(entry.status)
        );
        const blocked = blockedRows.find(
          (row) =>
            (row.cabinSlug === cabin.slug || row.cabinSlug === null) &&
            row.startDate <= dateStr &&
            row.endDate >= dateStr
        );
        const isToday = isCurrentMonth && day === today;

        if (blocked) {
          return (
            <div
              key={dateStr}
              title={`Blocked: ${blocked.reason || "No reason provided"}`}
              className="flex items-center justify-center border-r border-border px-1 py-2 last:border-r-0"
            >
              <span
                className={`block h-7 w-full rounded-md bg-red-400/75 ${isToday ? "ring-2 ring-red-500 ring-offset-1" : ""}`}
                title={blocked.reason || "Blocked"}
              />
            </div>
          );
        }

        if (booking) {
          const cellClass =
            booking.status === "confirmed"
              ? "bg-emerald-500/80 hover:bg-emerald-600/80"
              : "bg-amber-400/80 hover:bg-amber-500/80";

          return (
            <div
              key={dateStr}
              className="flex items-center justify-center border-r border-border px-1 py-2 last:border-r-0"
            >
              <Link
                to="/bookings/$id"
                params={{ id: String(booking.id) }}
                title={`${booking.name} · ${booking.status}`}
                className={`block h-7 w-full rounded-md transition-[background-color] ${cellClass} ${
                  isToday ? "ring-2 ring-primary ring-offset-1" : ""
                }`}
                aria-label={`Open booking ${booking.id} for ${booking.name}`}
              >
                <span className="sr-only">
                  {booking.name} {booking.status}
                </span>
              </Link>
            </div>
          );
        }

        return (
          <div
            key={dateStr}
            className="flex items-center justify-center border-r border-border px-1 py-2 last:border-r-0"
          >
            {isToday ? (
              <span className="block h-7 w-full rounded-md bg-primary/10 ring-2 ring-primary/40 ring-offset-1" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
