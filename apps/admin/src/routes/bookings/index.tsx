import { useMemo, useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { z } from "zod";
import { getBookings, type Booking } from "@/lib/api";
import {
  AdminPage,
  EmptyState,
  FilterChip,
  PageHeader,
  PageSection,
  SectionTitle,
  StatStrip,
} from "@/components/AdminUI";
import { StatusBadge } from "@/components/StatusBadge";
import { DataTable } from "@/components/data-table";
import { cabins, formatGYD } from "@workspace/shared";
import { buttonVariants } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { cn } from "@workspace/ui/lib/utils";

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

function formatDateRange(checkIn: string, checkOut: string): string {
  try {
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    return `${format(inDate, "MMM d")} – ${format(outDate, "MMM d")}`;
  } catch {
    return `${checkIn} – ${checkOut}`;
  }
}

function BookingsPage() {
  const { status } = Route.useSearch();
  const navigate = useNavigate({ from: "/bookings/" });
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ rows: Booking[]; total: number }>({ rows: [], total: 0 });
  const [loading, setLoading] = useState(true);

  const limit = 100;

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

  const columns = useMemo<ColumnDef<Booking>[]>(
    () => [
      {
        id: "booking",
        accessorFn: (row) => `${row.id} ${row.name} ${row.contact}`,
        header: "Booking",
        cell: ({ row }) => {
          const booking = row.original;
          return (
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">
                #{booking.id} · {booking.name}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {booking.contact}
              </p>
            </div>
          );
        },
      },
      {
        id: "stayType",
        accessorKey: "stayType",
        header: "Stay Type",
        cell: ({ row }) => (
          <Badge variant={row.original.stayType === "overnight" ? "default" : "outline"}>
            {row.original.stayType === "overnight" ? "Overnight" : "Day Use"}
          </Badge>
        ),
      },
      {
        id: "cabin",
        accessorKey: "cabinSlug",
        header: "Cabin",
        cell: ({ row }) => {
          const cabin = cabins.find((c) => c.slug === row.original.cabinSlug);
          return (
            <span className="text-muted-foreground">
              {cabin?.name ?? row.original.cabinSlug}
            </span>
          );
        },
      },
      {
        id: "dates",
        accessorFn: (row) => `${row.checkIn} ${row.checkOut}`,
        header: "Dates",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {formatDateRange(row.original.checkIn, row.original.checkOut)}
          </span>
        ),
      },
      {
        id: "value",
        accessorKey: "estimatedTotalGyd",
        header: "Value",
        cell: ({ row }) => (
          <span className="font-medium tabular-nums text-foreground">
            {formatGYD(row.original.estimatedTotalGyd)}
          </span>
        ),
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "action",
        header: "Open",
        enableHiding: false,
        cell: ({ row }) => (
          <Link
            to="/bookings/$id"
            params={{ id: String(row.original.id) }}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            View
          </Link>
        ),
      },
    ],
    []
  );

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
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Open Calendar
            </Link>
            <Link
              to="/cabins"
              className={cn(buttonVariants({ size: "sm" }))}
            >
              View Cabins
            </Link>
          </>
        }
        meta={
          <>
            <Badge variant={status === "pending" ? "default" : "secondary"}>
              {status === "all" ? "All statuses" : `${status} queue`}
            </Badge>
            <Badge variant="outline">{data.total} total bookings</Badge>
            {totalPages > 0 && (
              <Badge variant="outline">
                Page {page} of {totalPages}
              </Badge>
            )}
          </>
        }
      />

      <StatStrip stats={[
        { label: "Loaded Bookings", value: String(data.rows.length), tone: "slate" },
        { label: "Estimated Value", value: formatGYD(estimatedRevenue), tone: "green" },
        { label: "Overnight", value: String(overnightCount), tone: "slate" },
        { label: "Day Use", value: String(dayUseCount), tone: "amber" },
      ]} />

      <PageSection className="p-4 sm:p-5">
        <SectionTitle
          title="Booking Queue"
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

        <div className="mt-6">
          {!loading && data.rows.length === 0 ? (
            <EmptyState
              title="No bookings found"
              description="This queue is empty right now. Switch the status filter or return later when new requests arrive."
            />
          ) : (
            <DataTable
              columns={columns}
              data={data.rows}
              isLoading={loading}
              searchKey="booking"
              searchPlaceholder="Search by name, ID, or contact…"
              pageSize={20}
            />
          )}
        </div>

        {totalPages > 1 && !loading ? (
          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {data.total} total bookings · page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "disabled:cursor-not-allowed disabled:opacity-40")}
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page === totalPages}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "disabled:cursor-not-allowed disabled:opacity-40")}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </PageSection>
    </AdminPage>
  );
}
