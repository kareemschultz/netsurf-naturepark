# Netsurf Nature Park -- POS + Inventory System

## Context

Netsurf Nature Park is an eco-lodge on the Soesdyke-Linden Highway, Guyana. The booking platform is live at `www.netsurfnaturepark.com` (unified container `kt-netsurf`). The owner wants a POS system so staff can ring up sales at the park (food, drinks, merchandise, activities) and track inventory. This builds on the existing admin panel at `/admin/`.

**Root path:** `/home/karetech/projects/netsurf-naturepark/app/netsurf-naturepark/`

---

## Existing Stack (what we're building on)

| Layer | Details |
|-------|---------|
| Monorepo | Turborepo 2, Bun 1.3 |
| Apps | `apps/web` (public), `apps/admin` (admin SPA), `apps/api` (Hono on Bun) |
| Packages | `@workspace/db` (Drizzle + PostgreSQL), `@workspace/shared` (static data, formatGYD), `@workspace/ui` (shadcn/Base UI) |
| Routing | TanStack Router (file-based), base path `/admin` |
| Auth | JWT in localStorage, admin middleware on `/admin/*` API routes |
| UI | Hand-built Tailwind (park-green #2D5016, park-amber #C4941A, park-cream #FAF6F0) |
| Docker | Single container (nginx + Bun), API at `/api/`, admin SPA at `/admin/` |
| DB | PostgreSQL (`kt-central-db`), 2 existing tables: `netsurf_bookings`, `netsurf_blocked_dates` |

**Key patterns:**
- API: `new Hono()` per route file, Zod validators, `c.json()` responses
- Admin pages: `createFileRoute()`, `useState` + `useEffect` for data, no TanStack Query
- Cards: `bg-white rounded-2xl border border-border p-6`
- Buttons: `rounded-full` pill, `style={{ backgroundColor: "#2D5016" }}`
- Currency: `formatGYD()` from `@workspace/shared`
- shadcn installed but unused in admin pages: Button, Card, Badge, Tabs, Sheet, Separator

---

## Phase 1: Products + Categories (Foundation)

### Database -- 5 new tables in `packages/db/src/schema.ts`

**`netsurf_product_categories`**

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| name | varchar(100) | NOT NULL |
| slug | varchar(100) | NOT NULL, UNIQUE |
| description | text | default '' |
| sort_order | integer | default 0 |
| is_active | boolean | default true |
| created_at | timestamp | defaultNow() |

**`netsurf_products`**

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| category_id | integer FK | -> product_categories.id |
| name | varchar(200) | NOT NULL |
| slug | varchar(200) | NOT NULL, UNIQUE |
| description | text | default '' |
| price_gyd | integer | NOT NULL (whole GYD) |
| sku | varchar(50) | UNIQUE, nullable |
| track_stock | boolean | default false (services don't need tracking) |
| stock_qty | integer | default 0 (denormalized for fast POS reads) |
| low_stock_threshold | integer | default 5 |
| is_active | boolean | default true |
| created_at | timestamp | defaultNow() |
| updated_at | timestamp | defaultNow() |

**`netsurf_sales`**

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| sale_number | varchar(20) | UNIQUE, format: S-YYYYMMDD-NNN |
| subtotal_gyd | integer | NOT NULL |
| discount_gyd | integer | default 0 |
| tax_gyd | integer | default 0 (VAT may apply in future) |
| total_gyd | integer | NOT NULL (subtotal - discount + tax) |
| items_count | integer | NOT NULL |
| payment_method | varchar(30) | default 'cash' (cash/card/transfer) — null if split |
| notes | text | default '' |
| voided | boolean | default false |
| voided_at | timestamp | nullable |
| void_reason | text | default '' |
| created_at | timestamp | defaultNow() |

**`netsurf_sale_payments`** *(supports split payment in Phase 5)*

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| sale_id | integer FK | -> sales.id |
| method | varchar(30) | cash, card, transfer |
| amount_gyd | integer | NOT NULL |
| reference | varchar(200) | nullable (card auth code, transfer ID) |
| created_at | timestamp | defaultNow() |

**`netsurf_sale_items`**

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| sale_id | integer FK | -> sales.id |
| product_id | integer FK | -> products.id |
| product_name | varchar(200) | snapshot at time of sale |
| unit_price_gyd | integer | snapshot at time of sale |
| quantity | integer | default 1 |
| line_total_gyd | integer | NOT NULL |

**`netsurf_stock_movements`**

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| product_id | integer FK | -> products.id |
| type | varchar(20) | restock / sale / adjustment / void_reversal |
| quantity_change | integer | positive = in, negative = out |
| reference_id | integer | nullable (sale_id for sale/void movements) |
| notes | text | default '' |
| created_at | timestamp | defaultNow() |

### API endpoints (Phase 1)

Mount in `admin.ts` after existing middleware:

**Categories** (`/admin/categories` -> `admin-categories.ts`):
- `GET /` -- list all (optional `?active=true`)
- `POST /` -- create `{name, description?, sortOrder?}` (auto-slug)
- `PATCH /:id` -- update
- `DELETE /:id` -- delete (only if no products)

**Products** (`/admin/products` -> `admin-products.ts`):
- `GET /` -- paginated list `?categoryId=&active=&search=&page=&limit=`
- `GET /:id` -- single product
- `POST /` -- create `{name, categoryId, priceGyd, ...}`
- `PATCH /:id` -- update
- `DELETE /:id` -- soft-delete (isActive=false)

### Admin pages (Phase 1)

- `routes/products/index.tsx` -- product list table with category filter tabs, search, pagination
- `routes/products/new.tsx` -- create product form
- `routes/products/$id.tsx` -- edit product form
- Update `Sidebar.tsx` -- add POS section separator + 4 nav items (POS, Products, Inventory, Sales)

### Shared code (Phase 1)

- `packages/shared/src/data.ts`: add `paymentMethods` const + `PaymentMethod` type + `slugify()` helper
- `apps/admin/src/lib/api.ts`: add category + product types and API functions

### Files

| Action | File |
|--------|------|
| Modify | `packages/db/src/schema.ts` |
| Create | `packages/db/migrations/0001_pos_inventory.sql` |
| Modify | `packages/shared/src/data.ts` |
| Create | `apps/api/src/routes/admin-categories.ts` |
| Create | `apps/api/src/routes/admin-products.ts` |
| Modify | `apps/api/src/routes/admin.ts` |
| Modify | `apps/admin/src/lib/api.ts` |
| Modify | `apps/admin/src/components/Sidebar.tsx` |
| Create | `apps/admin/src/routes/products/index.tsx` |
| Create | `apps/admin/src/routes/products/new.tsx` |
| Create | `apps/admin/src/routes/products/$id.tsx` |

### Verify

- Create category "Food & Drinks" via `/admin/products`
- Create product "Bottled Water" (trackStock: true, stockQty: 50, priceGyd: 500)
- Create product "Day Pass" (trackStock: false, priceGyd: 5000)
- Edit price, verify update
- curl `/api/admin/products` without JWT -> 401

---

## Phase 2: POS Interface (Selling)

### API endpoints

**POS** (`/admin/pos` -> `admin-pos.ts`):
- `GET /products` -- all active products with category names (no pagination, for grid)
- `POST /sale` -- **transactional**: validate stock, decrement stock_qty, insert sale + items + movements, generate sale number
- `POST /sale/:id/void` -- void sale, re-add stock for tracked items

### Admin pages

- `routes/pos.tsx` -- full POS terminal:
  - **Left (65%)**: Category tabs (horizontal pills) + search + product grid (large touch cards, 3-4 columns)
  - **Right (35%)**: Cart panel (item list with +/- qty, running total, payment method toggle, "Complete Sale" button)
  - Out-of-stock items shown dimmed
  - On sale complete: flash sale number + receipt options, auto-clear cart

### Receipt (Phase 2 deliverable)

After a successful sale, show a modal with:
- Printable HTML receipt (browser print) — items, totals, payment method, timestamp, sale number
- **WhatsApp share button** — pre-filled message: `"Receipt for sale S-YYYYMMDD-NNN — Total: GYD X,XXX. Thank you!"` (reuses existing WhatsApp link pattern from booking system)

No receipt printer required for MVP — browser print covers paper receipts.

### Cart state

`useReducer` with actions: ADD_ITEM, REMOVE_ITEM, UPDATE_QTY, CLEAR_CART, APPLY_DISCOUNT. No external state library.

### Key implementation detail

`POST /sale` must run inside `db.transaction(async (tx) => {...})` to atomically check stock, decrement, and insert records. Race conditions with concurrent sales are prevented by the transaction.

### Files

| Action | File |
|--------|------|
| Create | `apps/api/src/routes/admin-pos.ts` |
| Modify | `apps/api/src/routes/admin.ts` (mount) |
| Modify | `apps/admin/src/lib/api.ts` (POS functions) |
| Create | `apps/admin/src/routes/pos.tsx` |

### Verify

- Add Day Pass x2 + Bottled Water x3 to cart -> total GYD $11,500
- Complete sale -> sale number appears, cart clears
- Bottled Water stock: 50 -> 47
- Void the sale -> stock returns to 50
- Try selling 51 Bottled Waters -> error: insufficient stock

---

## Phase 3: Inventory/Stock Management

### API endpoints

**Inventory** (`/admin/inventory` -> `admin-inventory.ts`):
- `GET /` -- tracked products with stock info `?lowStock=true&categoryId=`
- `GET /alerts` -- products where stock_qty <= low_stock_threshold
- `POST /restock` -- `{productId, quantity, notes?}` (creates restock movement)
- `POST /adjust` -- `{productId, newQty, notes}` (creates adjustment movement)
- `GET /movements` -- paginated stock movement history `?productId=&type=&page=&limit=`

### Admin pages

- `routes/inventory.tsx`:
  - Low-stock alert banner (amber) if any items below threshold
  - 3 stat cards: Total SKUs, Low Stock (amber), Out of Stock (red)
  - Table: Name, SKU, Category, Current Stock, Threshold, Status badge
  - Restock button per row (inline form: quantity + notes)
  - Adjust button for manual corrections
  - Stock movement history (expandable or sheet)

### Files

| Action | File |
|--------|------|
| Create | `apps/api/src/routes/admin-inventory.ts` |
| Modify | `apps/api/src/routes/admin.ts` (mount) |
| Modify | `apps/admin/src/lib/api.ts` (inventory functions) |
| Create | `apps/admin/src/routes/inventory.tsx` |

### Verify

- Only trackStock=true products appear
- Sell items via POS -> stock decreases
- Restock +100 -> stock increases, movement logged
- Adjust to 5 -> movement logged
- Set threshold=10 -> "Low Stock" badge appears

---

## Phase 4: Sales History + Reports + Audit

### API endpoints

**Sales** (`/admin/sales` -> `admin-sales.ts`):
- `GET /` -- paginated sales list `?date=&from=&to=&page=&limit=&voided=`
- `GET /:id` -- sale detail with line items + payments
- `GET /summary` -- daily summary `?date=YYYY-MM-DD` (default today): totalSales, totalRevenue, itemsSold, byCategory[], byPaymentMethod[], topProducts[]
- `GET /summary/range` -- date range summary `?from=&to=`

### Admin pages

- `routes/sales/index.tsx`:
  - Date filter (today default, From/To range)
  - Daily summary card: total sales, revenue (GYD), items sold, category breakdown, payment method breakdown, top 5 products
  - Sales table: Sale #, Time, Items, Total (GYD), Payment Method, Status
  - Voided sales in red-tinted row
- `routes/sales/$id.tsx`:
  - Line items table, totals, discount/tax breakdown
  - Payment method(s) shown
  - Void button with confirmation + reason field

### Audit log table (new in Phase 4)

**`netsurf_pos_audit_log`**

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| action | varchar(50) | e.g. SALE_VOID, STOCK_ADJUST, PRODUCT_PRICE_CHANGE |
| entity_type | varchar(50) | sale, product, stock_movement |
| entity_id | integer | |
| performed_by | varchar(200) | JWT subject (admin email) |
| metadata | jsonb | before/after values for price changes, void reasons |
| created_at | timestamp | defaultNow() |

Log entries created server-side for: sale void, manual stock adjustment, product price change, product deactivation.

### Files

| Action | File |
|--------|------|
| Create | `apps/api/src/routes/admin-sales.ts` |
| Modify | `apps/api/src/routes/admin.ts` (mount) |
| Modify | `apps/admin/src/lib/api.ts` (sales functions) |
| Create | `apps/admin/src/routes/sales/index.tsx` |
| Create | `apps/admin/src/routes/sales/$id.tsx` |
| Modify | `packages/db/src/schema.ts` (audit log table) |

### Verify

- Ring up several sales across categories and payment methods
- `/admin/sales` shows all sales, date filter works
- Daily summary: correct totals, category breakdown, top products
- Sale detail shows line items + discount/tax breakdown
- Void from detail page -> shows as voided in list, audit log entry created
- Price change on product -> audit log entry with before/after values

---

## Phase 5: Offline Mode + Enhancements (Future)

> Not required for initial launch. Add once Phases 1–4 are stable in production.

### Offline Mode

For eco-lodge use with unreliable internet:
- Store completed sales in IndexedDB (Dexie.js) when API is unreachable
- Queue offline sales for sync when connection restores
- Visual indicator: online/offline badge + pending sync count in POS header
- Sync strategy: retry with exponential backoff, last-write-wins conflict resolution
- New package required: `dexie` (add to `apps/admin/`)

### Split Payment

- `netsurf_sale_payments` table already exists (added in Phase 1 schema)
- UI: "Add payment" in cart — add partial cash + partial card amounts
- API: `POST /sale` accepts `payments[]` array instead of single `payment_method`
- Validation: sum of payments must equal total

### Other Enhancements
- Barcode scanning (device camera via BarcodeDetector API or USB HID scanner)
- Discounts & promotions (percentage or fixed GYD off, manager-only)
- Product variants (size, flavour) — requires schema extension
- Dark mode for low-light environments

---

## Totals (Phases 1–4)

- **7 modified files**, **12 new files**
- **6 new DB tables** (added `netsurf_sale_payments` + `netsurf_pos_audit_log`), **~30 API endpoints**, **7 new admin pages**
- **No new npm packages**, **no Docker/nginx changes**
- All behind existing JWT auth

## Suggested seed categories

1. Day Passes & Admissions
2. Food & Drinks
3. Activities & Rentals
4. Merchandise
5. Meal Packages
