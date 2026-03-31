import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  createBlockedDate,
  deleteBlockedDate,
  getBlockedDates,
  type BlockedDate,
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
import { cabins } from "@workspace/shared";

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

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
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
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Remove this blocked date range?")) return;
    await deleteBlockedDate(id);
    setRows((current) => current.filter((row) => row.id !== id));
  }

  const parkwideCount = useMemo(
    () => rows.filter((row) => row.cabinSlug === null).length,
    [rows]
  );
  const cabinSpecificCount = rows.length - parkwideCount;
  const nextBlock = useMemo(
    () =>
      [...rows]
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
        .find((row) => row.startDate >= new Date().toISOString().slice(0, 10)) ?? null,
    [rows]
  );

  return (
    <AdminPage className="max-w-[1500px]">
      <PageHeader
        eyebrow="Availability Control"
        title="Blocked dates, closures, and maintenance holds"
        description="Protect cabin inventory from accidental bookings by applying parkwide or cabin-specific hold ranges for maintenance, private events, or operational overrides."
        meta={
          <>
            <InfoPill tone="amber">{rows.length} active blocks</InfoPill>
            <InfoPill>{parkwideCount} parkwide</InfoPill>
            <InfoPill>{cabinSpecificCount} cabin specific</InfoPill>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active Blocks"
          value={String(rows.length)}
          note="All stored availability holds"
          tone="amber"
        />
        <MetricCard
          label="Parkwide"
          value={String(parkwideCount)}
          note="Applies to every cabin"
          tone="red"
        />
        <MetricCard
          label="Cabin Specific"
          value={String(cabinSpecificCount)}
          note="Scoped to a single cabin"
          tone="slate"
        />
        <MetricCard
          label="Next Block"
          value={nextBlock ? nextBlock.startDate : "None"}
          note={nextBlock ? cabinName(nextBlock.cabinSlug) : "No future blocks scheduled"}
          tone="green"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[24rem_minmax(0,1fr)]">
        <PageSection className="p-6 sm:p-7">
          <SectionTitle
            title="Create Block"
            description="Add a maintenance or closure range and keep reservation availability accurate."
          />

          <form onSubmit={handleAdd} className="space-y-4">
            <FieldLabel label="Cabin">
              <select
                name="cabin_slug"
                value={form.cabinSlug ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    cabinSlug: event.target.value || null,
                  }))
                }
                className="admin-input w-full rounded-[1.2rem] px-4 py-3 text-sm outline-none"
              >
                <option value="">All Cabins</option>
                {cabins.map((cabin) => (
                  <option key={cabin.slug} value={cabin.slug}>
                    {cabin.name}
                  </option>
                ))}
              </select>
            </FieldLabel>

            <FieldLabel label="Reason">
              <input
                type="text"
                name="reason"
                autoComplete="off"
                value={form.reason}
                onChange={(event) =>
                  setForm((current) => ({ ...current, reason: event.target.value }))
                }
                placeholder="Maintenance, private event, cleaning…"
                className="admin-input w-full rounded-[1.2rem] px-4 py-3 text-sm outline-none"
              />
            </FieldLabel>

            <div className="grid gap-4 sm:grid-cols-2">
              <FieldLabel label="Start Date">
                <input
                  type="date"
                  required
                  name="start_date"
                  value={form.startDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, startDate: event.target.value }))
                  }
                  className="admin-input w-full rounded-[1.2rem] px-4 py-3 text-sm outline-none"
                />
              </FieldLabel>

              <FieldLabel label="End Date">
                <input
                  type="date"
                  required
                  name="end_date"
                  value={form.endDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, endDate: event.target.value }))
                  }
                  className="admin-input w-full rounded-[1.2rem] px-4 py-3 text-sm outline-none"
                />
              </FieldLabel>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="admin-button-primary w-full rounded-full px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Block Dates"}
            </button>
          </form>
        </PageSection>

        <PageSection className="p-6 sm:p-7">
          <SectionTitle
            title="Existing Blocks"
            description="Review active hold windows and remove them once the cabin or park is ready to sell again."
          />

          {loading ? (
            <div className="rounded-[1.7rem] border border-dashed border-primary/14 bg-primary/4 px-6 py-12 text-center text-sm text-muted-foreground">
              Loading blocked dates…
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              title="No blocked dates"
              description="The park is fully open right now. New maintenance or closure holds will appear here."
            />
          ) : (
            <div className="space-y-3">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="rounded-[1.5rem] border border-primary/10 bg-white/78 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">
                        {cabinName(row.cabinSlug)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {row.startDate} → {row.endDate}
                      </p>
                      {row.reason ? (
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                          {row.reason}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <InfoPill tone={row.cabinSlug ? "amber" : "red"}>
                        {row.cabinSlug ? "Cabin Hold" : "Parkwide Hold"}
                      </InfoPill>
                      <button
                        type="button"
                        onClick={() => handleDelete(row.id)}
                        className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition-[background-color,border-color,color] hover:border-red-300 hover:bg-red-100"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PageSection>
      </div>
    </AdminPage>
  );
}

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

function cabinName(slug: string | null) {
  return slug ? (cabins.find((cabin) => cabin.slug === slug)?.name ?? slug) : "All Cabins";
}
