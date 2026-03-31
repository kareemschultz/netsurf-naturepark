import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { and, asc, eq, ne, sql } from "drizzle-orm"
import { z } from "zod"
import { db } from "../db.js"
import { productCategories, products } from "@workspace/db"
import { slugify } from "@workspace/shared"
import { ApiError, parseBooleanFlag, parseId } from "./admin-helpers.js"

export const adminCategoriesRoute = new Hono()

const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(1000).optional().default(""),
  sortOrder: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
})

const updateCategorySchema = createCategorySchema.partial()

async function buildUniqueCategorySlug(name: string, excludeId?: number): Promise<string> {
  const baseSlug = slugify(name) || "category"
  let candidate = baseSlug
  let suffix = 2

  while (true) {
    const [existing] = await db
      .select({ id: productCategories.id })
      .from(productCategories)
      .where(
        excludeId
          ? and(eq(productCategories.slug, candidate), ne(productCategories.id, excludeId))
          : eq(productCategories.slug, candidate)
      )
      .limit(1)

    if (!existing) return candidate
    candidate = `${baseSlug}-${suffix}`
    suffix += 1
  }
}

adminCategoriesRoute.get("/", async (c) => {
  const active = parseBooleanFlag(c.req.query("active"))
  const conditions = []
  if (active !== undefined) {
    conditions.push(eq(productCategories.isActive, active))
  }

  const rows = await db
    .select({
      id: productCategories.id,
      name: productCategories.name,
      slug: productCategories.slug,
      description: productCategories.description,
      sortOrder: productCategories.sortOrder,
      isActive: productCategories.isActive,
      createdAt: productCategories.createdAt,
      productCount: sql<number>`count(${products.id})::int`,
    })
    .from(productCategories)
    .leftJoin(products, eq(products.categoryId, productCategories.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(
      productCategories.id,
      productCategories.name,
      productCategories.slug,
      productCategories.description,
      productCategories.sortOrder,
      productCategories.isActive,
      productCategories.createdAt
    )
    .orderBy(asc(productCategories.sortOrder), asc(productCategories.name))

  return c.json(rows)
})

adminCategoriesRoute.post(
  "/",
  zValidator("json", createCategorySchema),
  async (c) => {
    const payload = c.req.valid("json")
    const slug = await buildUniqueCategorySlug(payload.name)

    const [created] = await db
      .insert(productCategories)
      .values({
        name: payload.name.trim(),
        slug,
        description: payload.description.trim(),
        sortOrder: payload.sortOrder,
        isActive: payload.isActive,
      })
      .returning()

    return c.json(created, 201)
  }
)

adminCategoriesRoute.patch(
  "/:id",
  zValidator("json", updateCategorySchema),
  async (c) => {
    const id = parseId(c.req.param("id"))
    const payload = c.req.valid("json")
    if (Object.keys(payload).length === 0) {
      return c.json({ error: "Nothing to update" }, 400)
    }

    const [existing] = await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.id, id))
      .limit(1)

    if (!existing) {
      return c.json({ error: "Category not found" }, 404)
    }

    const updates: Partial<typeof existing> = {}
    if (payload.name !== undefined) {
      updates.name = payload.name.trim()
      updates.slug = await buildUniqueCategorySlug(payload.name, id)
    }
    if (payload.description !== undefined) {
      updates.description = payload.description.trim()
    }
    if (payload.sortOrder !== undefined) {
      updates.sortOrder = payload.sortOrder
    }
    if (payload.isActive !== undefined) {
      updates.isActive = payload.isActive
    }

    const [updated] = await db
      .update(productCategories)
      .set(updates)
      .where(eq(productCategories.id, id))
      .returning()

    return c.json(updated)
  }
)

adminCategoriesRoute.delete("/:id", async (c) => {
  try {
    const id = parseId(c.req.param("id"))
    const [category] = await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.id, id))
      .limit(1)

    if (!category) {
      throw new ApiError(404, "Category not found")
    }

    const [productCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(eq(products.categoryId, id))

    if ((productCount?.count ?? 0) > 0) {
      throw new ApiError(409, "Cannot delete a category that still has products")
    }

    await db.delete(productCategories).where(eq(productCategories.id, id))
    return c.json({ ok: true })
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json({ error: error.message }, error.status as any)
    }
    throw error
  }
})
