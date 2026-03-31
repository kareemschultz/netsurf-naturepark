import { Hono } from "hono"
import { and, asc, eq, gte, gt, isNull, lte, or } from "drizzle-orm"
import { db } from "../db.js"
import { blockedDates, bookings } from "@workspace/db"
import { cabins } from "@workspace/shared"

export const adminCabinsRoute = new Hono()

adminCabinsRoute.get("/availability", async (c) => {
  const requestedDate =
    c.req.query("date") ?? new Date().toISOString().slice(0, 10)

  const [activeBookings, activeBlockedDates, upcomingOvernightBookings] =
    await Promise.all([
      db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.status, "confirmed"),
            or(
              and(
                eq(bookings.stayType, "overnight"),
                lte(bookings.checkIn, requestedDate),
                gt(bookings.checkOut, requestedDate)
              ),
              and(
                eq(bookings.stayType, "day_use"),
                eq(bookings.checkIn, requestedDate)
              )
            )
          )
        ),
      db
        .select()
        .from(blockedDates)
        .where(
          and(
            lte(blockedDates.startDate, requestedDate),
            gte(blockedDates.endDate, requestedDate)
          )
        ),
      db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.status, "confirmed"),
            eq(bookings.stayType, "overnight"),
            gte(bookings.checkIn, requestedDate)
          )
        )
        .orderBy(asc(bookings.checkIn)),
    ])

  const cabinsWithAvailability = cabins.map((cabin) => {
    const blocked = activeBlockedDates.find(
      (entry) =>
        (entry.cabinSlug === cabin.slug || entry.cabinSlug === null) &&
        entry.startDate <= requestedDate &&
        entry.endDate >= requestedDate
    )

    const overnight = activeBookings.find(
      (booking) =>
        booking.cabinSlug === cabin.slug &&
        booking.stayType === "overnight" &&
        booking.checkIn <= requestedDate &&
        booking.checkOut > requestedDate
    )

    const dayUse = activeBookings.find(
      (booking) =>
        booking.cabinSlug === cabin.slug &&
        booking.stayType === "day_use" &&
        booking.checkIn === requestedDate
    )

    const upcomingCheckIns = upcomingOvernightBookings
      .filter((booking) => booking.cabinSlug === cabin.slug)
      .slice(0, 3)
      .map((booking) => ({
        id: booking.id,
        guestName: booking.name,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
      }))

    const status = blocked
      ? "blocked"
      : overnight && dayUse
        ? "both"
        : overnight
          ? "overnight"
          : dayUse
            ? "day_use"
            : "available"

    return {
      slug: cabin.slug,
      name: cabin.name,
      maxGuests: cabin.maxGuests,
      status,
      blocked: blocked
        ? {
            id: blocked.id,
            reason: blocked.reason,
            startDate: blocked.startDate,
            endDate: blocked.endDate,
          }
        : null,
      overnight: overnight
        ? {
            id: overnight.id,
            guestName: overnight.name,
            checkIn: overnight.checkIn,
            checkOut: overnight.checkOut,
          }
        : null,
      dayUse: dayUse
        ? {
            id: dayUse.id,
            guestName: dayUse.name,
            checkIn: dayUse.checkIn,
            checkOut: dayUse.checkOut,
          }
        : null,
      upcomingCheckIns,
    }
  })

  return c.json({
    date: requestedDate,
    cabins: cabinsWithAvailability,
  })
})
