import {
  pgTable,
  serial,
  varchar,
  integer,
  date,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const bookings = pgTable("netsurf_bookings", {
  id: serial("id").primaryKey(),
  cabinSlug: varchar("cabin_slug", { length: 100 }).notNull(),
  checkIn: date("check_in", { mode: "string" }).notNull(),
  checkOut: date("check_out", { mode: "string" }).notNull(),
  guests: integer("guests").notNull().default(1),
  addOnSlugs: text("add_on_slugs").array().notNull().default([]),
  name: varchar("name", { length: 200 }).notNull(),
  contact: varchar("contact", { length: 200 }).notNull(),
  notes: text("notes").notNull().default(""),
  // status: pending | confirmed | declined | cancelled
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  actionToken: varchar("action_token", { length: 128 }),
  estimatedTotalGyd: integer("estimated_total_gyd").notNull().default(0),
  adminNotes: text("admin_notes").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const blockedDates = pgTable("netsurf_blocked_dates", {
  id: serial("id").primaryKey(),
  // null = all cabins
  cabinSlug: varchar("cabin_slug", { length: 100 }),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }).notNull(),
  reason: text("reason").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type BlockedDate = typeof blockedDates.$inferSelect;
export type NewBlockedDate = typeof blockedDates.$inferInsert;
