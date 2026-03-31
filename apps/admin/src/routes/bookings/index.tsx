import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { getBookings, type Booking } from "@/lib/api";
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
import { StatusBadge } from "@/components/StatusBadge";
import { cabins, formatGYD } from "@workspace/shared";

const searchSchema = z.object({
  status: z.enum(["all", "pending", "confirmed", "declined", "cancelled"]).catch("all"),
});

export const Route = createFileRoute("/bookings/")({
  validateSearch: searchSchema,
  component: BookingsPage,
});

const TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "declined", label: "Declined" },
  { value: "cancelled", label: "Cancelled" },
] as const;

const fullDateTime = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function BookingsPage() {
  const { status } = Route.useSearch();
  const navigate = useNavigate({ from: "/bookings/" });
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ rows: Booking[]; total: number }>({ rows: [], total: 0 });
  const [loading, setLoading] = useState(true);

  const limit = 20;

  useEffect(() => {
    setPage(1);
  }, [status]);

  useEffect(() => {
    setLoading(true);
    getBookings({ status: status === "all" ? undefined : status, page, limit })
      .then((res) => setData({ rows: res.data, total: res.total }))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [status, page]);

  const totalPages = Math.ceil(data.total / limit);
  const estimatedRevenue = useMemo(
    () => data.rows.reduce((sum, booking) => sum + booking.estimatedTotalGyd, 0),
    [data.rows]
  );
  const overnightCount = useMemo(
    () => data.rows.filter((booking) => booking.stayType === "overnight").length,
    [data.rows]
  );
  const dayUseCount = data.rows.length - overnightCount;

  return (
    <AdminPage className="max-w-[1500px]">
      <PageHeader
        eyebrow="Reservations"
        title="Bookings, approvals, and guest records"
        description="Review booking demand by status, open each reservation for action, and keep daytime visits and overnight stays visible in one queue."
        actions={
          <>
            <Link
              to="/calendar"
              className="admin-button-secondary rounded-full px-5 py-3 text-sm font-bold"
            >
              Open Calendar
            </Link>
            <Link
              to="/cabins"
              className="admin-button-primary rounded-full px-5 py-3 text-sm font-bold"
            >
              View Cabins
            </Link>
          </>
        }
        meta={
          <>
            <InfoPill tone={status === "pending" ? "amber" : "green"}>
              {status === "all" ? "All statuses" : `${status} queue`}
            </InfoPill>
            <InfoPill>{data.total} total bookings</InfoPill>
            <InfoPill>
              Page {page}
              {totalPages > 0 ? ` of ${totalPages}` : ""}
            </InfoPill>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Loaded Bookings"
          value={String(data.rows.length)}
          note="Entries in the current page view"
        />
        <MetricCard
          label="Estimated Value"
          value={formatGYD(estimatedRevenue)}
          note="Current page total"
          tone="green"
        />
        <MetricCard
          label="Overnight"
          value={String(overnightCount)}
          note="Longer-stay reservations"
          tone="slate"
        />
        <MetricCard
          label="Day Use"
          value={String(dayUseCount)}
          note="Single-day cabin use"
          tone="amber"
        />
      </div>

      <PageSection className="p-6 sm:p-7">
        <SectionTitle
          title="Booking Queue"
          description="Filter by status and open any reservation for detailed review, notes, or status changes."
        />

        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <FilterChip
              key={tab.value}
              type="button"
              active={status === tab.value}
              onClick={() => navigate({ search: { status: tab.value } })}
            >
              {tab.label}
            </FilterChip>
          ))}
        </div>

        {loading ? (
          <div className="mt-6 rounded-[1.7rem] border border-dashed border-primary/14 bg-primary/4 px-6 py-12 text-center text-sm text-muted-foreground">
            Loading bookings…
          </div>
        ) : data.rows.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No bookings found"
              description="This queue is empty right now. Switch the status filter or return later when new requests arrive."
            />
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-[1.7rem] border border-primary/10 bg-white/76">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-primary/8 bg-primary/4">
                    <th className="px-5 py-4 text-left text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
                      Booking
                    </th>
                    <th className="px-5 py-4 text-left text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
                      Stay
                    </th>
                    <th className="px-5 py-4 text-left text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
                      Cabin
                    </th>
                    <th className="px-5 py-4 text-left text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
                      Dates
                    </th>
                    <th className="px-5 py-4 text-left text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
                      Value
                    </th>
                    <th className="px-5 py-4 text-left text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
                      Status
                    </th>
                    <th className="px-5 py-4 text-right text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
                      Open
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/8">
                  {data.rows.map((booking) => {
                    const cabin = cabins.find((entry) => entry.slug === booking.cabinSlug);

                    return (
                      <tr key={booking.id} className="hover:bg-primary/3">
                        <td className="px-5 py-4">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">
                              #{booking.id} · {booking.name}
                            </p>
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              {booking.contact} · submitted{" "}
                              {fullDateTime.format(new Date(booking.createdAt))}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <InfoPill tone={booking.stayType === "overnight" ? "green" : "amber"}>
                            {booking.stayType === "overnight" ? "Overnight" : "Day Use"}
                          </InfoPill>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">
                          {cabin?.name ?? booking.cabinSlug}
                        </td>
                        <td className="px-5 py-4 font-medium text-foreground">
                          {booking.checkIn} → {booking.checkOut}
                        </td>
                        <td className="px-5 py-4 font-semibold tabular-nums text-foreground">
                          {formatGYD(booking.estimatedTotalGyd)}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={booking.status} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            to="/bookings/$id"
                            params={{ id: String(booking.id) }}
                            className="admin-button-secondary inline-flex rounded-full px-4 py-2 text-sm font-semibold"
                          >
                            Open
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 ? (
              <div className="flex flex-col gap-3 border-t border-primary/8 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  {data.total} total bookings · page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page === 1}
                    className="admin-button-secondary rounded-full px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={page === totalPages}
                    className="admin-button-secondary rounded-full px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </PageSection>
    </AdminPage>
  );
}
