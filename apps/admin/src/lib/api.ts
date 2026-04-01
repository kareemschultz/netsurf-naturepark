import type { AdminRoleSlug, PaymentMethod } from "@workspace/shared";
import {
  API_BASE,
  authClient,
  fetchAdminSession,
  signInWithUsername,
  signOutAdmin,
} from "./auth";

function buildQuery(
  params: Record<string, string | number | boolean | null | undefined>
): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    query.set(key, String(value));
  }

  const stringified = query.toString();
  return stringified ? `?${stringified}` : "";
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    window.location.href = "/admin/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || res.statusText);
  }

  return res.json() as Promise<T>;
}

export interface Booking {
  id: number;
  cabinSlug: string;
  checkIn: string;
  checkOut: string;
  stayType: "overnight" | "day_use";
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

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  productCount?: number;
}

export interface Product {
  id: number;
  categoryId: number;
  categoryName: string | null;
  categorySlug: string | null;
  name: string;
  slug: string;
  description: string;
  priceGyd: number;
  sku: string | null;
  trackStock: boolean;
  stockQty: number;
  lowStockThreshold: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface SalePayment {
  id: number;
  saleId: number;
  method: PaymentMethod;
  amountGyd: number;
  reference: string | null;
  createdAt: string;
}

export interface SaleLineItem {
  id: number;
  saleId: number;
  productId: number;
  productName: string;
  unitPriceGyd: number;
  quantity: number;
  lineTotalGyd: number;
}

export interface SaleRecord {
  id: number;
  saleNumber: string;
  subtotalGyd: number;
  discountGyd: number;
  taxGyd: number;
  totalGyd: number;
  itemsCount: number;
  paymentMethod: PaymentMethod | null;
  notes: string;
  voided: boolean;
  voidedAt: string | null;
  voidReason: string;
  createdAt: string;
}

export interface SaleDetail extends SaleRecord {
  items: SaleLineItem[];
  payments: SalePayment[];
}

export interface SaleListResponse {
  data: SaleRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface CompletedSaleResponse {
  sale: SaleRecord;
  items: SaleLineItem[];
  payments: SalePayment[];
}

export interface AttendanceEntry {
  id: number;
  staffName: string;
  location: string;
  eventType: "clock_in" | "clock_out";
  eventAt: string;
  source: "pos" | "manual";
  notes: string;
  recordedBy: string;
  createdAt: string;
}

export interface CabinAvailabilityBooking {
  id: number;
  guestName: string;
  checkIn: string;
  checkOut: string;
}

export interface CabinAvailabilityBlocked {
  id: number;
  reason: string;
  startDate: string;
  endDate: string;
}

export interface CabinAvailability {
  slug: string;
  name: string;
  maxGuests: number;
  status: "available" | "overnight" | "day_use" | "both" | "blocked";
  blocked: CabinAvailabilityBlocked | null;
  overnight: CabinAvailabilityBooking | null;
  dayUse: CabinAvailabilityBooking | null;
  upcomingCheckIns: CabinAvailabilityBooking[];
}

export interface CabinAvailabilityResponse {
  date: string;
  cabins: CabinAvailability[];
}

export interface InventoryItem {
  id: number;
  categoryId: number;
  categoryName: string | null;
  name: string;
  slug: string;
  sku: string | null;
  priceGyd: number;
  stockQty: number;
  lowStockThreshold: number;
  isActive: boolean;
  updatedAt: string;
}

export interface InventoryListResponse {
  data: InventoryItem[];
  total: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface InventoryAlert {
  id: number;
  name: string;
  sku: string | null;
  stockQty: number;
  lowStockThreshold: number;
  categoryName: string | null;
}

export interface StockMovement {
  id: number;
  productId: number;
  productName: string | null;
  type: string;
  quantityChange: number;
  referenceId: number | null;
  notes: string;
  createdAt: string;
}

export interface StockMovementListResponse {
  data: StockMovement[];
  total: number;
  page: number;
  limit: number;
}

export interface StockTransferListItem {
  id: number;
  transferNumber: string;
  status: "draft" | "dispatched" | "received" | "partial" | "cancelled";
  dispatchedBy: string;
  dispatchedAt: string | null;
  notes: string;
  receivedBy: string | null;
  receivedAt: string | null;
  createdAt: string;
  itemCount: number;
  totalDispatchedQty: number;
}

export interface StockTransferItem {
  id: number;
  transferId: number;
  productId: number;
  productNameSnapshot: string;
  qtyDispatched: number;
  qtyReceived: number | null;
  discrepancyNotes: string;
}

export interface StockTransferDetail {
  id: number;
  transferNumber: string;
  status: "draft" | "dispatched" | "received" | "partial" | "cancelled";
  dispatchedBy: string;
  dispatchedAt: string | null;
  notes: string;
  receivedBy: string | null;
  receivedAt: string | null;
  createdAt: string;
  items: StockTransferItem[];
}

export interface StockTransferListResponse {
  data: StockTransferListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface SalesSummary {
  totalSales: number;
  totalRevenueGyd: number;
  itemsSold: number;
  byCategory: Array<{
    categoryName: string;
    categorySlug: string | null;
    revenueGyd: number;
    quantitySold: number;
  }>;
  byPaymentMethod: Array<{
    method: string;
    amountGyd: number;
    saleCount: number;
  }>;
  topProducts: Array<{
    productId: number;
    productName: string;
    quantitySold: number;
    revenueGyd: number;
  }>;
}

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  username: string | null;
  displayUsername: string | null;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: string | null;
}

export interface AdminUserListResponse {
  users: AdminUserRecord[];
  total: number;
  limit?: number;
  offset?: number;
}

export interface AdminUserSessionRecord {
  id: string;
  expiresAt: string;
  token: string;
  createdAt: string;
  updatedAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  userId: string;
  impersonatedBy: string | null;
}

export async function login(username: string, password: string): Promise<void> {
  await signInWithUsername(username, password);
}

export async function logout(): Promise<void> {
  await signOutAdmin();
}

export async function isAuthenticated(): Promise<boolean> {
  return !!(await fetchAdminSession());
}

function unwrapAuthResult<T>(
  result: { data?: T | null; error?: { message?: string } | null }
): T {
  if (result.error) {
    throw new Error(result.error.message || "Request failed");
  }

  if (result.data == null) {
    throw new Error("No data returned");
  }

  return result.data;
}

function toDateString(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return new Date(0).toISOString();
}

function toOptionalDateString(value: unknown): string | null {
  if (value == null) {
    return null;
  }

  return toDateString(value);
}

function normalizeRoleValue(value: unknown): string | null {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string").join(",");
  }

  return typeof value === "string" ? value : null;
}

function normalizeUserRecord(rawUser: unknown): AdminUserRecord {
  const user =
    rawUser && typeof rawUser === "object"
      ? (rawUser as Record<string, unknown>)
      : {};

  return {
    id: String(user.id ?? ""),
    name: String(user.name ?? ""),
    email: String(user.email ?? ""),
    emailVerified: Boolean(user.emailVerified),
    image: typeof user.image === "string" ? user.image : null,
    createdAt: toDateString(user.createdAt),
    updatedAt: toDateString(user.updatedAt),
    username: typeof user.username === "string" ? user.username : null,
    displayUsername:
      typeof user.displayUsername === "string" ? user.displayUsername : null,
    role: normalizeRoleValue(user.role),
    banned: typeof user.banned === "boolean" ? user.banned : null,
    banReason: typeof user.banReason === "string" ? user.banReason : null,
    banExpires: toOptionalDateString(user.banExpires),
  };
}

function unwrapUserRecord(
  result: { data?: unknown | null; error?: { message?: string } | null }
): AdminUserRecord {
  const data = unwrapAuthResult(result);
  const rawUser =
    data && typeof data === "object" && "user" in data
      ? (data as { user?: unknown }).user
      : data;

  return normalizeUserRecord(rawUser);
}

function normalizeSessionRecord(rawSession: unknown): AdminUserSessionRecord {
  const session =
    rawSession && typeof rawSession === "object"
      ? (rawSession as Record<string, unknown>)
      : {};

  return {
    id: String(session.id ?? ""),
    expiresAt: toDateString(session.expiresAt),
    token: String(session.token ?? ""),
    createdAt: toDateString(session.createdAt),
    updatedAt: toDateString(session.updatedAt),
    ipAddress: typeof session.ipAddress === "string" ? session.ipAddress : null,
    userAgent: typeof session.userAgent === "string" ? session.userAgent : null,
    userId: String(session.userId ?? ""),
    impersonatedBy:
      typeof session.impersonatedBy === "string" ? session.impersonatedBy : null,
  };
}

function unwrapSessionRecords(
  result: { data?: unknown | null; error?: { message?: string } | null }
): AdminUserSessionRecord[] {
  const data = unwrapAuthResult(result);
  const rawSessions = Array.isArray(data)
    ? data
    : data && typeof data === "object" && "sessions" in data
      ? ((data as { sessions?: unknown[] }).sessions ?? [])
      : [];

  return rawSessions.map((session) => normalizeSessionRecord(session));
}

export async function listStaffUsers(params?: {
  searchValue?: string;
  searchField?: "email" | "name";
  searchOperator?: "contains" | "starts_with" | "ends_with";
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  limit?: number;
  offset?: number;
  filterField?: string;
  filterValue?: string | number | boolean | string[];
  filterOperator?:
    | "eq"
    | "contains"
    | "starts_with"
    | "ends_with"
    | "in"
    | "not_in"
    | "lt"
    | "lte"
    | "gt"
    | "gte"
    | "ne";
}): Promise<AdminUserListResponse> {
  const data = unwrapAuthResult(
    await authClient.admin.listUsers({
      query: params ?? {},
    })
  ) as { users: unknown[]; total: number; limit?: number; offset?: number };

  return {
    users: data.users.map((user) => normalizeUserRecord(user)),
    total: data.total,
    limit: data.limit,
    offset: data.offset,
  };
}

export async function createStaffUser(data: {
  name: string;
  email: string;
  username: string;
  password: string;
  role: AdminRoleSlug;
}): Promise<AdminUserRecord> {
  const result = await authClient.admin.createUser({
    email: data.email,
    password: data.password,
    name: data.name,
    role: data.role,
    data: {
      username: data.username,
      displayUsername: data.name,
    },
  });

  return unwrapUserRecord(result);
}

export async function updateStaffUser(
  userId: string,
  data: Partial<{
    name: string;
    email: string;
    username: string;
    displayUsername: string;
  }>
): Promise<AdminUserRecord> {
  const payload: Record<string, unknown> = {};

  if (data.name !== undefined) payload.name = data.name;
  if (data.email !== undefined) payload.email = data.email;
  if (data.username !== undefined) payload.username = data.username;
  if (data.displayUsername !== undefined) payload.displayUsername = data.displayUsername;

  return unwrapUserRecord(
    await authClient.admin.updateUser({
      userId,
      data: payload,
    })
  );
}

export async function setStaffUserRole(
  userId: string,
  role: AdminRoleSlug
): Promise<AdminUserRecord> {
  const result = await authClient.admin.setRole({
    userId,
    role,
  });

  return unwrapUserRecord(result);
}

export async function setStaffUserPassword(
  userId: string,
  newPassword: string
): Promise<void> {
  unwrapAuthResult(
    await authClient.admin.setUserPassword({
      userId,
      newPassword,
    })
  );
}

export async function banStaffUser(
  userId: string,
  banReason: string,
  banExpiresIn?: number
): Promise<AdminUserRecord> {
  const result = await authClient.admin.banUser({
    userId,
    banReason,
    banExpiresIn,
  });

  return unwrapUserRecord(result);
}

export async function unbanStaffUser(userId: string): Promise<AdminUserRecord> {
  const result = await authClient.admin.unbanUser({
    userId,
  });

  return unwrapUserRecord(result);
}

export async function removeStaffUser(userId: string): Promise<void> {
  unwrapAuthResult(
    await authClient.admin.removeUser({
      userId,
    })
  );
}

export async function listStaffUserSessions(
  userId: string
): Promise<AdminUserSessionRecord[]> {
  const result = await authClient.admin.listUserSessions({
    userId,
  });

  return unwrapSessionRecords(result);
}

export async function revokeStaffUserSession(sessionToken: string): Promise<void> {
  unwrapAuthResult(
    await authClient.admin.revokeUserSession({
      sessionToken,
    })
  );
}

export async function revokeAllStaffUserSessions(userId: string): Promise<void> {
  unwrapAuthResult(
    await authClient.admin.revokeUserSessions({
      userId,
    })
  );
}

export async function getStats(): Promise<Stats> {
  return request<Stats>("GET", "/admin/stats");
}

export async function getBookings(params?: {
  status?: string;
  cabin?: string;
  page?: number;
  limit?: number;
}): Promise<BookingListResponse> {
  return request<BookingListResponse>(
    "GET",
    `/admin/bookings${buildQuery(params ?? {})}`
  );
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

export async function getCalendar(year: number, month: number): Promise<CalendarResponse> {
  return request<CalendarResponse>("GET", `/admin/calendar?year=${year}&month=${month}`);
}

export async function getCategories(params?: {
  active?: boolean;
}): Promise<Category[]> {
  return request<Category[]>("GET", `/admin/categories${buildQuery(params ?? {})}`);
}

export async function createCategory(data: {
  name: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<Category> {
  return request<Category>("POST", "/admin/categories", data);
}

export async function updateCategory(
  id: number,
  data: Partial<{
    name: string;
    description: string;
    sortOrder: number;
    isActive: boolean;
  }>
): Promise<Category> {
  return request<Category>("PATCH", `/admin/categories/${id}`, data);
}

export async function deleteCategory(id: number): Promise<void> {
  await request<{ ok: true }>("DELETE", `/admin/categories/${id}`);
}

export async function getProducts(params?: {
  categoryId?: number;
  active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ProductListResponse> {
  return request<ProductListResponse>(
    "GET",
    `/admin/products${buildQuery(params ?? {})}`
  );
}

export async function getProduct(id: number): Promise<Product> {
  return request<Product>("GET", `/admin/products/${id}`);
}

export async function createProduct(data: {
  name: string;
  categoryId: number;
  description?: string;
  priceGyd: number;
  sku?: string | null;
  trackStock?: boolean;
  stockQty?: number;
  lowStockThreshold?: number;
  isActive?: boolean;
}): Promise<Product> {
  return request<Product>("POST", "/admin/products", data);
}

export async function updateProduct(
  id: number,
  data: Partial<{
    name: string;
    categoryId: number;
    description: string;
    priceGyd: number;
    sku: string | null;
    trackStock: boolean;
    stockQty: number;
    lowStockThreshold: number;
    isActive: boolean;
  }>
): Promise<Product> {
  return request<Product>("PATCH", `/admin/products/${id}`, data);
}

export async function deleteProduct(id: number): Promise<Product> {
  return request<Product>("DELETE", `/admin/products/${id}`);
}

export async function getPosProducts(): Promise<Product[]> {
  return request<Product[]>("GET", "/admin/pos/products");
}

export async function createSale(data: {
  items: Array<{ productId: number; quantity: number }>;
  paymentMethod: PaymentMethod;
  paymentReference?: string | null;
  discountGyd?: number;
  taxGyd?: number;
  notes?: string;
}): Promise<CompletedSaleResponse> {
  return request<CompletedSaleResponse>("POST", "/admin/pos/sale", data);
}

export async function voidSale(id: number, reason: string): Promise<SaleRecord> {
  return request<SaleRecord>("POST", `/admin/pos/sale/${id}/void`, { reason });
}

export async function getAttendanceEntries(params?: {
  from?: string;
  to?: string;
  staffName?: string;
  limit?: number;
}): Promise<AttendanceEntry[]> {
  return request<AttendanceEntry[]>(
    "GET",
    `/admin/pos/attendance${buildQuery(params ?? {})}`
  );
}

export async function createAttendanceEntry(data: {
  staffName: string;
  location?: string;
  eventType: "clock_in" | "clock_out";
  eventAt: string;
  source?: "pos" | "manual";
  notes?: string;
}): Promise<AttendanceEntry> {
  return request<AttendanceEntry>("POST", "/admin/pos/attendance", data);
}

export async function getCabinAvailability(date: string): Promise<CabinAvailabilityResponse> {
  return request<CabinAvailabilityResponse>(
    "GET",
    `/admin/cabins/availability${buildQuery({ date })}`
  );
}

export async function getInventory(params?: {
  lowStock?: boolean;
  categoryId?: number;
}): Promise<InventoryListResponse> {
  return request<InventoryListResponse>(
    "GET",
    `/admin/inventory${buildQuery(params ?? {})}`
  );
}

export async function getInventoryAlerts(): Promise<InventoryAlert[]> {
  return request<InventoryAlert[]>("GET", "/admin/inventory/alerts");
}

export async function restockInventory(data: {
  productId: number;
  quantity: number;
  notes?: string;
}): Promise<Product> {
  return request<Product>("POST", "/admin/inventory/restock", data);
}

export async function adjustInventory(data: {
  productId: number;
  newQty: number;
  notes: string;
}): Promise<Product> {
  return request<Product>("POST", "/admin/inventory/adjust", data);
}

export async function getStockMovements(params?: {
  productId?: number;
  type?: string;
  page?: number;
  limit?: number;
}): Promise<StockMovementListResponse> {
  return request<StockMovementListResponse>(
    "GET",
    `/admin/inventory/movements${buildQuery(params ?? {})}`
  );
}

export async function getStockTransfers(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<StockTransferListResponse> {
  return request<StockTransferListResponse>(
    "GET",
    `/admin/stock-transfers${buildQuery(params ?? {})}`
  );
}

export async function getStockTransfer(id: number): Promise<StockTransferDetail> {
  return request<StockTransferDetail>("GET", `/admin/stock-transfers/${id}`);
}

export async function createStockTransfer(data: {
  dispatchedBy: string;
  notes?: string;
  items: Array<{ productId: number; qtyDispatched: number }>;
}): Promise<StockTransferDetail> {
  return request<StockTransferDetail>("POST", "/admin/stock-transfers", data);
}

export async function updateStockTransfer(
  id: number,
  data: Partial<{
    dispatchedBy: string;
    notes: string;
    items: Array<{ productId: number; qtyDispatched: number }>;
  }>
): Promise<StockTransferDetail> {
  return request<StockTransferDetail>("PATCH", `/admin/stock-transfers/${id}`, data);
}

export async function dispatchStockTransfer(id: number): Promise<StockTransferListItem> {
  return request<StockTransferListItem>("POST", `/admin/stock-transfers/${id}/dispatch`);
}

export async function receiveStockTransfer(data: {
  id: number;
  receivedBy: string;
  items: Array<{ id: number; qtyReceived: number; discrepancyNotes?: string }>;
}): Promise<StockTransferDetail> {
  return request<StockTransferDetail>(
    "POST",
    `/admin/stock-transfers/${data.id}/receive`,
    {
      receivedBy: data.receivedBy,
      items: data.items,
    }
  );
}

export async function getSales(params?: {
  date?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  voided?: boolean;
}): Promise<SaleListResponse> {
  return request<SaleListResponse>(
    "GET",
    `/admin/sales${buildQuery(params ?? {})}`
  );
}

export async function getSale(id: number): Promise<SaleDetail> {
  return request<SaleDetail>("GET", `/admin/sales/${id}`);
}

export async function getDailySalesSummary(date?: string): Promise<SalesSummary> {
  return request<SalesSummary>(
    "GET",
    `/admin/sales/summary${buildQuery({ date })}`
  );
}

export async function getSalesRangeSummary(
  from: string,
  to: string
): Promise<SalesSummary> {
  return request<SalesSummary>(
    "GET",
    `/admin/sales/summary/range${buildQuery({ from, to })}`
  );
}
