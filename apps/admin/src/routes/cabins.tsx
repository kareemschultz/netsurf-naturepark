import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getCabinAvailability, type CabinAvailabilityResponse } from "@/lib/api";

export const Route = createFileRoute("/cabins")({
  component: CabinsAvailabilityPage,
});

function CabinsAvailabilityPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [data, setData] = useState<CabinAvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCabinAvailability(date)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [date]);

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-black">Cabin Availability</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Read-only daytime and overnight cabin status for walk-in staff checks.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setDate(today)}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-white"
          >
            Today
          </button>
          <button
            onClick={() => setDate(today)}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-white"
          >
            Tonight
          </button>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-[#2D5016]"
          />
        </div>
      </div>

      {loading || !data ? (
        <div className="rounded-2xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">
          Loading cabin availability...
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {data.cabins.map((cabin) => (
            <div
              key={cabin.slug}
              className="rounded-3xl border border-border bg-white p-6 shadow-sm"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black">{cabin.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Status for {data.date}
                  </p>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold"
                  style={{
                    backgroundColor: "#F0F7EA",
                    color: "#2D5016",
                  }}
                >
                  Max {cabin.maxGuests} guests
                </span>
              </div>

              {cabin.blocked && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  Blocked: {cabin.blocked.reason || "Unavailable"}
                </div>
              )}

              <div className="space-y-3">
                <StatusRow
                  label="Overnight"
                  state={
                    cabin.blocked
                      ? "Blocked"
                      : cabin.overnight
                        ? "Occupied"
                        : "Available"
                  }
                  accent={
                    cabin.blocked
                      ? "gray"
                      : cabin.overnight
                        ? "red"
                        : "green"
                  }
                  details={
                    cabin.overnight ? (
                      <Link
                        to="/bookings/$id"
                        params={{ id: String(cabin.overnight.id) }}
                        className="hover:underline"
                      >
                        {cabin.overnight.guestName} · checkout {cabin.overnight.checkOut}
                      </Link>
                    ) : (
                      "No overnight booking"
                    )
                  }
                />

                <StatusRow
                  label="Day Use"
                  state={
                    cabin.blocked
                      ? "Blocked"
                      : cabin.dayUse
                        ? "Booked"
                        : "Available"
                  }
                  accent={
                    cabin.blocked
                      ? "gray"
                      : cabin.dayUse
                        ? "amber"
                        : "green"
                  }
                  details={
                    cabin.dayUse ? (
                      <Link
                        to="/bookings/$id"
                        params={{ id: String(cabin.dayUse.id) }}
                        className="hover:underline"
                      >
                        {cabin.dayUse.guestName} · day visit
                      </Link>
                    ) : (
                      "No day-use booking"
                    )
                  }
                />
              </div>

              <div className="mt-5 rounded-2xl border border-border bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold">Upcoming Overnight Check-ins</p>
                  <span className="text-xs text-muted-foreground">
                    {cabin.status.replace("_", " ")}
                  </span>
                </div>
                {cabin.upcomingCheckIns.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    No upcoming overnight arrivals queued.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {cabin.upcomingCheckIns.map((booking) => (
                      <Link
                        key={booking.id}
                        to="/bookings/$id"
                        params={{ id: String(booking.id) }}
                        className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm transition-colors hover:bg-muted/40"
                      >
                        <span className="font-semibold">{booking.guestName}</span>
                        <span className="text-xs text-muted-foreground">
                          {booking.checkIn} → {booking.checkOut}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusRow({
  label,
  state,
  details,
  accent,
}: {
  label: string;
  state: string;
  details: React.ReactNode;
  accent: "green" | "red" | "amber" | "gray";
}) {
  const palette = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
    gray: "bg-gray-100 text-gray-600",
  } as const;

  return (
    <div className="rounded-2xl border border-border bg-muted/10 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold">{label}</p>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${palette[accent]}`}>
          {state}
        </span>
      </div>
      <div className="mt-2 text-sm text-muted-foreground">{details}</div>
    </div>
  );
}
