import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const bookings = pgTable("netsurf_bookings", {
  id: serial("id").primaryKey(),
  cabinSlug: varchar("cabin_slug", { length: 100 }).notNull(),
  checkIn: date("check_in", { mode: "string" }).notNull(),
  checkOut: date("check_out", { mode: "string" }).notNull(),
  stayType: varchar("stay_type", { length: 20 }).notNull().default("overnight"),
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

export const productCategories = pgTable("netsurf_product_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const products = pgTable("netsurf_products", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => productCategories.id, { onDelete: "restrict" }),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: text("description").notNull().default(""),
  priceGyd: integer("price_gyd").notNull(),
  sku: varchar("sku", { length: 50 }).unique(),
  trackStock: boolean("track_stock").notNull().default(false),
  stockQty: integer("stock_qty").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sales = pgTable("netsurf_sales", {
  id: serial("id").primaryKey(),
  saleNumber: varchar("sale_number", { length: 20 }).notNull().unique(),
  subtotalGyd: integer("subtotal_gyd").notNull(),
  discountGyd: integer("discount_gyd").notNull().default(0),
  taxGyd: integer("tax_gyd").notNull().default(0),
  totalGyd: integer("total_gyd").notNull(),
  itemsCount: integer("items_count").notNull(),
  paymentMethod: varchar("payment_method", { length: 30 }).default("cash"),
  notes: text("notes").notNull().default(""),
  voided: boolean("voided").notNull().default(false),
  voidedAt: timestamp("voided_at"),
  voidReason: text("void_reason").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const salePayments = pgTable("netsurf_sale_payments", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id")
    .notNull()
    .references(() => sales.id, { onDelete: "cascade" }),
  method: varchar("method", { length: 30 }).notNull(),
  amountGyd: integer("amount_gyd").notNull(),
  reference: varchar("reference", { length: 200 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const saleItems = pgTable("netsurf_sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id")
    .notNull()
    .references(() => sales.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  productName: varchar("product_name", { length: 200 }).notNull(),
  unitPriceGyd: integer("unit_price_gyd").notNull(),
  quantity: integer("quantity").notNull().default(1),
  lineTotalGyd: integer("line_total_gyd").notNull(),
});

export const stockMovements = pgTable("netsurf_stock_movements", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  type: varchar("type", { length: 20 }).notNull(),
  quantityChange: integer("quantity_change").notNull(),
  referenceId: integer("reference_id"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const stockTransfers = pgTable("netsurf_stock_transfers", {
  id: serial("id").primaryKey(),
  transferNumber: varchar("transfer_number", { length: 20 }).notNull().unique(),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  dispatchedBy: varchar("dispatched_by", { length: 200 }).notNull(),
  dispatchedAt: timestamp("dispatched_at"),
  notes: text("notes").notNull().default(""),
  receivedBy: varchar("received_by", { length: 200 }),
  receivedAt: timestamp("received_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const stockTransferItems = pgTable("netsurf_stock_transfer_items", {
  id: serial("id").primaryKey(),
  transferId: integer("transfer_id")
    .notNull()
    .references(() => stockTransfers.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  productNameSnapshot: varchar("product_name_snapshot", { length: 200 }).notNull(),
  qtyDispatched: integer("qty_dispatched").notNull(),
  qtyReceived: integer("qty_received"),
  discrepancyNotes: text("discrepancy_notes").notNull().default(""),
});

export const posAuditLog = pgTable("netsurf_pos_audit_log", {
  id: serial("id").primaryKey(),
  action: varchar("action", { length: 50 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: integer("entity_id").notNull(),
  performedBy: varchar("performed_by", { length: 200 }).notNull(),
  metadata: jsonb("metadata")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type BlockedDate = typeof blockedDates.$inferSelect;
export type NewBlockedDate = typeof blockedDates.$inferInsert;
export type ProductCategory = typeof productCategories.$inferSelect;
export type NewProductCategory = typeof productCategories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;
export type SalePayment = typeof salePayments.$inferSelect;
export type NewSalePayment = typeof salePayments.$inferInsert;
export type SaleItem = typeof saleItems.$inferSelect;
export type NewSaleItem = typeof saleItems.$inferInsert;
export type StockMovement = typeof stockMovements.$inferSelect;
export type NewStockMovement = typeof stockMovements.$inferInsert;
export type StockTransfer = typeof stockTransfers.$inferSelect;
export type NewStockTransfer = typeof stockTransfers.$inferInsert;
export type StockTransferItem = typeof stockTransferItems.$inferSelect;
export type NewStockTransferItem = typeof stockTransferItems.$inferInsert;
export type PosAuditLog = typeof posAuditLog.$inferSelect;
export type NewPosAuditLog = typeof posAuditLog.$inferInsert;
