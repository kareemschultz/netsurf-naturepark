import { useState, useEffect } from "react"
import { createFileRoute } from "@tanstack/react-router"
import {
  getBlockedDates,
  createBlockedDate,
  deleteBlockedDate,
  type BlockedDate,
} from "@/lib/api"
import { cabins } from "@workspace/shared"
import { format } from "date-fns"

export const Route = createFileRoute("/blocked")({
  component: BlockedDatesPage,
})

function BlockedDatesPage() {
  const [rows, setRows] = useState<BlockedDate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    cabinSlug: "" as string | null,
    startDate: "",
    endDate: "",
    reason: "",
  })

  useEffect(() => {
    load()
  }, [])

  function load() {
    setLoading(true)
    getBlockedDates()
      .then(setRows)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await createBlockedDate({
        cabinSlug: form.cabinSlug || null,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
      })
      setForm({ cabinSlug: "", startDate: "", endDate: "", reason: "" })
      load()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Remove this blocked date range?")) return
    await deleteBlockedDate(id)
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  const cabinName = (slug: string | null) =>
    slug ? (cabins.find((c) => c.slug === slug)?.name ?? slug) : "All Cabins"

  return (
    <div className="max-w-3xl p-8">
      <h1 className="mb-1 text-2xl font-black">Blocked Dates</h1>
      <p className="mb-7 text-sm text-muted-foreground">
        Block specific date ranges to prevent bookings — e.g. maintenance,
        private events.
      </p>

      {/* Add form */}
      <div className="mb-6 rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-4 text-sm font-bold tracking-widest text-muted-foreground uppercase">
          Block a Date Range
        </h2>
        <form onSubmit={handleAdd} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="blocked-cabin"
              className="mb-1 block text-xs font-semibold"
            >
              Cabin
            </label>
            <select
              id="blocked-cabin"
              name="cabinSlug"
              value={form.cabinSlug ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, cabinSlug: e.target.value || null }))
              }
              className="w-full rounded-xl border-2 border-border px-3 py-2 text-sm outline-none focus:border-[#2D5016]"
            >
              <option value="">All Cabins</option>
              {cabins.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="blocked-reason"
              className="mb-1 block text-xs font-semibold"
            >
              Reason (optional)
            </label>
            <input
              id="blocked-reason"
              name="reason"
              type="text"
              autoComplete="off"
              value={form.reason}
              onChange={(e) =>
                setForm((f) => ({ ...f, reason: e.target.value }))
              }
              placeholder="e.g. Maintenance"
              className="w-full rounded-xl border-2 border-border px-3 py-2 text-sm outline-none focus:border-[#2D5016]"
            />
          </div>

          <div>
            <label
              htmlFor="blocked-start-date"
              className="mb-1 block text-xs font-semibold"
            >
              Start Date *
            </label>
            <input
              id="blocked-start-date"
              name="startDate"
              type="date"
              required
              value={form.startDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, startDate: e.target.value }))
              }
              className="w-full rounded-xl border-2 border-border px-3 py-2 text-sm outline-none focus:border-[#2D5016]"
            />
          </div>

          <div>
            <label
              htmlFor="blocked-end-date"
              className="mb-1 block text-xs font-semibold"
            >
              End Date *
            </label>
            <input
              id="blocked-end-date"
              name="endDate"
              type="date"
              required
              value={form.endDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, endDate: e.target.value }))
              }
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
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-bold">Existing Blocks</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No blocked dates.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((row) => (
              <div key={row.id} className="flex items-center gap-4 px-6 py-3.5">
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {cabinName(row.cabinSlug)}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {row.startDate} → {row.endDate}
                    {row.reason && ` · ${row.reason}`}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(row.id)}
                  className="text-xs font-semibold text-red-500 transition-colors hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
