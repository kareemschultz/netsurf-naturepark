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

[Live Site](https://netsurfnaturepark.com) · [Admin Portal](https://admin.netsurfnaturepark.com) · [API](https://api.netsurfnaturepark.com/health)

</div>

---

## Overview

Full-stack booking system for Netsurf Nature Park, an eco-lodge retreat on the Essequibo River in Guyana. Guests browse cabins, check real-time availability, and submit booking requests. Admins receive instant mobile notifications and can confirm or decline with one tap.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Bun 1.3 |
| **Monorepo** | Turborepo 2.8 |
| **Web + Admin** | React 19, Vite 7, TanStack Router |
| **Styling** | Tailwind CSS 4, Framer Motion 12 |
| **API** | Hono 4.8 (Bun native) |
| **Database** | PostgreSQL + Drizzle ORM 0.43 |
| **Validation** | Zod 3.25 |
| **Auth** | JWT (HS256) + HMAC-SHA256 action tokens |
| **Notifications** | ntfy.sh (push to mobile) |
| **Icons** | Huge Icons React |
| **Container** | Docker (nginx 1.27 for SPA, Bun for API) |

## Project Structure

```
netsurf-naturepark/
├── apps/
│   ├── web/           Public booking website (React SPA)
│   ├── api/           REST API (Hono on Bun)
│   └── admin/         Admin dashboard (React SPA)
├── packages/
│   ├── db/            Drizzle schema, migrations, types
│   ├── shared/        Cabin catalog, pricing, add-ons, constants
│   └── ui/            Component library, styles, hooks
├── Dockerfile         Multi-stage build (web SPA)
├── nginx.conf         Production SPA config
└── turbo.json         Pipeline config
```

## Features

### Guest Experience
- Browse 4 cabin types with photo galleries and pricing in GYD
- Real-time availability checking per cabin and date range
- Add-on selection: meals, guided activities, river transport
- WhatsApp booking fallback if API is unavailable
- Fully responsive with motion animations

### Admin Dashboard
- JWT-protected admin portal
- Booking management: view, confirm, decline with notes
- Calendar view with monthly booking overview
- Blocked date management (per-cabin or site-wide)
- Revenue and booking statistics

### Notification System
- Instant push notifications via ntfy.sh on new bookings
- One-click confirm/decline links (HMAC-signed, no login required)
- Guest notification on status change

## Cabins and Pricing

| Cabin | Nightly Rate (GYD) | Max Guests |
|-------|-------------------|------------|
| Camping Spot | 2,000 | 4 |
| Nature Cabin | 5,000 | 2 |
| Medium Cabin | 8,000 | 4 |
| Hansel & Gretel Suite | 12,000 | 6 |

### Add-ons

| Add-on | Price (GYD) |
|--------|------------|
| Breakfast | 2,000/night |
| Lunch | 2,500/night |
| Dinner | 3,500/night |
| Guided Nature Walk | 3,000 |
| River Tour | 4,000 |
| Airport Transfer | 5,000 |

## Getting Started

### Prerequisites
- [Bun](https://bun.sh) >= 1.3
- PostgreSQL 12+
- Node.js >= 20

### Install

```bash
bun install
```

### Environment Variables

Create `.env` in `apps/api/`:

```env
DATABASE_URL=postgres://user:pass@localhost:5432/netsurf
JWT_SECRET=your-jwt-secret
ACTION_TOKEN_SECRET=your-hmac-secret
NTFY_URL=https://ntfy.sh
NTFY_TOPIC=netsurf-bookings
API_BASE_URL=http://localhost:3001
ADMIN_BASE_URL=http://localhost:5174
ADMIN_PASSWORD=your-admin-password
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
PORT=3001
```

And in `apps/admin/`:

```env
VITE_API_URL=http://localhost:3001
```

### Database Setup

```bash
cd packages/db
bun run db:push     # Push schema to database
bun run db:migrate  # Run migrations
```

### Development

```bash
bun run dev         # Start all apps (Turbo)
```

| App | URL |
|-----|-----|
| Web | http://localhost:5173 |
| Admin | http://localhost:5174 |
| API | http://localhost:3001 |

## Docker Deployment

### Build

```bash
docker build -t netsurf-naturepark .
```

### Run

```bash
docker run -d \
  --name netsurf-web \
  -p 8080:80 \
  netsurf-naturepark
```

The API runs separately on Bun:

```bash
cd apps/api && bun run src/index.ts
```

### Production Nginx

The included `nginx.conf` provides:
- SPA fallback routing
- Aggressive asset caching (1 year for hashed assets, 7 days for images)
- Gzip compression
- Security headers

## API Reference

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/bookings` | Create booking request |
| `GET` | `/bookings/availability/:slug` | Check cabin availability |
| `GET` | `/bookings/:id/action` | One-click confirm/decline (token-protected) |
| `GET` | `/health` | Health check |

### Admin Endpoints (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/admin/login` | Exchange password for JWT |
| `GET` | `/admin/stats` | Booking counts + revenue |
| `GET` | `/admin/bookings` | Paginated booking list |
| `GET` | `/admin/bookings/:id` | Booking detail |
| `PATCH` | `/admin/bookings/:id` | Update status/notes |
| `GET` | `/admin/calendar` | Monthly calendar data |
| `GET` | `/admin/blocked-dates` | List blocked dates |
| `POST` | `/admin/blocked-dates` | Create blocked date |
| `DELETE` | `/admin/blocked-dates/:id` | Remove blocked date |

### Example: Create Booking

```bash
curl -X POST https://api.netsurfnaturepark.com/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "cabinSlug": "nature-cabin",
    "checkIn": "2026-04-15",
    "checkOut": "2026-04-18",
    "guests": 2,
    "addOnSlugs": ["breakfast", "river-tour"],
    "name": "Jane Doe",
    "contact": "+592-600-0000",
    "notes": "Anniversary trip"
  }'
```

## Database Schema

### Bookings

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial | Primary key |
| `cabinSlug` | varchar(100) | References cabin catalog |
| `checkIn` / `checkOut` | date | Stay dates |
| `guests` | integer | Guest count |
| `addOnSlugs` | text[] | Selected add-on slugs |
| `name` / `contact` | varchar | Guest info |
| `status` | varchar | pending, confirmed, declined, cancelled |
| `actionToken` | varchar(128) | HMAC token for action links |
| `estimatedTotalGyd` | integer | Pre-calculated total in GYD |

### Blocked Dates

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial | Primary key |
| `cabinSlug` | varchar(100) | NULL = all cabins blocked |
| `startDate` / `endDate` | date | Block range |
| `reason` | text | Admin note |

## Brand Design Tokens

| Token | Value |
|-------|-------|
| Primary Green | `#2D5016` |
| Accent Gold | `#D4A574` |
| Warm Cream | `#FAF7F2` |
| Deep Forest | `#1A3A0A` |
| Font (Headings) | Playfair Display |
| Font (Body) | Inter |
| Border Radius | 12px |

## Contact

**Netsurf Nature Park**
Essequibo River, Guyana

- Website: [netsurfnaturepark.com](https://netsurfnaturepark.com)
- WhatsApp: +592-600-0000
- Email: info@netsurfnaturepark.com

---

Built by [KareTech Solutions](https://karetechsolutions.com)
