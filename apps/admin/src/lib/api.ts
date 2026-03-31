import type { PaymentMethod } from "@workspace/shared";

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}`
  : "/api";

function token(): string | null {
  return localStorage.getItem("admin_token");
}

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
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const adminToken = token();
  if (adminToken) {
    headers["Authorization"] = `Bearer ${adminToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem("admin_token");
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
