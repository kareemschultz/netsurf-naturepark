import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, desc, eq, gte, lte, or, sql } from "drizzle-orm";
import { db } from "../db.js";
import { bookings, blockedDates } from "@workspace/db";
import { adminMiddleware, authorizeAdminRequest } from "../auth.js";
import { cabins } from "@workspace/shared";
import { adminCategoriesRoute } from "./admin-categories.js";
import { adminProductsRoute } from "./admin-products.js";
import { adminPosRoute } from "./admin-pos.js";
import { adminCabinsRoute } from "./admin-cabins.js";
import { adminInventoryRoute } from "./admin-inventory.js";
import { adminStockTransfersRoute } from "./admin-stock-transfers.js";
import { adminSalesRoute } from "./admin-sales.js";

export const adminRoute = new Hono();

// All routes below require admin auth
adminRoute.use("/*", adminMiddleware());

adminRoute.route("/categories", adminCategoriesRoute);
adminRoute.route("/products", adminProductsRoute);
adminRoute.route("/pos", adminPosRoute);
adminRoute.route("/cabins", adminCabinsRoute);
adminRoute.route("/inventory", adminInventoryRoute);
adminRoute.route("/stock-transfers", adminStockTransfersRoute);
adminRoute.route("/sales", adminSalesRoute);

// ─── Stats ────────────────────────────────────────────────────────────────────

adminRoute.get("/stats", async (c) => {
  const denied = authorizeAdminRequest(c, { dashboard: ["view"] });
  if (denied) return denied;

  const rows = await db
    .select({
      status: bookings.status,
      count: sql<number>`count(*)::int`,
      total: sql<number>`coalesce(sum(estimated_total_gyd), 0)::int`,
    })
    .from(bookings)
    .groupBy(bookings.status);

  const stats = { pending: 0, confirmed: 0, declined: 0, cancelled: 0, total: 0, revenueGyd: 0 };
  for (const row of rows) {
    const s = row.status as keyof typeof stats;
    if (s in stats) (stats as Record<string, number>)[s] = row.count;
    stats.total += row.count;
    if (row.status === "confirmed") stats.revenueGyd = row.total;
  }

  return c.json(stats);
});

// ─── Bookings list ────────────────────────────────────────────────────────────

adminRoute.get("/bookings", async (c) => {
  const denied = authorizeAdminRequest(c, { bookings: ["view"] });
  if (denied) return denied;

  const status = c.req.query("status"); // pending | confirmed | declined | cancelled | all
  const cabin = c.req.query("cabin");
  const page = Math.max(1, parseInt(c.req.query("page") || "1", 10));
  const limit = Math.min(100, parseInt(c.req.query("limit") || "25", 10));
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status && status !== "all") conditions.push(eq(bookings.status, status));
  if (cabin) conditions.push(eq(bookings.cabinSlug, cabin));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(bookings)
      .where(where)
      .orderBy(desc(bookings.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookings)
      .where(where),
  ]);

  return c.json({
    data: rows,
    total: countResult[0]?.count ?? 0,
    page,
    limit,
  });
});

// ─── Single booking ───────────────────────────────────────────────────────────

adminRoute.get("/bookings/:id", async (c) => {
  const denied = authorizeAdminRequest(c, { bookings: ["view"] });
  if (denied) return denied;

  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
  if (!booking) return c.json({ error: "Not found" }, 404);

  return c.json(booking);
});

// ─── Update booking ───────────────────────────────────────────────────────────

const updateSchema = z.object({
  status: z.enum(["pending", "confirmed", "declined", "cancelled"]).optional(),
  adminNotes: z.string().max(2000).optional(),
});

adminRoute.patch("/bookings/:id", zValidator("json", updateSchema), async (c) => {
  const denied = authorizeAdminRequest(c, { bookings: ["manage"] });
  if (denied) return denied;

  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

  const updates = c.req.valid("json");
  if (Object.keys(updates).length === 0) return c.json({ error: "Nothing to update" }, 400);

  const [updated] = await db
    .update(bookings)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(bookings.id, id))
    .returning();

  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

// ─── Blocked dates ────────────────────────────────────────────────────────────

adminRoute.get("/blocked-dates", async (c) => {
  const denied = authorizeAdminRequest(c, { blockedDates: ["view"] });
  if (denied) return denied;

  const rows = await db
    .select()
    .from(blockedDates)
    .orderBy(blockedDates.startDate);

  return c.json(rows);
});

const blockSchema = z.object({
  cabinSlug: z.string().nullable().default(null),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().max(500).default(""),
});

adminRoute.post("/blocked-dates", zValidator("json", blockSchema), async (c) => {
  const denied = authorizeAdminRequest(c, { blockedDates: ["manage"] });
  if (denied) return denied;

  const data = c.req.valid("json");
  if (data.startDate > data.endDate) {
    return c.json({ error: "endDate must be >= startDate" }, 400);
  }

  const [row] = await db.insert(blockedDates).values(data).returning();
  return c.json(row, 201);
});

adminRoute.delete("/blocked-dates/:id", async (c) => {
  const denied = authorizeAdminRequest(c, { blockedDates: ["manage"] });
  if (denied) return denied;

  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

  const [deleted] = await db
    .delete(blockedDates)
    .where(eq(blockedDates.id, id))
    .returning();

  if (!deleted) return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true });
});

// ─── Calendar availability (used by admin calendar view) ──────────────────────

adminRoute.get("/calendar", async (c) => {
  const denied = authorizeAdminRequest(c, { calendar: ["view"] });
  if (denied) return denied;

  const year = parseInt(c.req.query("year") || String(new Date().getFullYear()), 10);
  const month = parseInt(c.req.query("month") || String(new Date().getMonth() + 1), 10);

  const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0);
  const lastDayStr = `${year}-${String(month).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;

  const [monthBookings, monthBlocked] = await Promise.all([
    db
      .select()
      .from(bookings)
      .where(
        and(
          or(eq(bookings.status, "pending"), eq(bookings.status, "confirmed")),
          lte(bookings.checkIn, lastDayStr),
          gte(bookings.checkOut, firstDay)
        )
      ),
    db
      .select()
      .from(blockedDates)
      .where(
        and(
          lte(blockedDates.startDate, lastDayStr),
          gte(blockedDates.endDate, firstDay)
        )
      ),
  ]);

  return c.json({
    year,
    month,
    bookings: monthBookings,
    blocked: monthBlocked,
    cabins: cabins.map((cab) => ({ slug: cab.slug, name: cab.name })),
  });
});
