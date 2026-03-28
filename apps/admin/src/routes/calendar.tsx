import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { getCalendar, type CalendarResponse, type Booking } from "@/lib/api";
import { format, getDaysInMonth } from "date-fns";
import { cabins } from "@workspace/shared";

export const Route = createFileRoute("/calendar")({
  component: CalendarPage,
});

function CalendarPage() {
  const now = new Date();
  const navigate = useNavigate();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [cal, setCal] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCalendar(year, month)
      .then(setCal)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [year, month]);

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  }

  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-black">Calendar</h1>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-white transition-colors text-sm font-bold"
          >
            ‹
          </button>
          <span className="text-sm font-bold w-36 text-center">
            {format(new Date(year, month - 1), "MMMM yyyy")}
          </span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-white transition-colors text-sm font-bold"
          >
            ›
          </button>
          {!isCurrentMonth && (
            <button
              onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1); }}
              className="ml-2 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border hover:bg-white transition-colors"
              style={{ color: "#2D5016" }}
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mb-4 text-xs font-semibold text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#86efac" }} />
          Confirmed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#fde68a" }} />
          Pending
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#fca5a5" }} />
          Blocked
        </span>
        <span className="text-xs text-muted-foreground ml-auto">
          Click a coloured cell to view booking
        </span>
      </div>

      {loading || !cal ? (
        <div className="bg-white rounded-2xl border border-border p-10 text-center text-muted-foreground text-sm">
          <div className="animate-spin w-5 h-5 border-2 border-border border-t-[#2D5016] rounded-full mx-auto mb-3" />
          Loading calendar…
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          {/* Day number header */}
          <div className="flex border-b border-border">
            <div className="w-44 shrink-0 px-4 py-2.5 text-xs font-bold text-muted-foreground border-r border-border bg-muted/20">
              Cabin
            </div>
            <div className="flex flex-1 overflow-x-auto">
              {days.map((d) => {
                const isToday = isCurrentMonth && d === now.getDate();
                return (
                  <div
                    key={d}
                    className={`flex-1 min-w-[26px] py-2 text-center text-xs font-semibold border-r border-border last:border-r-0 ${
                      isToday ? "text-white" : "text-muted-foreground"
                    }`}
                    style={isToday ? { backgroundColor: "#2D5016" } : undefined}
                  >
                    {d}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cabin rows */}
          {cal.cabins.map((cabin) => (
            <div key={cabin.slug} className="flex border-b border-border last:border-b-0">
              <div className="w-44 shrink-0 px-4 py-3 text-xs font-semibold border-r border-border flex items-center bg-muted/10">
                {cabin.name}
              </div>
              <div className="flex flex-1 overflow-x-auto">
                {days.map((d) => {
                  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                  const booking = cal.bookings.find(
                    (b) =>
                      b.cabinSlug === cabin.slug &&
                      b.checkIn <= dateStr &&
                      b.checkOut > dateStr
                  );
                  const blocked = cal.blocked.find(
                    (bl) =>
                      (bl.cabinSlug === cabin.slug || bl.cabinSlug === null) &&
                      bl.startDate <= dateStr &&
                      bl.endDate >= dateStr
                  );

                  const isToday = isCurrentMonth && d === now.getDate();

                  let bg = "transparent";
                  let tooltip = "";
                  let clickable = false;

                  if (blocked) {
                    bg = "#fca5a5";
                    tooltip = `Blocked: ${blocked.reason || "No reason"}`;
                  } else if (booking?.status === "confirmed") {
                    bg = "#86efac";
                    tooltip = `${booking.name} — confirmed`;
                    clickable = true;
                  } else if (booking?.status === "pending") {
                    bg = "#fde68a";
                    tooltip = `${booking.name} — pending`;
                    clickable = true;
                  }

                  return (
                    <div
                      key={d}
                      className={`flex-1 min-w-[26px] border-r border-border last:border-r-0 relative group ${
                        clickable ? "cursor-pointer hover:opacity-80" : ""
                      } ${isToday ? "ring-1 ring-inset ring-[#2D5016]/30" : ""}`}
                      style={{ backgroundColor: bg || (isToday ? "#f0f7ea" : "transparent") }}
                      title={tooltip || undefined}
                      onClick={() => {
                        if (clickable && booking) {
                          navigate({ to: "/bookings/$id", params: { id: String(booking.id) } });
                        }
                      }}
                    >
                      {/* Tooltip */}
                      {tooltip && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-20 hidden group-hover:block pointer-events-none">
                          <div className="bg-gray-900 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap max-w-[200px] shadow-lg">
                            {tooltip}
                          </div>
                        </div>
                      )}
                      <div className="py-3" />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary below calendar */}
      {cal && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {cabins.map((cabin) => {
            const confirmedCount = cal.bookings.filter(
              (b) => b.cabinSlug === cabin.slug && b.status === "confirmed"
            ).length;
            const pendingCount = cal.bookings.filter(
              (b) => b.cabinSlug === cabin.slug && b.status === "pending"
            ).length;
            if (confirmedCount === 0 && pendingCount === 0) return null;
            return (
              <div key={cabin.slug} className="bg-white rounded-xl border border-border px-4 py-3">
                <p className="text-xs font-bold text-muted-foreground truncate mb-1">{cabin.name}</p>
                <div className="flex gap-3 text-xs">
                  {confirmedCount > 0 && (
                    <span className="text-green-700 font-semibold">{confirmedCount} confirmed</span>
                  )}
                  {pendingCount > 0 && (
                    <span className="text-amber-600 font-semibold">{pendingCount} pending</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
