import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { and, desc, eq, ilike, ne, or, sql } from "drizzle-orm"
import { z } from "zod"
import { db } from "../db.js"
import { getAdminSubject } from "../auth.js"
import { posAuditLog, productCategories, products } from "@workspace/db"
import { slugify } from "@workspace/shared"
import { ApiError, parseBooleanFlag, parseId } from "./admin-helpers.js"

export const adminProductsRoute = new Hono()

const createProductSchema = z.object({
  name: z.string().min(2).max(200),
  categoryId: z.number().int().positive(),
  description: z.string().max(2000).optional().default(""),
  priceGyd: z.number().int().min(0),
  sku: z.string().max(50).optional().nullable(),
  trackStock: z.boolean().optional().default(false),
  stockQty: z.number().int().min(0).optional().default(0),
  lowStockThreshold: z.number().int().min(0).optional().default(5),
  isActive: z.boolean().optional().default(true),
})

const updateProductSchema = createProductSchema.partial()

function normalizeSku(value?: string | null): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

async function ensureCategoryExists(categoryId: number): Promise<void> {
  const [category] = await db
    .select({ id: productCategories.id })
    .from(productCategories)
    .where(eq(productCategories.id, categoryId))
    .limit(1)

  if (!category) {
    throw new ApiError(400, "Category not found")
  }
}

async function buildUniqueProductSlug(name: string, excludeId?: number): Promise<string> {
  const baseSlug = slugify(name) || "product"
  let candidate = baseSlug
  let suffix = 2

  while (true) {
    const [existing] = await db
      .select({ id: products.id })
      .from(products)
      .where(
        excludeId
          ? and(eq(products.slug, candidate), ne(products.id, excludeId))
          : eq(products.slug, candidate)
      )
      .limit(1)

    if (!existing) return candidate
    candidate = `${baseSlug}-${suffix}`
    suffix += 1
  }
}

adminProductsRoute.get("/", async (c) => {
  const categoryIdQuery = c.req.query("categoryId")
  const active = parseBooleanFlag(c.req.query("active"))
  const search = c.req.query("search")?.trim()
  const page = Math.max(1, Number.parseInt(c.req.query("page") || "1", 10))
  const limit = Math.min(100, Number.parseInt(c.req.query("limit") || "20", 10))
  const offset = (page - 1) * limit
  const categoryId = categoryIdQuery ? parseId(categoryIdQuery, "categoryId") : undefined

  const conditions = []
  if (categoryId !== undefined) {
    conditions.push(eq(products.categoryId, categoryId))
  }
  if (active !== undefined) {
    conditions.push(eq(products.isActive, active))
  }
  if (search) {
    conditions.push(
      or(
        ilike(products.name, `%${search}%`),
        ilike(products.description, `%${search}%`),
        ilike(products.sku, `%${search}%`)
      )!
    )
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: products.id,
        categoryId: products.categoryId,
        categoryName: productCategories.name,
        categorySlug: productCategories.slug,
        name: products.name,
        slug: products.slug,
        description: products.description,
        priceGyd: products.priceGyd,
        sku: products.sku,
        trackStock: products.trackStock,
        stockQty: products.stockQty,
        lowStockThreshold: products.lowStockThreshold,
        isActive: products.isActive,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
      .where(where)
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(where),
  ])

  return c.json({
    data: rows,
    total: countResult[0]?.count ?? 0,
    page,
    limit,
  })
})

adminProductsRoute.get("/:id", async (c) => {
  const id = parseId(c.req.param("id"))
  const [product] = await db
    .select({
      id: products.id,
      categoryId: products.categoryId,
      categoryName: productCategories.name,
      categorySlug: productCategories.slug,
      name: products.name,
      slug: products.slug,
      description: products.description,
      priceGyd: products.priceGyd,
      sku: products.sku,
      trackStock: products.trackStock,
      stockQty: products.stockQty,
      lowStockThreshold: products.lowStockThreshold,
      isActive: products.isActive,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
    .where(eq(products.id, id))
    .limit(1)

  if (!product) {
    return c.json({ error: "Product not found" }, 404)
  }

  return c.json(product)
})

adminProductsRoute.post(
  "/",
  zValidator("json", createProductSchema),
  async (c) => {
    try {
      const payload = c.req.valid("json")
      await ensureCategoryExists(payload.categoryId)

      const slug = await buildUniqueProductSlug(payload.name)
      const [created] = await db
        .insert(products)
        .values({
          name: payload.name.trim(),
          slug,
          categoryId: payload.categoryId,
          description: payload.description.trim(),
          priceGyd: payload.priceGyd,
          sku: normalizeSku(payload.sku),
          trackStock: payload.trackStock,
          stockQty: payload.trackStock ? payload.stockQty : 0,
          lowStockThreshold: payload.lowStockThreshold,
          isActive: payload.isActive,
          updatedAt: new Date(),
        })
        .returning()

      return c.json(created, 201)
    } catch (error) {
      if (error instanceof ApiError) {
        return c.json({ error: error.message }, error.status as any)
      }
      throw error
    }
  }
)

adminProductsRoute.patch(
  "/:id",
  zValidator("json", updateProductSchema),
  async (c) => {
    try {
      const id = parseId(c.req.param("id"))
      const payload = c.req.valid("json")
      if (Object.keys(payload).length === 0) {
        throw new ApiError(400, "Nothing to update")
      }

      const [existing] = await db
        .select()
        .from(products)
        .where(eq(products.id, id))
        .limit(1)

      if (!existing) {
        throw new ApiError(404, "Product not found")
      }

      if (payload.categoryId !== undefined) {
        await ensureCategoryExists(payload.categoryId)
      }

      const updates: Partial<typeof existing> = {
        updatedAt: new Date(),
      }

      if (payload.name !== undefined) {
        updates.name = payload.name.trim()
        updates.slug = await buildUniqueProductSlug(payload.name, id)
      }
      if (payload.categoryId !== undefined) updates.categoryId = payload.categoryId
      if (payload.description !== undefined) updates.description = payload.description.trim()
      if (payload.priceGyd !== undefined) updates.priceGyd = payload.priceGyd
      if (payload.sku !== undefined) updates.sku = normalizeSku(payload.sku)
      if (payload.trackStock !== undefined) updates.trackStock = payload.trackStock
      if (payload.stockQty !== undefined) updates.stockQty = payload.stockQty
      if (payload.lowStockThreshold !== undefined) {
        updates.lowStockThreshold = payload.lowStockThreshold
      }
      if (payload.isActive !== undefined) updates.isActive = payload.isActive

      const [updated] = await db
        .update(products)
        .set(updates)
        .where(eq(products.id, id))
        .returning()

      const adminSubject = getAdminSubject(c)
      if (payload.priceGyd !== undefined && payload.priceGyd !== existing.priceGyd) {
        await db.insert(posAuditLog).values({
          action: "PRODUCT_PRICE_CHANGE",
          entityType: "product",
          entityId: updated.id,
          performedBy: adminSubject,
          metadata: {
            beforePriceGyd: existing.priceGyd,
            afterPriceGyd: updated.priceGyd,
          },
        })
      }

      if (existing.isActive && updated.isActive === false) {
        await db.insert(posAuditLog).values({
          action: "PRODUCT_DEACTIVATED",
          entityType: "product",
          entityId: updated.id,
          performedBy: adminSubject,
          metadata: {
            name: updated.name,
            previousState: existing.isActive,
            nextState: updated.isActive,
          },
        })
      }

      return c.json(updated)
    } catch (error) {
      if (error instanceof ApiError) {
        return c.json({ error: error.message }, error.status as any)
      }
      throw error
    }
  }
)

adminProductsRoute.delete("/:id", async (c) => {
  try {
    const id = parseId(c.req.param("id"))
    const [existing] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1)

    if (!existing) {
      throw new ApiError(404, "Product not found")
    }

    const [updated] = await db
      .update(products)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning()

    if (existing.isActive) {
      await db.insert(posAuditLog).values({
        action: "PRODUCT_DEACTIVATED",
        entityType: "product",
        entityId: updated.id,
        performedBy: getAdminSubject(c),
        metadata: {
          name: updated.name,
          previousState: existing.isActive,
          nextState: updated.isActive,
        },
      })
    }

    return c.json(updated)
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json({ error: error.message }, error.status as any)
    }
    throw error
  }
})
