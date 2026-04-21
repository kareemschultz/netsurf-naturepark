import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { getBooking, updateBooking, type Booking } from "@/lib/api";
import {
  AdminPage,
  MetricCard,
  PageHeader,
  PageSection,
  SectionTitle,
} from "@/components/AdminUI";
import { StatusBadge } from "@/components/StatusBadge";
import { addOns, cabins, formatGYD } from "@workspace/shared";
import { differenceInCalendarDays } from "date-fns";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";

export const Route = createFileRoute("/bookings/$id")({
  component: BookingDetailPage,
});

const fullDateTime = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function BookingDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    getBooking(Number(id))
      .then((row) => {
        setBooking(row);
        setAdminNotes(row.adminNotes);
      })
      .catch(() => navigate({ to: "/bookings", search: { status: "all" } }))
      .finally(() => setLoading(false));
  }, [id, navigate]);

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
    return (
      <AdminPage>
        <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground">
          Loading booking…
        </div>
      </AdminPage>
    );
  }

  if (!booking) return null;

  const cabin = cabins.find((entry) => entry.slug === booking.cabinSlug);
  const chosenAddOns = addOns.filter((item) => booking.addOnSlugs.includes(item.slug));
  const nights = Math.max(
    differenceInCalendarDays(new Date(booking.checkOut), new Date(booking.checkIn)),
    0
  );
  const contactDigits = booking.contact.replace(/\D/g, "");
  const whatsappLink =
    contactDigits.length >= 7
      ? `https://wa.me/${contactDigits}?text=${encodeURIComponent(
          `Hi ${booking.name}! Your booking request for ${
            cabin?.name ?? booking.cabinSlug
          } (${booking.checkIn} → ${booking.checkOut}) at Netsurf Nature Park has been ${booking.status}.`
        )}`
      : null;

  return (
    <AdminPage className="max-w-[1400px]">
      <PageHeader
        eyebrow="Reservation Record"
        title={`Booking #${booking.id}`}
        description={`Submitted ${fullDateTime.format(new Date(booking.createdAt))}. Review the guest details, booking composition, and internal notes before confirming or changing status.`}
        actions={
          <Link to="/bookings" search={{ status: "all" }}>
            <Button variant="outline">Back to Bookings</Button>
          </Link>
        }
        meta={
          <>
            <StatusBadge status={booking.status} />
            <Badge variant="secondary">
              {booking.stayType === "overnight" ? "Overnight" : "Day Use"}
            </Badge>
          </>
        }
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Guests"
          value={String(booking.guests)}
          note="Party size on record"
        />
        <MetricCard
          label="Stay Length"
          value={booking.stayType === "overnight" ? `${nights}` : "Day"}
          note={booking.stayType === "overnight" ? "Booked nights" : "Same-day use"}
          tone="slate"
        />
        <MetricCard
          label="Estimated Total"
          value={formatGYD(booking.estimatedTotalGyd)}
          note="Current booking estimate"
          tone="green"
        />
        <MetricCard
          label="Add-Ons"
          value={String(chosenAddOns.length)}
          note={chosenAddOns.length > 0 ? "Extras selected" : "No extras selected"}
          tone="amber"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          <PageSection className="p-6 sm:p-7">
            <SectionTitle
              title="Booking Details"
              description="Operational details for the stay, cabin assignment, and selected extras."
            />
            <div className="grid gap-5 md:grid-cols-2">
              <DetailCard label="Cabin" value={cabin?.name ?? booking.cabinSlug} />
              <DetailCard label="Dates" value={`${booking.checkIn} → ${booking.checkOut}`} />
              <DetailCard label="Guests" value={String(booking.guests)} />
              <DetailCard
                label="Add-Ons"
                value={
                  chosenAddOns.length > 0
                    ? chosenAddOns.map((item) => item.name).join(", ")
                    : "None"
                }
              />
            </div>
          </PageSection>

          <PageSection className="p-6 sm:p-7">
            <SectionTitle
              title="Guest Details"
              description="Primary contact information and any guest-submitted note attached to the booking."
            />
            <div className="grid gap-5 md:grid-cols-2">
              <DetailCard label="Guest Name" value={booking.name} />
              <DetailCard label="Contact" value={booking.contact} />
            </div>

            {booking.notes ? (
              <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs font-bold tracking-[0.18em] uppercase text-muted-foreground">
                  Guest Note
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{booking.notes}</p>
              </div>
            ) : null}

            {whatsappLink ? (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-bold text-white transition-[opacity,transform] hover:-translate-y-0.5 hover:opacity-95"
              >
                <WhatsAppIcon />
                Message on WhatsApp
              </a>
            ) : null}
          </PageSection>

          <PageSection className="p-6 sm:p-7">
            <SectionTitle
              title="Admin Notes"
              description="Internal notes stay private to staff and can be updated without changing the booking status."
            />
            <div className="space-y-4">
              <label className="block">
                <span className="sr-only">Admin notes</span>
                <textarea
                  id="admin-notes"
                  name="admin_notes"
                  value={adminNotes}
                  onChange={(event) => setAdminNotes(event.target.value)}
                  placeholder="Internal notes, follow-up reminders, or booking context…"
                  rows={4}
                  className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveNotes}
                disabled={saving || adminNotes === booking.adminNotes}
              >
                Save Notes
              </Button>
            </div>
          </PageSection>
        </div>

        <PageSection className="p-6 sm:p-7">
          <SectionTitle
            title="Status Actions"
            description="Confirm, decline, or cancel the booking depending on current state."
          />

          <div className="space-y-3">
            {booking.status !== "confirmed" ? (
              <Button
                type="button"
                className="w-full"
                onClick={() => handleStatus("confirmed")}
                disabled={saving}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Confirm Booking
              </Button>
            ) : null}

            {booking.status === "confirmed" ? (
              <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/8 px-4 py-3">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-sm font-semibold text-primary">Booking confirmed</span>
              </div>
            ) : null}

            {booking.status !== "declined" ? (
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                onClick={() => handleStatus("declined")}
                disabled={saving}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
                Mark Declined
              </Button>
            ) : null}

            {booking.status !== "cancelled" ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => handleStatus("cancelled")}
                disabled={saving}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9 12h6" />
                </svg>
                Cancel Booking
              </Button>
            ) : null}
          </div>

          {saving ? (
            <p className="mt-3 text-center text-xs text-muted-foreground">Saving…</p>
          ) : null}
        </PageSection>
      </div>
    </AdminPage>
  );
}

function DetailCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium leading-6 text-foreground">{value}</p>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.132.558 4.13 1.532 5.864L0 24l6.29-1.51A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.369l-.36-.214-3.733.897.939-3.63-.234-.373A9.818 9.818 0 1112 21.818z" />
    </svg>
  );
}
