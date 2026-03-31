<div align="center">

# Netsurf Nature Park

**Booking platform for Guyana's premier eco-lodge retreat**

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-4.8-E36002?logo=hono&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-1.3-F9F1E1?logo=bun&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-Proprietary-red)

[Live Site](https://www.netsurfnaturepark.com) · [Admin Portal](https://www.netsurfnaturepark.com/admin/) · [API](https://www.netsurfnaturepark.com/api/health)

</div>

---

## Overview

Full-stack booking system for Netsurf Nature Park — a 100% solar-powered eco-retreat on the Soesdyke-Linden Highway, Guyana. Guests browse cabins, check real-time availability, and submit booking requests through a polished 5-step wizard. Admins receive instant mobile push notifications and can confirm or decline with one tap.

Replaced QloApps (512MB PHP/MySQL monolith) with a lean, modern multi-service app using ~4× less RAM.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Bun 1.3 |
| **Monorepo** | Turborepo 2 |
| **Web + Admin** | React 19, Vite 7, TanStack Router (file-based) |
| **Styling** | Tailwind CSS 4, shadcn/ui (Base UI preset) |
| **Animations** | Framer Motion 12 (12-layer GPU-composited hero system) |
| **API** | Hono 4.8 (Bun native) |
| **Database** | PostgreSQL 16 + Drizzle ORM |
| **Validation** | Zod 3 |
| **Auth** | Better Auth sessions + RBAC + HMAC-SHA256 one-click action tokens |
| **Notifications** | ntfy.sh push to mobile |
| **Container** | Docker — single unified image (`kt-netsurf`): nginx + Bun API, path-routed |

---

## Project Structure

```
netsurf-naturepark/
├── apps/
│   ├── web/                Public booking website (React SPA, served at /)
│   ├── api/                REST API (Hono on Bun, served at /api/)
│   └── admin/              Admin dashboard (React SPA, served at /admin/)
├── packages/
│   ├── db/                 Drizzle schema, migrations, types
│   ├── shared/             Cabin catalog, pricing, add-ons, helpers
│   └── ui/                 Component library, brand theme, globals.css
├── Dockerfile.combined     Unified 4-stage build → single kt-netsurf image
├── nginx.combined.conf     Path-based routing: /admin/ alias, /api/ proxy, / web SPA
├── entrypoint.sh           Starts Bun API in background, exec nginx as PID 1
└── turbo.json              Turborepo pipeline config
```

---

## Features

### Guest Experience
- Browse 4 cabin types with pricing in GYD
- SVG illustration system per cabin type (`NatureArtwork`)
- Real-time availability checking per cabin and date range
- 5-step booking wizard: cabin → dates → add-ons → details → confirm
- WhatsApp fallback if API is unavailable
- 12-layer animated hero (birds, butterflies, fireflies, mist, ripples…)
- Fully responsive, skip-link accessible, `prefers-reduced-motion` aware

### Admin Dashboard (`www.netsurfnaturepark.com/admin/`)
- Better Auth staff portal with named accounts, cookie-backed sessions, and route-level RBAC
- Dashboard: today's check-ins/check-outs, pending count, revenue stats
- Booking management: view, confirm, decline, add notes
- Calendar and blocked date management
- POS, products, inventory, stock transfers, cabins, sales history, and reporting
- Staff Users & Access screens for account management and role visibility

### Notification System
- Instant push notifications via ntfy.sh on new booking
- One-click confirm/decline links in push notification (HMAC-signed, no login required)
- Action tokens expire and are single-use

---

## Cabins and Pricing

| Cabin | Nightly Rate (GYD) | Max Guests |
|-------|-------------------|------------|
| Camping Site | 8,000 | 4 |
| Nature Cabin | 15,000 | 2 |
| Medium Cabin | 18,000 | 4 |
| Hansel & Gretel Cabin | 30,000 | 6 |

### Add-ons

| Add-on | Price (GYD) |
|--------|------------|
| Day Pass | 5,000 |
| Breakfast | 2,000/person |
| Dinner | 3,500/person |
| BBQ Package | 8,000 |
| Nature Walk | 3,000 |
| Kayak Half-Day | 4,000 |
| Transport from Georgetown | 5,000 |

---

## Getting Started

### Prerequisites
- [Bun](https://bun.sh) >= 1.3
- PostgreSQL 16

### Install

```bash
bun install
```

### Environment Variables

Production secrets live in `/opt/infrastructure/docker/netsurf-naturepark/.env`. For local dev, create `apps/api/.env`:

```env
DATABASE_URL=postgresql://netsurf:password@localhost:5432/netsurf
ADMIN_PASSWORD=temporary-bootstrap-password
BETTER_AUTH_URL=http://localhost:3001/auth
ADMIN_EMAIL=admin@netsurfnaturepark.com
ADMIN_USERNAME=admin
ADMIN_NAME=Netsurf Owner
ACTION_TOKEN_SECRET=your-hmac-secret
NTFY_URL=https://ntfy.sh
NTFY_TOPIC=netsurf-bookings-xk9m4p
API_BASE_URL=http://localhost:3001
ADMIN_BASE_URL=http://localhost:5174
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
PORT=3001
```

And `apps/admin/.env.local`:

```env
VITE_API_URL=http://localhost:3001
```

### Database Setup

```bash
cd packages/db && bun run db:push
```

### Development

```bash
bun run dev
```

| App | URL |
|-----|-----|
| Web | http://localhost:5173 |
| Admin | http://localhost:5174 |
| API | http://localhost:3001 |

---

## Docker Deployment

Single unified image (`kt-netsurf`) — 4-stage build combining web SPA, admin SPA, and Bun API.
nginx handles path-based routing; Bun API runs as a background process inside the same container.

> **Note**: The runtime base is `oven/bun:1.3-alpine` (not `nginx:alpine`). Bun and nginx must share
> the same Alpine version to avoid symbol relocation errors with the bun binary.

Build:

```bash
bash /opt/infrastructure/docker/netsurf-naturepark/build.sh
# or manually:
docker build -f Dockerfile.combined -t kt-netsurf:latest .
```

Deploy:

```bash
cd /opt/infrastructure/docker/netsurf-naturepark && docker compose up -d
```

| Route | Serves |
|-------|--------|
| `/` | Web SPA (React, public booking site) |
| `/admin/` | Admin SPA (React, Better Auth staff sessions) |
| `/api/` | Hono REST API (Bun) |

---

## API Reference

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/bookings` | Create booking request |
| `GET` | `/bookings/availability/:slug?checkIn=&checkOut=` | Check cabin availability |
| `GET` | `/:id/action?action=confirm\|decline&token=` | One-click HMAC action |

### Admin Endpoints (Authenticated Staff Sessions Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/stats` | Booking counts + revenue |
| `GET` | `/admin/bookings` | Paginated booking list |
| `GET` | `/admin/bookings/:id` | Booking detail |
| `PATCH` | `/admin/bookings/:id` | Update status/notes |
| `GET` | `/admin/calendar?year=&month=` | Monthly calendar data |
| `GET` | `/admin/blocked-dates` | List blocked dates |
| `POST` | `/admin/blocked-dates` | Create blocked date range |
| `DELETE` | `/admin/blocked-dates/:id` | Remove blocked date |
| `POST` | `/auth/sign-in/username` | Staff login via username/password |
| `GET` | `/auth/get-session` | Return the current Better Auth session |

### Example: Create Booking

```bash
curl -X POST https://www.netsurfnaturepark.com/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "cabinSlug": "nature-cabin",
    "checkIn": "2026-04-15",
    "checkOut": "2026-04-18",
    "guests": 2,
    "addOnSlugs": ["breakfast", "nature-walk"],
    "name": "Jane Doe",
    "contact": "+592-600-0000",
    "notes": "Anniversary trip"
  }'
```

---

## Database Schema

### `netsurf_bookings`

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial | Primary key |
| `cabinSlug` | varchar(100) | References cabin catalog |
| `checkIn` / `checkOut` | date | Stay dates |
| `guests` | integer | Guest count |
| `addOnSlugs` | text[] | Selected add-on slugs |
| `name` | varchar(200) | Guest name |
| `contact` | varchar(200) | Phone / email |
| `notes` | text | Special requests |
| `status` | varchar(20) | `pending` / `confirmed` / `declined` |
| `adminNotes` | text | Internal notes |
| `createdAt` | timestamptz | Submission time |

### `netsurf_blocked_dates`

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial | Primary key |
| `cabinSlug` | varchar(100) | Cabin, or `null` = all cabins |
| `startDate` / `endDate` | date | Blocked range |
| `reason` | text | Optional reason |
| `createdAt` | timestamptz | Created time |

---

## Brand

| Token | Value | Use |
|---|---|---|
| park-green | `#2D5016` | Primary, buttons, navbar |
| park-green-dark | `#1E3A0E` | Navbar background |
| park-amber | `#C4941A` | CTAs, booking buttons |
| park-cream | `#FAF6F0` | Page background |

Font: **Nunito Variable** via `@fontsource-variable/nunito`
