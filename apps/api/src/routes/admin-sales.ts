import { Hono } from "hono"
import { and, desc, eq, sql } from "drizzle-orm"
import { db } from "../db.js"
import {
  productCategories,
  products,
  saleItems,
  salePayments,
  sales,
} from "@workspace/db"
import { ApiError, parseBooleanFlag, parseId } from "./admin-helpers.js"

export const adminSalesRoute = new Hono()

function buildDateConditions(tableColumn: typeof sales.createdAt, query: {
  date?: string
  from?: string
  to?: string
}) {
  const conditions = []
  if (query.date) {
    conditions.push(sql`date(${tableColumn}) = ${query.date}`)
  }
  if (query.from) {
    conditions.push(sql`date(${tableColumn}) >= ${query.from}`)
  }
  if (query.to) {
    conditions.push(sql`date(${tableColumn}) <= ${query.to}`)
  }
  return conditions
}

async function getSalesSummary(query: { date?: string; from?: string; to?: string }) {
  const conditions = [eq(sales.voided, false), ...buildDateConditions(sales.createdAt, query)]
  const where = and(...conditions)

  const [totalsResult, byCategory, byPaymentMethod, topProducts] = await Promise.all([
    db
      .select({
        totalSales: sql<number>`count(*)::int`,
        totalRevenue: sql<number>`coalesce(sum(${sales.totalGyd}), 0)::int`,
        itemsSold: sql<number>`coalesce(sum(${sales.itemsCount}), 0)::int`,
      })
      .from(sales)
      .where(where),
    db
      .select({
        categoryName: sql<string>`coalesce(${productCategories.name}, 'Uncategorized')`,
        categorySlug: productCategories.slug,
        revenueGyd: sql<number>`coalesce(sum(${saleItems.lineTotalGyd}), 0)::int`,
        quantitySold: sql<number>`coalesce(sum(${saleItems.quantity}), 0)::int`,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .leftJoin(products, eq(saleItems.productId, products.id))
      .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
      .where(where)
      .groupBy(productCategories.id, productCategories.name, productCategories.slug)
      .orderBy(desc(sql`coalesce(sum(${saleItems.lineTotalGyd}), 0)`)),
    db
      .select({
        method: salePayments.method,
        amountGyd: sql<number>`coalesce(sum(${salePayments.amountGyd}), 0)::int`,
        saleCount: sql<number>`count(distinct ${salePayments.saleId})::int`,
      })
      .from(salePayments)
      .innerJoin(sales, eq(salePayments.saleId, sales.id))
      .where(where)
      .groupBy(salePayments.method)
      .orderBy(desc(sql`coalesce(sum(${salePayments.amountGyd}), 0)`)),
    db
      .select({
        productId: saleItems.productId,
        productName: saleItems.productName,
        quantitySold: sql<number>`coalesce(sum(${saleItems.quantity}), 0)::int`,
        revenueGyd: sql<number>`coalesce(sum(${saleItems.lineTotalGyd}), 0)::int`,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .where(where)
      .groupBy(saleItems.productId, saleItems.productName)
      .orderBy(desc(sql`coalesce(sum(${saleItems.quantity}), 0)`))
      .limit(5),
  ])

  const totals = totalsResult[0] ?? {
    totalSales: 0,
    totalRevenue: 0,
    itemsSold: 0,
  }

  return {
    totalSales: totals.totalSales,
    totalRevenueGyd: totals.totalRevenue,
    itemsSold: totals.itemsSold,
    byCategory,
    byPaymentMethod,
    topProducts,
  }
}

adminSalesRoute.get("/", async (c) => {
  const date = c.req.query("date")
  const from = c.req.query("from")
  const to = c.req.query("to")
  const voided = parseBooleanFlag(c.req.query("voided"))
  const page = Math.max(1, Number.parseInt(c.req.query("page") || "1", 10))
  const limit = Math.min(100, Number.parseInt(c.req.query("limit") || "25", 10))
  const offset = (page - 1) * limit

  const conditions = [...buildDateConditions(sales.createdAt, { date, from, to })]
  if (voided !== undefined) {
    conditions.push(eq(sales.voided, voided))
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(sales)
      .where(where)
      .orderBy(desc(sales.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(sales)
      .where(where),
  ])

  return c.json({
    data: rows,
    total: countResult[0]?.count ?? 0,
    page,
    limit,
  })
})

adminSalesRoute.get("/summary", async (c) => {
  const date = c.req.query("date") ?? new Date().toISOString().slice(0, 10)
  return c.json(await getSalesSummary({ date }))
})

adminSalesRoute.get("/summary/range", async (c) => {
  const from = c.req.query("from")
  const to = c.req.query("to")

  if (!from || !to) {
    return c.json({ error: "from and to query params are required" }, 400)
  }

  return c.json(await getSalesSummary({ from, to }))
})

adminSalesRoute.get("/:id", async (c) => {
  try {
    const id = parseId(c.req.param("id"))
    const [sale] = await db
      .select()
      .from(sales)
      .where(eq(sales.id, id))
      .limit(1)

    if (!sale) {
      throw new ApiError(404, "Sale not found")
    }

    const [items, payments] = await Promise.all([
      db
        .select()
        .from(saleItems)
        .where(eq(saleItems.saleId, sale.id))
        .orderBy(saleItems.id),
      db
        .select()
        .from(salePayments)
        .where(eq(salePayments.saleId, sale.id))
        .orderBy(salePayments.id),
    ])

    return c.json({ ...sale, items, payments })
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json({ error: error.message }, error.status as any)
    }
    throw error
  }
})
