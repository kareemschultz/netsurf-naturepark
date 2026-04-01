import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  createAttendanceEntry,
  getAttendanceEntries,
  type AttendanceEntry,
} from "@/lib/api";
import {
  AdminPage,
  InfoPill,
  PageHeader,
  PageSection,
  SearchField,
  SectionTitle,
} from "@/components/AdminUI";

export const Route = createFileRoute("/attendance")({
  component: AttendancePage,
});

function AttendancePage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [staffName, setStaffName] = useState("");
  const [entries, setEntries] = useState<AttendanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newLocation, setNewLocation] = useState("Tonga");
  const [newEventType, setNewEventType] = useState<"clock_in" | "clock_out">("clock_in");
  const [newEventAt, setNewEventAt] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [newNotes, setNewNotes] = useState("");

  async function loadAttendance() {
    setLoading(true);
    setError(null);
    try {
      const data = await getAttendanceEntries({
        from: `${from}T00:00:00.000Z`,
        to: `${to}T23:59:59.999Z`,
        staffName: staffName.trim() || undefined,
      });
      setEntries(data);
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAttendance().catch(console.error);
  }, [from, to]);

  const totals = useMemo(() => {
    const clockIns = entries.filter((entry) => entry.eventType === "clock_in").length;
    const clockOuts = entries.filter((entry) => entry.eventType === "clock_out").length;
    const staffCount = new Set(entries.map((entry) => entry.staffName.toLowerCase())).size;
    return { clockIns, clockOuts, staffCount };
  }, [entries]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newName.trim()) return;

    setSaving(true);
    setError(null);
    try {
      await createAttendanceEntry({
        staffName: newName.trim(),
        location: newLocation.trim() || "Tonga",
        eventType: newEventType,
        eventAt: new Date(newEventAt).toISOString(),
        source: "manual",
        notes: newNotes,
      });
      setNewName("");
      setNewNotes("");
      await loadAttendance();
    } catch (createError) {
      setError((createError as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminPage>
      <PageHeader
        eyebrow="Operations"
        title="Staff Attendance"
        description="Back-end attendance record for POS sign-ins and manual entries (e.g. Tonga rotating shifts)."
        meta={
          <>
            <InfoPill tone="neutral">Clock-ins: {totals.clockIns}</InfoPill>
            <InfoPill tone="neutral">Clock-outs: {totals.clockOuts}</InfoPill>
            <InfoPill tone="neutral">Staff tracked: {totals.staffCount}</InfoPill>
          </>
        }
      />

      <PageSection className="space-y-4 p-5 sm:p-6">
        <SectionTitle
          title="Filters"
          description="Filter attendance records by day range and staff member name."
        />
        <div className="grid gap-3 md:grid-cols-4">
          <label className="admin-input rounded-xl px-3 py-2 text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">From</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full bg-transparent outline-none" />
          </label>
          <label className="admin-input rounded-xl px-3 py-2 text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">To</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full bg-transparent outline-none" />
          </label>
          <div className="md:col-span-2">
            <SearchField
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              placeholder="Search staff name"
            />
          </div>
        </div>
        <button className="admin-button-primary" onClick={() => loadAttendance().catch(console.error)}>
          Apply filters
        </button>
      </PageSection>

      <PageSection className="space-y-4 p-5 sm:p-6">
        <SectionTitle
          title="Add attendance record"
          description="Use this for manual capture when staff are on part-time or rotating shifts."
        />
        <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-2">
          <input className="admin-input rounded-xl px-3 py-2" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Staff name" required />
          <input className="admin-input rounded-xl px-3 py-2" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="Location" />
          <select className="admin-input rounded-xl px-3 py-2" value={newEventType} onChange={(e) => setNewEventType(e.target.value as "clock_in" | "clock_out")}>
            <option value="clock_in">Clock in</option>
            <option value="clock_out">Clock out</option>
          </select>
          <input className="admin-input rounded-xl px-3 py-2" type="datetime-local" value={newEventAt} onChange={(e) => setNewEventAt(e.target.value)} required />
          <textarea className="admin-input rounded-xl px-3 py-2 md:col-span-2" rows={2} value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Notes (optional)" />
          <button className="admin-button-primary md:col-span-2" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save attendance"}
          </button>
        </form>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </PageSection>

      <PageSection className="space-y-4 p-5 sm:p-6">
        <SectionTitle title="Attendance log" description="Latest entries first." />
        {loading ? <p className="text-sm text-muted-foreground">Loading attendance…</p> : null}
        {!loading && entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attendance entries found.</p>
        ) : null}
        <div className="space-y-2">
          {entries.map((entry) => (
            <article key={entry.id} className="admin-panel flex flex-col gap-2 rounded-xl p-3 text-sm md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-foreground">{entry.staffName}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.location} · {entry.eventType === "clock_in" ? "Clock in" : "Clock out"} · {new Date(entry.eventAt).toLocaleString()}
                </p>
                {entry.notes ? <p className="mt-1 text-xs text-muted-foreground">{entry.notes}</p> : null}
              </div>
              <InfoPill tone="neutral">Source: {entry.source}</InfoPill>
            </article>
          ))}
        </div>
      </PageSection>
    </AdminPage>
  );
}
