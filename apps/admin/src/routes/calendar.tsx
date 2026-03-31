import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getCalendar, type BlockedDate, type Booking, type CalendarResponse } from "@/lib/api";
import {
  AdminPage,
  InfoPill,
  MetricCard,
  PageHeader,
  PageSection,
  SectionTitle,
} from "@/components/AdminUI";

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
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              aria-label="Previous month"
              className="admin-button-secondary rounded-full px-4 py-3 text-sm font-bold"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              aria-label="Next month"
              className="admin-button-secondary rounded-full px-4 py-3 text-sm font-bold"
            >
              Next
            </button>
            {!isCurrentMonth ? (
              <button
                type="button"
                onClick={() => {
                  setYear(now.getFullYear());
                  setMonth(now.getMonth() + 1);
                }}
                className="admin-button-primary rounded-full px-5 py-3 text-sm font-bold"
              >
                Jump to Today
              </button>
            ) : null}
          </>
        }
        meta={
          <>
            <InfoPill tone="green">{monthLabel.format(monthDate)}</InfoPill>
            <InfoPill>{calendar?.cabins.length ?? 0} cabins</InfoPill>
            <InfoPill tone="amber">{blockedRows.length} blocked ranges</InfoPill>
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
            <div className="flex flex-wrap gap-2">
              <InfoPill tone="green">Confirmed</InfoPill>
              <InfoPill tone="amber">Pending</InfoPill>
              <InfoPill tone="red">Blocked</InfoPill>
            </div>
          }
        />

        {loading || !calendar ? (
          <div className="rounded-[1.7rem] border border-dashed border-primary/14 bg-primary/4 px-6 py-12 text-center text-sm text-muted-foreground">
            Loading calendar…
          </div>
        ) : (
          <div className="overflow-hidden rounded-[1.7rem] border border-primary/10 bg-white/76">
            <div className="admin-scrollbar overflow-x-auto">
              <div className="min-w-[1100px]">
                <div
                  className="grid border-b border-primary/8 bg-primary/4"
                  style={{
                    gridTemplateColumns: `16rem repeat(${days.length}, minmax(2.35rem, 1fr))`,
                  }}
                >
                  <div className="border-r border-primary/8 px-5 py-4 text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
                    Cabin
                  </div>
                  {days.map((day) => {
                    const isToday = isCurrentMonth && day === now.getDate();

                    return (
                      <div
                        key={day}
                        className={`flex items-center justify-center border-r border-primary/8 px-2 py-4 text-xs font-bold last:border-r-0 ${
                          isToday ? "bg-primary text-white" : "text-muted-foreground"
                        }`}
                      >
                        {day}
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
                  <InfoPill tone="green">{cabinConfirmed} confirmed</InfoPill>
                  <InfoPill tone="amber">{cabinPending} pending</InfoPill>
                  <InfoPill tone="red">{cabinBlocked} blocked</InfoPill>
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
      className="grid border-b border-primary/8 last:border-b-0"
      style={{ gridTemplateColumns: columnTemplate }}
    >
      <div className="border-r border-primary/8 bg-primary/3 px-5 py-4">
        <p className="font-semibold text-foreground">{cabin.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">Monthly occupancy row</p>
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
              className={`border-r border-primary/8 bg-red-200/85 px-1 py-2 last:border-r-0 ${
                isToday ? "ring-1 ring-inset ring-primary/30" : ""
              }`}
            />
          );
        }

        if (booking) {
          const toneClass =
            booking.status === "confirmed"
              ? "bg-emerald-200/90 hover:bg-emerald-300/90"
              : "bg-amber-200/90 hover:bg-amber-300/90";

          return (
            <Link
              key={dateStr}
              to="/bookings/$id"
              params={{ id: String(booking.id) }}
              title={`${booking.name} · ${booking.status}`}
              className={`block border-r border-primary/8 px-1 py-2 transition-[background-color] last:border-r-0 ${toneClass} ${
                isToday ? "ring-1 ring-inset ring-primary/30" : ""
              }`}
              aria-label={`Open booking ${booking.id} for ${booking.name}`}
            >
              <span className="sr-only">
                {booking.name} {booking.status}
              </span>
            </Link>
          );
        }

        return (
          <div
            key={dateStr}
            className={`border-r border-primary/8 px-1 py-2 last:border-r-0 ${
              isToday ? "bg-primary/5 ring-1 ring-inset ring-primary/30" : ""
            }`}
          />
        );
      })}
    </div>
  );
}
