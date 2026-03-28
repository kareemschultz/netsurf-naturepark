import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { getBookings, type Booking } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { cabins, formatGYD } from "@workspace/shared";
import { format } from "date-fns";

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

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black mb-6">Bookings</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl border border-border p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => navigate({ search: { status: tab.value } })}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              status === tab.value
                ? "text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={status === tab.value ? { backgroundColor: "#2D5016" } : undefined}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading…</div>
        ) : data.rows.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">No bookings found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">#</th>
                    <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Guest</th>
                    <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Cabin</th>
                    <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Dates</th>
                    <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Total</th>
                    <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.rows.map((b) => {
                    const cabin = cabins.find((c) => c.slug === b.cabinSlug);
                    return (
                      <tr
                        key={b.id}
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => navigate({ to: "/bookings/$id", params: { id: String(b.id) } })}
                      >
                        <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">#{b.id}</td>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold">{b.name}</p>
                          <p className="text-xs text-muted-foreground">{b.contact}</p>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">
                          {cabin?.name ?? b.cabinSlug}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs">
                          {b.checkIn} → {b.checkOut}
                        </td>
                        <td className="px-5 py-3.5 font-semibold">
                          {formatGYD(b.estimatedTotalGyd)}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={b.status} />
                        </td>
                        <td className="px-5 py-3.5 text-xs text-muted-foreground">
                          {format(new Date(b.createdAt), "d MMM, HH:mm")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-3 border-t border-border flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {data.total} total · page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 rounded-lg border border-border text-xs font-semibold disabled:opacity-40 hover:bg-muted transition-colors"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 rounded-lg border border-border text-xs font-semibold disabled:opacity-40 hover:bg-muted transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
