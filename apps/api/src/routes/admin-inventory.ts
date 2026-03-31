import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { and, asc, desc, eq, sql } from "drizzle-orm"
import { z } from "zod"
import { db } from "../db.js"
import { getAdminSubject } from "../auth.js"
import {
  posAuditLog,
  productCategories,
  products,
  stockMovements,
} from "@workspace/db"
import {
  ApiError,
  parseBooleanFlag,
  parseId,
} from "./admin-helpers.js"

export const adminInventoryRoute = new Hono()

const restockSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  notes: z.string().max(500).optional().default(""),
})

const adjustSchema = z.object({
  productId: z.number().int().positive(),
  newQty: z.number().int().min(0),
  notes: z.string().min(2).max(500),
})

async function getTrackedProduct(productId: number) {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1)

  if (!product) {
    throw new ApiError(404, "Product not found")
  }
  if (!product.trackStock) {
    throw new ApiError(400, "This product does not track stock")
  }

  return product
}

function lowStockCondition() {
  return sql`${products.stockQty} <= ${products.lowStockThreshold}`
}

adminInventoryRoute.get("/", async (c) => {
  const categoryIdQuery = c.req.query("categoryId")
  const lowStock = parseBooleanFlag(c.req.query("lowStock"))
  const categoryId = categoryIdQuery ? parseId(categoryIdQuery, "categoryId") : undefined

  const conditions = [eq(products.trackStock, true)]
  if (categoryId !== undefined) {
    conditions.push(eq(products.categoryId, categoryId))
  }
  if (lowStock === true) {
    conditions.push(lowStockCondition())
  }

  const rows = await db
    .select({
      id: products.id,
      categoryId: products.categoryId,
      categoryName: productCategories.name,
      name: products.name,
      slug: products.slug,
      sku: products.sku,
      priceGyd: products.priceGyd,
      stockQty: products.stockQty,
      lowStockThreshold: products.lowStockThreshold,
      isActive: products.isActive,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
    .where(and(...conditions))
    .orderBy(desc(products.updatedAt), desc(products.id))

  return c.json({
    data: rows,
    total: rows.length,
    lowStockCount: rows.filter((row) => row.stockQty <= row.lowStockThreshold).length,
    outOfStockCount: rows.filter((row) => row.stockQty === 0).length,
  })
})

adminInventoryRoute.get("/alerts", async (c) => {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      stockQty: products.stockQty,
      lowStockThreshold: products.lowStockThreshold,
      categoryName: productCategories.name,
    })
    .from(products)
    .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
    .where(and(eq(products.trackStock, true), lowStockCondition()))
    .orderBy(asc(products.stockQty), asc(products.name))

  return c.json(rows)
})

adminInventoryRoute.post(
  "/restock",
  zValidator("json", restockSchema),
  async (c) => {
    try {
      const payload = c.req.valid("json")
      const product = await getTrackedProduct(payload.productId)

      const [updated] = await db
        .update(products)
        .set({
          stockQty: product.stockQty + payload.quantity,
          updatedAt: new Date(),
        })
        .where(eq(products.id, product.id))
        .returning()

      await db.insert(stockMovements).values({
        productId: product.id,
        type: "restock",
        quantityChange: payload.quantity,
        notes: payload.notes.trim(),
      })

      return c.json(updated)
    } catch (error) {
      if (error instanceof ApiError) {
        return c.json({ error: error.message }, error.status as any)
      }
      throw error
    }
  }
)

adminInventoryRoute.post(
  "/adjust",
  zValidator("json", adjustSchema),
  async (c) => {
    try {
      const payload = c.req.valid("json")
      const product = await getTrackedProduct(payload.productId)
      const quantityChange = payload.newQty - product.stockQty

      if (quantityChange === 0) {
        throw new ApiError(400, "Stock quantity is already set to that value")
      }

      const [updated] = await db
        .update(products)
        .set({
          stockQty: payload.newQty,
          updatedAt: new Date(),
        })
        .where(eq(products.id, product.id))
        .returning()

      await db.insert(stockMovements).values({
        productId: product.id,
        type: "adjustment",
        quantityChange,
        notes: payload.notes.trim(),
      })

      await db.insert(posAuditLog).values({
        action: "STOCK_ADJUST",
        entityType: "stock_movement",
        entityId: product.id,
        performedBy: getAdminSubject(c),
        metadata: {
          productId: product.id,
          beforeQty: product.stockQty,
          afterQty: payload.newQty,
          quantityChange,
          notes: payload.notes.trim(),
        },
      })

      return c.json(updated)
    } catch (error) {
      if (error instanceof ApiError) {
        return c.json({ error: error.message }, error.status as any)
      }
      throw error
    }
  }
)

adminInventoryRoute.get("/movements", async (c) => {
  const productIdQuery = c.req.query("productId")
  const type = c.req.query("type")?.trim()
  const page = Math.max(1, Number.parseInt(c.req.query("page") || "1", 10))
  const limit = Math.min(100, Number.parseInt(c.req.query("limit") || "25", 10))
  const offset = (page - 1) * limit
  const productId = productIdQuery ? parseId(productIdQuery, "productId") : undefined

  const conditions = []
  if (productId !== undefined) {
    conditions.push(eq(stockMovements.productId, productId))
  }
  if (type) {
    conditions.push(eq(stockMovements.type, type))
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: stockMovements.id,
        productId: stockMovements.productId,
        productName: products.name,
        type: stockMovements.type,
        quantityChange: stockMovements.quantityChange,
        referenceId: stockMovements.referenceId,
        notes: stockMovements.notes,
        createdAt: stockMovements.createdAt,
      })
      .from(stockMovements)
      .leftJoin(products, eq(stockMovements.productId, products.id))
      .where(where)
      .orderBy(desc(stockMovements.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(stockMovements)
      .where(where),
  ])

  return c.json({
    data: rows,
    total: countResult[0]?.count ?? 0,
    page,
    limit,
  })
})
