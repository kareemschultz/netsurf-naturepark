import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
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

export const authUsers = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    username: varchar("username", { length: 60 }),
    displayUsername: varchar("display_username", { length: 120 }),
    role: varchar("role", { length: 120 }).notNull().default("front_desk"),
    banned: boolean("banned").notNull().default(false),
    banReason: text("ban_reason"),
    banExpires: timestamp("ban_expires"),
  },
  (table) => ({
    emailUnique: uniqueIndex("user_email_unique").on(table.email),
    usernameUnique: uniqueIndex("user_username_unique").on(table.username),
  })
);

export const authSessions = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => ({
    tokenUnique: uniqueIndex("session_token_unique").on(table.token),
    userIdIdx: index("session_user_id_idx").on(table.userId),
  })
);

export const authAccounts = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    providerAccountUnique: uniqueIndex("account_provider_account_unique").on(
      table.providerId,
      table.accountId
    ),
    userIdIdx: index("account_user_id_idx").on(table.userId),
  })
);

export const authVerifications = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    identifierIdx: index("verification_identifier_idx").on(table.identifier),
  })
);

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

export const galleryPhotos = pgTable("netsurf_gallery_photos", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  altText: text("alt_text").notNull().default(""),
  caption: text("caption").notNull().default(""),
  category: text("category").notNull().default("gallery"),
  uploaderName: text("uploader_name").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const promoItems = pgTable("netsurf_promo_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull().default(""),
  imageFilename: text("image_filename").notNull().default(""),
  ctaText: text("cta_text").notNull().default(""),
  ctaUrl: text("cta_url").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type BlockedDate = typeof blockedDates.$inferSelect;
export type NewBlockedDate = typeof blockedDates.$inferInsert;
export type AuthUser = typeof authUsers.$inferSelect;
export type NewAuthUser = typeof authUsers.$inferInsert;
export type AuthSession = typeof authSessions.$inferSelect;
export type NewAuthSession = typeof authSessions.$inferInsert;
export type AuthAccount = typeof authAccounts.$inferSelect;
export type NewAuthAccount = typeof authAccounts.$inferInsert;
export type AuthVerification = typeof authVerifications.$inferSelect;
export type NewAuthVerification = typeof authVerifications.$inferInsert;
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
export type GalleryPhoto = typeof galleryPhotos.$inferSelect;
export type NewGalleryPhoto = typeof galleryPhotos.$inferInsert;
export type PromoItem = typeof promoItems.$inferSelect;
export type NewPromoItem = typeof promoItems.$inferInsert;
