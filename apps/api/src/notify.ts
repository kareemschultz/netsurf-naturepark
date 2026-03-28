// ntfy.sh push notification for new bookings.
// Stephen installs the ntfy app on his phone and subscribes to the topic.
// Notifications include action buttons to confirm/decline directly.

interface BookingNotification {
  id: number;
  cabinName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  addOns: string[];
  name: string;
  contact: string;
  notes: string;
  totalGyd: number;
  actionToken: string;
}

export async function sendBookingNotification(b: BookingNotification): Promise<void> {
  const ntfyUrl = process.env.NTFY_URL;
  if (!ntfyUrl) {
    console.log("[notify] NTFY_URL not set — skipping notification");
    return;
  }

  const apiBase = process.env.API_BASE_URL || "https://api.netsurfnaturepark.com";
  const adminBase = process.env.ADMIN_BASE_URL || "https://admin.netsurfnaturepark.com";

  const confirmUrl = `${apiBase}/bookings/${b.id}/action?action=confirm&token=${b.actionToken}`;
  const declineUrl = `${apiBase}/bookings/${b.id}/action?action=decline&token=${b.actionToken}`;
  const detailUrl = `${adminBase}/bookings/${b.id}`;

  const addOnsLine = b.addOns.length > 0 ? `\nAdd-ons: ${b.addOns.join(", ")}` : "";
  const notesLine = b.notes.trim() ? `\nNotes: ${b.notes}` : "";

  const message = [
    `${b.cabinName}`,
    `${b.checkIn} → ${b.checkOut} (${b.nights} night${b.nights !== 1 ? "s" : ""})`,
    `Guests: ${b.guests}${addOnsLine}`,
    `From: ${b.name} | ${b.contact}${notesLine}`,
    `Total: GYD $${b.totalGyd.toLocaleString()}`,
  ].join("\n");

  await fetch(ntfyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic: process.env.NTFY_TOPIC || "netsurf-bookings",
      title: `New Booking #${b.id} — ${b.cabinName}`,
      message,
      priority: 4,
      click: detailUrl,
      actions: [
        { action: "http", label: "✅ Confirm", url: confirmUrl, method: "GET", clear: true },
        { action: "http", label: "❌ Decline", url: declineUrl, method: "GET", clear: true },
        { action: "view",  label: "View in Admin", url: detailUrl, clear: false },
      ],
    }),
  });
}

export async function sendStatusNotification(
  bookingId: number,
  cabinName: string,
  guestName: string,
  status: "confirmed" | "declined"
): Promise<void> {
  const ntfyUrl = process.env.NTFY_URL;
  if (!ntfyUrl) return;

  const emoji = status === "confirmed" ? "✅" : "❌";
  const label = status === "confirmed" ? "Confirmed" : "Declined";

  await fetch(ntfyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic: process.env.NTFY_TOPIC || "netsurf-bookings",
      title: `${emoji} Booking #${bookingId} ${label}`,
      message: `${cabinName} — ${guestName}`,
      priority: 3,
    }),
  });
}
