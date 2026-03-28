// API client for the Hono backend.
// In dev, Vite proxies /api → http://localhost:3001.
// In production, VITE_API_URL is set to https://api.netsurfnaturepark.com.

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}`
  : "/api";

function token(): string | null {
  return localStorage.getItem("admin_token");
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const t = token();
  if (t) headers["Authorization"] = `Bearer ${t}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem("admin_token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || res.statusText);
  }

  return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Booking {
  id: number;
  cabinSlug: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  addOnSlugs: string[];
  name: string;
  contact: string;
  notes: string;
  status: "pending" | "confirmed" | "declined" | "cancelled";
  actionToken: string | null;
  estimatedTotalGyd: number;
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlockedDate {
  id: number;
  cabinSlug: string | null;
  startDate: string;
  endDate: string;
  reason: string;
  createdAt: string;
}

export interface Stats {
  pending: number;
  confirmed: number;
  declined: number;
  cancelled: number;
  total: number;
  revenueGyd: number;
}

export interface BookingListResponse {
  data: Booking[];
  total: number;
  page: number;
  limit: number;
}

export interface CalendarResponse {
  year: number;
  month: number;
  bookings: Booking[];
  blocked: BlockedDate[];
  cabins: { slug: string; name: string }[];
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function login(password: string): Promise<void> {
  const res = await request<{ token: string }>("POST", "/admin/login", { password });
  localStorage.setItem("admin_token", res.token);
}

export function logout(): void {
  localStorage.removeItem("admin_token");
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem("admin_token");
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export async function getStats(): Promise<Stats> {
  return request<Stats>("GET", "/admin/stats");
}

export async function getBookings(params?: {
  status?: string;
  cabin?: string;
  page?: number;
  limit?: number;
}): Promise<BookingListResponse> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.cabin) qs.set("cabin", params.cabin);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const q = qs.toString();
  return request<BookingListResponse>("GET", `/admin/bookings${q ? `?${q}` : ""}`);
}

export async function getBooking(id: number): Promise<Booking> {
  return request<Booking>("GET", `/admin/bookings/${id}`);
}

export async function updateBooking(
  id: number,
  updates: { status?: Booking["status"]; adminNotes?: string }
): Promise<Booking> {
  return request<Booking>("PATCH", `/admin/bookings/${id}`, updates);
}

// ─── Blocked dates ────────────────────────────────────────────────────────────

export async function getBlockedDates(): Promise<BlockedDate[]> {
  return request<BlockedDate[]>("GET", "/admin/blocked-dates");
}

export async function createBlockedDate(data: {
  cabinSlug: string | null;
  startDate: string;
  endDate: string;
  reason: string;
}): Promise<BlockedDate> {
  return request<BlockedDate>("POST", "/admin/blocked-dates", data);
}

export async function deleteBlockedDate(id: number): Promise<void> {
  await request<unknown>("DELETE", `/admin/blocked-dates/${id}`);
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

export async function getCalendar(year: number, month: number): Promise<CalendarResponse> {
  return request<CalendarResponse>("GET", `/admin/calendar?year=${year}&month=${month}`);
}
