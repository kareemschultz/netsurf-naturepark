import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { bookings } from "@workspace/db";
import { verifyActionToken } from "../tokens.js";
import { sendStatusNotification } from "../notify.js";
import { cabins } from "@workspace/shared";

export const actionRoute = new Hono();

// GET /bookings/:id/action?action=confirm|decline&token=XXX
// Called from ntfy action buttons — returns an HTML response so it works in any browser.
actionRoute.get("/:id/action", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const action = c.req.query("action");
  const token = c.req.query("token");

  if (isNaN(id) || !token || (action !== "confirm" && action !== "decline")) {
    return c.html(errorPage("Invalid request parameters."), 400);
  }

  const valid = await verifyActionToken(id, token);
  if (!valid) {
    return c.html(errorPage("Invalid or expired confirmation link."), 403);
  }

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, id));

  if (!booking) {
    return c.html(errorPage("Booking not found."), 404);
  }

  if (booking.status === "confirmed" || booking.status === "declined") {
    const label = booking.status === "confirmed" ? "confirmed" : "declined";
    return c.html(alreadyDonePage(id, label));
  }

  const newStatus = action === "confirm" ? "confirmed" : "declined";
  await db
    .update(bookings)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(bookings.id, id));

  const cabin = cabins.find((cab) => cab.slug === booking.cabinSlug);
  const cabinName = cabin?.name ?? booking.cabinSlug;

  sendStatusNotification(id, cabinName, booking.name, newStatus).catch(console.error);

  const adminUrl = `${process.env.ADMIN_BASE_URL || "https://admin.netsurfnaturepark.com"}/bookings/${id}`;

  return c.html(successPage(id, newStatus, booking.name, cabinName, adminUrl));
});

// ─── HTML helpers ─────────────────────────────────────────────────────────────

function htmlShell(title: string, content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Netsurf Nature Park</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #FAF6F0; color: #2C2C2C;
           display: flex; align-items: center; justify-content: center;
           min-height: 100vh; padding: 1.5rem; }
    .card { background: white; border-radius: 1rem; padding: 2.5rem; max-width: 440px;
            width: 100%; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,.08); }
    .icon { font-size: 3rem; margin-bottom: 1rem; }
    h1 { font-size: 1.4rem; font-weight: 800; margin-bottom: .5rem; }
    p { font-size: .9rem; color: #666; line-height: 1.6; margin-bottom: .75rem; }
    a { display: inline-block; margin-top: 1.25rem; padding: .65rem 1.5rem;
        border-radius: 999px; font-weight: 700; font-size: .875rem;
        text-decoration: none; background: #2D5016; color: white; }
  </style>
</head>
<body><div class="card">${content}</div></body>
</html>`;
}

function successPage(id: number, status: "confirmed" | "declined", guestName: string, cabinName: string, adminUrl: string) {
  const isConfirm = status === "confirmed";
  return htmlShell(
    isConfirm ? "Booking Confirmed" : "Booking Declined",
    `<div class="icon">${isConfirm ? "✅" : "❌"}</div>
     <h1>Booking #${id} ${isConfirm ? "Confirmed" : "Declined"}</h1>
     <p>${cabinName} — <strong>${guestName}</strong></p>
     <p>${isConfirm
       ? "The booking has been confirmed. Contact the guest to arrange payment."
       : "The booking has been declined."}</p>
     <a href="${adminUrl}">View in Admin Panel</a>`
  );
}

function alreadyDonePage(id: number, status: string) {
  return htmlShell(
    "Already actioned",
    `<div class="icon">ℹ️</div>
     <h1>Already ${status}</h1>
     <p>Booking #${id} has already been ${status}. No changes made.</p>`
  );
}

function errorPage(msg: string) {
  return htmlShell(
    "Error",
    `<div class="icon">⚠️</div>
     <h1>Something went wrong</h1>
     <p>${msg}</p>`
  );
}
