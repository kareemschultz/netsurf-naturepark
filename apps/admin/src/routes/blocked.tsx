import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  getBlockedDates,
  createBlockedDate,
  deleteBlockedDate,
  type BlockedDate,
} from "@/lib/api";
import { cabins } from "@workspace/shared";
import { format } from "date-fns";

export const Route = createFileRoute("/blocked")({
  component: BlockedDatesPage,
});

function BlockedDatesPage() {
  const [rows, setRows] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    cabinSlug: "" as string | null,
    startDate: "",
    endDate: "",
    reason: "",
  });

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    getBlockedDates()
      .then(setRows)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createBlockedDate({
        cabinSlug: form.cabinSlug || null,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
      });
      setForm({ cabinSlug: "", startDate: "", endDate: "", reason: "" });
      load();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Remove this blocked date range?")) return;
    await deleteBlockedDate(id);
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  const cabinName = (slug: string | null) =>
    slug ? (cabins.find((c) => c.slug === slug)?.name ?? slug) : "All Cabins";

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-black mb-1">Blocked Dates</h1>
      <p className="text-sm text-muted-foreground mb-7">
        Block specific date ranges to prevent bookings — e.g. maintenance, private events.
      </p>

      {/* Add form */}
      <div className="bg-white rounded-2xl border border-border p-6 mb-6">
        <h2 className="font-bold text-sm uppercase tracking-widest text-muted-foreground mb-4">
          Block a Date Range
        </h2>
        <form onSubmit={handleAdd} className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold block mb-1">Cabin</label>
            <select
              value={form.cabinSlug ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, cabinSlug: e.target.value || null }))}
              className="w-full rounded-xl border-2 border-border px-3 py-2 text-sm outline-none focus:border-[#2D5016]"
            >
              <option value="">All Cabins</option>
              {cabins.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Reason (optional)</label>
            <input
              type="text"
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="e.g. Maintenance"
              className="w-full rounded-xl border-2 border-border px-3 py-2 text-sm outline-none focus:border-[#2D5016]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Start Date *</label>
            <input
              type="date"
              required
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              className="w-full rounded-xl border-2 border-border px-3 py-2 text-sm outline-none focus:border-[#2D5016]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">End Date *</label>
            <input
              type="date"
              required
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              className="w-full rounded-xl border-2 border-border px-3 py-2 text-sm outline-none focus:border-[#2D5016]"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#2D5016" }}
            >
              {saving ? "Saving…" : "Block Dates"}
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-bold text-sm">Existing Blocks</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No blocked dates.</div>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((row) => (
              <div key={row.id} className="flex items-center gap-4 px-6 py-3.5">
                <div className="flex-1">
                  <p className="text-sm font-semibold">{cabinName(row.cabinSlug)}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {row.startDate} → {row.endDate}
                    {row.reason && ` · ${row.reason}`}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(row.id)}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
