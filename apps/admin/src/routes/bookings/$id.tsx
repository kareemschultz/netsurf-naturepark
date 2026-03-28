import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { getBooking, updateBooking, type Booking } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { cabins, addOns, formatGYD } from "@workspace/shared";
import { format, differenceInCalendarDays } from "date-fns";

export const Route = createFileRoute("/bookings/$id")({
  component: BookingDetailPage,
});

function BookingDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    getBooking(parseInt(id, 10))
      .then((b) => { setBooking(b); setAdminNotes(b.adminNotes); })
      .catch(() => navigate({ to: "/bookings", search: { status: "all" } }))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStatus(status: Booking["status"]) {
    if (!booking) return;
    setSaving(true);
    try {
      const updated = await updateBooking(booking.id, { status, adminNotes });
      setBooking(updated);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveNotes() {
    if (!booking) return;
    setSaving(true);
    try {
      const updated = await updateBooking(booking.id, { adminNotes });
      setBooking(updated);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-muted-foreground text-sm">Loading…</div>;
  }
  if (!booking) return null;

  const cabin = cabins.find((c) => c.slug === booking.cabinSlug);
  const chosenAddOns = addOns.filter((a) => booking.addOnSlugs.includes(a.slug));
  const nights = differenceInCalendarDays(new Date(booking.checkOut), new Date(booking.checkIn));

  // Build WhatsApp link if contact looks like a phone number
  const contactDigits = booking.contact.replace(/\D/g, "");
  const whatsappLink =
    contactDigits.length >= 7
      ? `https://wa.me/${contactDigits}?text=${encodeURIComponent(
          `Hi ${booking.name}! Your booking request for ${cabin?.name ?? booking.cabinSlug} (${booking.checkIn} → ${booking.checkOut}) at Netsurf Nature Park has been ${booking.status}.`
        )}`
      : null;

  return (
    <div className="p-8 max-w-3xl">
      {/* Back */}
      <Link
        to="/bookings"
        search={{ status: "all" }}
        className="text-xs text-muted-foreground hover:text-foreground mb-5 inline-block"
      >
        ← All Bookings
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black">Booking #{booking.id}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Submitted {format(new Date(booking.createdAt), "d MMMM yyyy, HH:mm")}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Booking info */}
        <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
          <h2 className="font-bold text-sm uppercase tracking-widest text-muted-foreground mb-3">
            Booking Details
          </h2>

          <DetailRow label="Cabin" value={cabin?.name ?? booking.cabinSlug} />
          <DetailRow
            label="Dates"
            value={`${booking.checkIn} → ${booking.checkOut} (${nights} night${nights !== 1 ? "s" : ""})`}
          />
          <DetailRow label="Guests" value={String(booking.guests)} />
          <DetailRow
            label="Add-ons"
            value={chosenAddOns.length > 0 ? chosenAddOns.map((a) => a.name).join(", ") : "None"}
          />
          <DetailRow label="Total (est.)" value={formatGYD(booking.estimatedTotalGyd)} bold />
        </div>

        {/* Guest info */}
        <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
          <h2 className="font-bold text-sm uppercase tracking-widest text-muted-foreground mb-3">
            Guest Details
          </h2>

          <DetailRow label="Name" value={booking.name} />
          <DetailRow label="Contact" value={booking.contact} />
          {booking.notes && <DetailRow label="Notes" value={booking.notes} />}

          {/* WhatsApp contact button */}
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#25D366" }}
            >
              <WhatsAppIcon />
              Message on WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* Actions */}
      {(booking.status === "pending") && (
        <div className="mt-5 bg-white rounded-2xl border border-border p-6">
          <h2 className="font-bold text-sm uppercase tracking-widest text-muted-foreground mb-4">
            Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleStatus("confirmed")}
              disabled={saving}
              className="rounded-full px-6 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#2D5016" }}
            >
              ✅ Confirm Booking
            </button>
            <button
              onClick={() => handleStatus("declined")}
              disabled={saving}
              className="rounded-full px-6 py-2 text-sm font-bold text-white bg-red-600 transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              ❌ Decline
            </button>
          </div>
        </div>
      )}

      {/* If already actioned, allow re-open or cancel */}
      {booking.status !== "pending" && booking.status !== "cancelled" && (
        <div className="mt-5 bg-white rounded-2xl border border-border p-6">
          <h2 className="font-bold text-sm uppercase tracking-widest text-muted-foreground mb-4">
            Change Status
          </h2>
          <div className="flex flex-wrap gap-3">
            {booking.status !== "confirmed" && (
              <button
                onClick={() => handleStatus("confirmed")}
                disabled={saving}
                className="rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: "#2D5016" }}
              >
                Mark Confirmed
              </button>
            )}
            {booking.status !== "declined" && (
              <button
                onClick={() => handleStatus("declined")}
                disabled={saving}
                className="rounded-full px-5 py-2 text-sm font-semibold text-white bg-red-600 disabled:opacity-50"
              >
                Mark Declined
              </button>
            )}
            <button
              onClick={() => handleStatus("cancelled")}
              disabled={saving}
              className="rounded-full px-5 py-2 text-sm font-semibold border-2 border-border hover:border-foreground transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Admin notes */}
      <div className="mt-5 bg-white rounded-2xl border border-border p-6">
        <h2 className="font-bold text-sm uppercase tracking-widest text-muted-foreground mb-3">
          Admin Notes
        </h2>
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Internal notes (not visible to guest)…"
          rows={3}
          className="w-full rounded-xl border-2 border-border px-4 py-2.5 text-sm outline-none focus:border-[#2D5016] transition-colors resize-none"
        />
        <button
          onClick={handleSaveNotes}
          disabled={saving || adminNotes === booking.adminNotes}
          className="mt-3 rounded-full px-5 py-2 text-sm font-semibold border-2 border-[#2D5016] text-[#2D5016] hover:bg-[#2D5016] hover:text-white transition-colors disabled:opacity-40"
        >
          Save Notes
        </button>
      </div>
    </div>
  );
}

function DetailRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex gap-3">
      <span className="text-xs text-muted-foreground uppercase font-bold tracking-wide w-20 shrink-0 pt-0.5">
        {label}
      </span>
      <span className={`text-sm flex-1 leading-relaxed ${bold ? "font-bold" : ""}`}>{value}</span>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.132.558 4.13 1.532 5.864L0 24l6.29-1.51A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.369l-.36-.214-3.733.897.939-3.63-.234-.373A9.818 9.818 0 1112 21.818z"/>
    </svg>
  );
}
