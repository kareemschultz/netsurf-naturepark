import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, eq, gt, gte, isNull, lt, lte, or } from "drizzle-orm";
import { db } from "../db.js";
import { bookings, blockedDates } from "@workspace/db";
import { addOns, cabins } from "@workspace/shared";
import { generateActionToken } from "../tokens.js";
import { sendBookingNotification } from "../notify.js";

export const bookingsRoute = new Hono();

const createSchema = z.object({
  cabinSlug: z.string().min(1),
  stayType: z.enum(["overnight", "day_use"]).default("overnight"),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
  guests: z.number().int().min(1).max(20),
  addOnSlugs: z.array(z.string()).default([]),
  name: z.string().min(2).max(200),
  contact: z.string().min(4).max(200),
  notes: z.string().max(1000).default(""),
});

// POST /bookings — create a new booking request
bookingsRoute.post("/", zValidator("json", createSchema), async (c) => {
  const data = c.req.valid("json");

  // Validate cabin
  const cabin = cabins.find((cab) => cab.slug === data.cabinSlug);
  if (!cabin) return c.json({ error: "Unknown cabin slug" }, 400);

  // Validate date order
  if (data.stayType === "day_use" && data.checkIn !== data.checkOut) {
    return c.json({ error: "Day-use bookings must use the same date for check-in and check-out" }, 400);
  }

  if (data.stayType === "overnight" && data.checkIn >= data.checkOut) {
    return c.json({ error: "checkOut must be after checkIn" }, 400);
  }

  // Overnight and day-use bookings are tracked independently.
  // A cabin can host daytime use and an overnight stay on the same date.
  const conflicts = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.cabinSlug, data.cabinSlug),
        or(eq(bookings.status, "pending"), eq(bookings.status, "confirmed")),
        eq(bookings.stayType, data.stayType),
        data.stayType === "day_use"
          ? eq(bookings.checkIn, data.checkIn)
          : and(
              lt(bookings.checkIn, data.checkOut),
              gt(bookings.checkOut, data.checkIn)
            )
      )
    );

  if (conflicts.length > 0) {
    return c.json({ error: "Those dates are unavailable for this cabin", available: false }, 409);
  }

  // Check blocked dates
  const blocked = await db
    .select({ id: blockedDates.id })
    .from(blockedDates)
    .where(
      and(
        or(eq(blockedDates.cabinSlug, data.cabinSlug), isNull(blockedDates.cabinSlug)),
        data.stayType === "day_use"
          ? and(
              lte(blockedDates.startDate, data.checkIn),
              gte(blockedDates.endDate, data.checkIn)
            )
          : and(
              lte(blockedDates.startDate, data.checkOut),
              gte(blockedDates.endDate, data.checkIn)
            )
      )
    );

  if (blocked.length > 0) {
    return c.json({ error: "Those dates are blocked", available: false }, 409);
  }

  // Calculate estimated total
  const nights = Math.round(
    (new Date(data.checkOut).getTime() - new Date(data.checkIn).getTime()) / 86_400_000
  );
  const billableNights = data.stayType === "day_use" ? 1 : Math.max(nights, 1);
  const chosenAddOns = addOns.filter((a) => data.addOnSlugs.includes(a.slug));
  const addOnTotal = chosenAddOns.reduce((s, a) => s + a.priceGYD, 0);
  const estimatedTotal = cabin.priceGYD * billableNights + addOnTotal;

  // Insert booking
  const [booking] = await db
    .insert(bookings)
    .values({
      cabinSlug: data.cabinSlug,
      stayType: data.stayType,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      guests: data.guests,
      addOnSlugs: data.addOnSlugs,
      name: data.name,
      contact: data.contact,
      notes: data.notes,
      status: "pending",
      estimatedTotalGyd: estimatedTotal,
    })
    .returning();

  // Generate and store action token
  const actionToken = await generateActionToken(booking.id);
  await db
    .update(bookings)
    .set({ actionToken })
    .where(eq(bookings.id, booking.id));

  // Send ntfy notification (non-blocking)
  sendBookingNotification({
    id: booking.id,
    cabinName: cabin.name,
    stayType: data.stayType,
    checkIn: data.checkIn,
    checkOut: data.checkOut,
    nights,
    guests: data.guests,
    addOns: chosenAddOns.map((a) => a.name),
    name: data.name,
    contact: data.contact,
    notes: data.notes,
    totalGyd: estimatedTotal,
    actionToken,
  }).catch((err) => console.error("[notify]", err));

  return c.json({ id: booking.id, status: "pending" }, 201);
});

// GET /bookings/availability/:slug?checkIn=&checkOut=
bookingsRoute.get("/availability/:slug", async (c) => {
  const slug = c.req.param("slug");
  const stayType = c.req.query("stayType") === "day_use" ? "day_use" : "overnight";
  const checkIn = c.req.query("checkIn");
  const checkOut = c.req.query("checkOut");

  if (!checkIn || !checkOut) {
    return c.json({ error: "checkIn and checkOut query params required" }, 400);
  }

  const [bookingConflict, blockedConflict] = await Promise.all([
    db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.cabinSlug, slug),
          or(eq(bookings.status, "pending"), eq(bookings.status, "confirmed")),
          eq(bookings.stayType, stayType),
          stayType === "day_use"
            ? eq(bookings.checkIn, checkIn)
            : and(lt(bookings.checkIn, checkOut), gt(bookings.checkOut, checkIn))
        )
      ),
    db
      .select({ id: blockedDates.id })
      .from(blockedDates)
      .where(
        and(
          or(eq(blockedDates.cabinSlug, slug), isNull(blockedDates.cabinSlug)),
          stayType === "day_use"
            ? and(
                lte(blockedDates.startDate, checkIn),
                gte(blockedDates.endDate, checkIn)
              )
            : and(
                lte(blockedDates.startDate, checkOut),
                gte(blockedDates.endDate, checkIn)
              )
        )
      ),
  ]);

  return c.json({ available: bookingConflict.length === 0 && blockedConflict.length === 0 });
});
