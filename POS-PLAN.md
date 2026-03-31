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

### Schema migration — existing `netsurf_bookings` table

Add `stay_type` column to the **existing** `netsurf_bookings` table:

| Column | Type | Notes |
|--------|------|-------|
| stay_type | varchar(20) | `overnight` (default) / `day_use` |

**Why explicit rather than inferring from dates:** The current schema uses `date`-only fields (no time). Relying on `checkIn == checkOut` to mean "day use" is fragile — an overnight booking always has `checkOut > checkIn`, but a day-use guest may or may not follow that convention. An explicit column makes intent clear in every query.

**Migration file:** `packages/db/migrations/0001_add_stay_type.sql`
```sql
ALTER TABLE netsurf_bookings
  ADD COLUMN stay_type varchar(20) NOT NULL DEFAULT 'overnight';
```

**Booking wizard update** (web app, not POS): add a "Stay Type" selector as an early step — "I want to stay overnight" vs "Day visit only". Day-use bookings set `checkOut = checkIn` by convention. This is a web app task tracked separately from the POS build.

---

### Database -- 7 new POS tables in `packages/db/src/schema.ts`

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
| type | varchar(20) | restock / sale / adjustment / void_reversal / **transfer_in** |
| quantity_change | integer | positive = in, negative = out |
| reference_id | integer | nullable (sale_id, transfer_item_id) |
| notes | text | default '' |
| created_at | timestamp | defaultNow() |

**`netsurf_stock_transfers`** *(Georgetown → Park dispatch workflow)*

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| transfer_number | varchar(20) | UNIQUE, format: TXF-YYYYMMDD-NNN |
| status | varchar(20) | draft / dispatched / received / partial / cancelled |
| dispatched_by | varchar(200) | name of Georgetown staff member |
| dispatched_at | timestamp | nullable — set when marked dispatched |
| notes | text | default '' (packing notes, vehicle info, etc.) |
| received_by | varchar(200) | nullable — park staff who verified receipt |
| received_at | timestamp | nullable — set when park verifies |
| created_at | timestamp | defaultNow() |

**`netsurf_stock_transfer_items`**

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| transfer_id | integer FK | -> stock_transfers.id |
| product_id | integer FK | -> products.id |
| product_name_snapshot | varchar(200) | copied at dispatch time |
| qty_dispatched | integer | NOT NULL — what Georgetown packed |
| qty_received | integer | nullable — filled by park staff on verification |
| discrepancy_notes | text | default '' (e.g. "2 bottles broken") |

> **Stock only increases at the park when the park verifies receipt** — not at dispatch time.
> On verification: each item with `qty_received > 0` creates a `transfer_in` stock movement.
> If `qty_received != qty_dispatched` on any item → transfer status = `partial`.

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
- Update `Sidebar.tsx` -- add POS section separator + nav items: POS, Products, Inventory, Stock Transfers, Sales, Cabins

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

### Cabin Availability View (Phase 2 deliverable)

POS staff need to check cabin status before selling a Day Pass or advising a walk-in guest. Critically, a cabin can have **two types of bookings on the same day** — an overnight guest checking out in the morning and a day-use visitor arriving later.

**API endpoint** (reads `netsurf_bookings` + `netsurf_blocked_dates`, no new table):
- `GET /admin/cabins/availability?date=YYYY-MM-DD` — for a given date, returns each cabin with:
  - `overnight`: confirmed booking occupying that night (checkIn ≤ date < checkOut, stay_type=overnight)
  - `day_use`: confirmed day-use booking on that date (checkIn = checkOut = date, stay_type=day_use)
  - `blocked`: date falls within a blocked range for that cabin
  - `capacity`: maxGuests (from shared cabin data, not DB)
  - `status`: `available` | `overnight` | `day_use` | `both` | `blocked`

**Admin page** — `routes/cabins.tsx`:

*Top:* Date picker (defaults to today). "Tonight" / "Today" quick buttons.

*Cabin grid (4 cards — one per cabin):*
- Cabin name + capacity badge (`max X guests`)
- **Overnight status** row: green Available / red Occupied (shows guest name + check-out date) / grey Blocked
- **Day use status** row: green Available / amber Booked (shows guest name) / grey Blocked
- A cabin can show overnight=Occupied + day_use=Available simultaneously (overnight guest is present but day visitors can still come)
- Upcoming check-ins panel: next 3 overnight arrivals for that cabin
- Link to booking detail → `/admin/bookings/:id` (existing admin booking pages)

*Read-only* — no booking creation here. Booking stays on the public site.

Cabin `maxGuests` + names come from `packages/shared/src/data.ts` — no DB duplication.

### Files (Phase 2 additions)

| Action | File |
|--------|------|
| Create | `apps/api/src/routes/admin-pos.ts` |
| Create | `apps/api/src/routes/admin-cabins.ts` |
| Modify | `apps/api/src/routes/admin.ts` (mount pos + cabins routes) |
| Modify | `apps/admin/src/lib/api.ts` (POS + cabin functions) |
| Create | `apps/admin/src/routes/pos.tsx` |
| Create | `apps/admin/src/routes/cabins.tsx` |

### Verify

- Add Day Pass x2 + Bottled Water x3 to cart → total GYD $11,500
- Complete sale → sale number appears, cart clears, stock updates
- Void sale → stock returns, audit log entry created
- `/admin/cabins` shows all 4 cabins with correct capacity badges
- Cabin with confirmed overnight booking → overnight row = Occupied, day_use row = Available
- Cabin with day-use booking on same date → day_use row = Booked
- Cabin with both types on same date → status = `both`, both rows show bookings
- Blocked date → both rows greyed out regardless of bookings
- Date picker → future date with no bookings → all rows = Available

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

### Stock Transfer Workflow (Georgetown → Park)

**API endpoints** (`/admin/stock-transfers` -> `admin-stock-transfers.ts`):
- `GET /` -- list transfers `?status=&page=&limit=` (both locations use same view, filtered by status)
- `GET /:id` -- transfer detail with all items + dispatched/received qtys
- `POST /` -- create draft transfer `{dispatchedBy, notes?, items: [{productId, qtyDispatched}]}`
- `PATCH /:id` -- update draft (add/remove items, change qtys)
- `POST /:id/dispatch` -- mark as dispatched, record `dispatchedAt` timestamp
- `POST /:id/receive` -- **transactional**: accepts `{receivedBy, items: [{id, qtyReceived, discrepancyNotes?}]}`, creates `transfer_in` stock movements for each item, sets status = `received` or `partial`, updates `stock_qty` on products

**Admin pages**:
- `routes/stock-transfers/index.tsx`:
  - Two tabs: **Outgoing** (Georgetown view — drafts + dispatched) | **Incoming** (Park view — dispatched + received)
  - Status badges: Draft (grey), Dispatched (amber, "in transit"), Received (green), Partial (orange), Cancelled (red)
  - "New Transfer" button → create form
- `routes/stock-transfers/new.tsx`:
  - Georgetown staff selects products + quantities from product list
  - Adds dispatcher name + notes (vehicle, driver, etc.)
  - Save as Draft or Dispatch immediately
- `routes/stock-transfers/$id.tsx` — two modes depending on status:
  - **Dispatch mode** (status=draft): edit items, mark as dispatched
  - **Receive mode** (status=dispatched): checklist — each item shows expected qty, input for received qty, discrepancy notes field. "Verify Receipt" button submits all at once.
  - **View mode** (status=received/partial): read-only summary showing dispatched vs received, any discrepancies highlighted

`★ Insight ─────────────────────────────────────`
The receive endpoint uses a database transaction — it checks each product still exists, creates all stock movements, and updates `stock_qty` atomically. If any step fails the entire receipt is rolled back. This is the same pattern as `POST /sale`.
`─────────────────────────────────────────────────`

### Files (Phase 3)

| Action | File |
|--------|------|
| Create | `apps/api/src/routes/admin-inventory.ts` |
| Create | `apps/api/src/routes/admin-stock-transfers.ts` |
| Modify | `apps/api/src/routes/admin.ts` (mount both) |
| Modify | `apps/admin/src/lib/api.ts` (inventory + transfer functions) |
| Create | `apps/admin/src/routes/inventory.tsx` |
| Create | `apps/admin/src/routes/stock-transfers/index.tsx` |
| Create | `apps/admin/src/routes/stock-transfers/new.tsx` |
| Create | `apps/admin/src/routes/stock-transfers/$id.tsx` |

### Verify

- Only trackStock=true products appear in inventory
- Sell items via POS -> stock decreases, movement logged
- Restock +100 -> stock increases, movement logged
- Georgetown creates transfer: Water x24, Sodas x48 -> status: Draft
- Mark dispatched -> status: Dispatched, `dispatchedAt` set
- Park opens transfer, enters received qtys (Water x24, Sodas x45 — 3 broken) -> status: Partial
- `stock_qty` for Sodas increased by 45 (not 48), movement type = `transfer_in`
- Discrepancy note on Sodas: "3 bottles broken in transit"
- Full receipt (no discrepancies) -> status: Received

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

- **7 modified files**, **18 new files**
- **8 new DB tables**: `netsurf_product_categories`, `netsurf_products`, `netsurf_sales`, `netsurf_sale_payments`, `netsurf_sale_items`, `netsurf_stock_movements`, `netsurf_stock_transfers`, `netsurf_stock_transfer_items` + audit log in Phase 4
- **~40 API endpoints**, **11 new admin pages**
- **No new npm packages**, **no Docker/nginx changes**
- All behind existing JWT auth

### New admin pages summary

| Page | Phase | Purpose |
|------|-------|---------|
| `products/index` | 1 | Product list + category tabs |
| `products/new` | 1 | Create product |
| `products/$id` | 1 | Edit product |
| `pos` | 2 | POS terminal (selling) |
| `cabins` | 2 | Cabin availability + capacity view |
| `inventory` | 3 | Stock levels, restock, adjust |
| `stock-transfers/index` | 3 | Outgoing/Incoming transfer list |
| `stock-transfers/new` | 3 | Create dispatch (Georgetown) |
| `stock-transfers/$id` | 3 | Dispatch / Receive / View transfer |
| `sales/index` | 4 | Sales history + daily summary |
| `sales/$id` | 4 | Sale detail + void |

## Suggested seed categories

1. Day Passes & Admissions
2. Food & Drinks
3. Activities & Rentals
4. Merchandise
5. Meal Packages
