import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { eq, asc, and } from "drizzle-orm"
import { unlink } from "node:fs/promises"
import { join } from "node:path"
import { db } from "../db.js"
import { galleryPhotos, promoItems } from "@workspace/db"
import { authorizeAdminRequest } from "../auth.js"
import { ApiError, parseId } from "./admin-helpers.js"

const UPLOADS_DIR = "/srv/uploads/gallery"
const PROMOS_DIR = "/srv/uploads/promos"

export const adminGalleryRoute = new Hono()

// ── Gallery Photos ────────────────────────────────────────────────────────────

adminGalleryRoute.get("/photos", async (c) => {
  const denied = authorizeAdminRequest(c, { gallery: ["view"] })
  if (denied) return denied

  const category = c.req.query("category")
  const conditions = category ? [eq(galleryPhotos.category, category)] : []

  const rows = await db
    .select()
    .from(galleryPhotos)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(galleryPhotos.sortOrder), asc(galleryPhotos.uploadedAt))

  return c.json({ data: rows })
})

adminGalleryRoute.post("/upload", async (c) => {
  const denied = authorizeAdminRequest(c, { gallery: ["manage"] })
  if (denied) return denied

  try {
    const formData = await c.req.formData()
    const file = formData.get("file") as File | null
    const altText = (formData.get("altText") as string) || ""
    const caption = (formData.get("caption") as string) || ""
    const category = (formData.get("category") as string) || "visitor"
    const uploaderName = (formData.get("uploaderName") as string) || ""

    if (!file || !(file instanceof File)) {
      return c.json({ error: "No file provided" }, 400)
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowed.includes(file.type)) {
      return c.json({ error: "Only JPEG, PNG, WebP, and GIF images are accepted" }, 400)
    }

    if (file.size > 10 * 1024 * 1024) {
      return c.json({ error: "File must be under 10 MB" }, 400)
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const filePath = join(UPLOADS_DIR, filename)

    await Bun.write(filePath, await file.arrayBuffer())

    const [created] = await db
      .insert(galleryPhotos)
      .values({ filename, originalName: file.name, altText, caption, category, uploaderName, sortOrder: 0 })
      .returning()

    return c.json(created, 201)
  } catch (error) {
    if (error instanceof ApiError) return c.json({ error: error.message }, error.status as any)
    throw error
  }
})

adminGalleryRoute.patch(
  "/photos/:id",
  zValidator(
    "json",
    z.object({
      altText: z.string().optional(),
      caption: z.string().optional(),
      category: z.string().optional(),
      isActive: z.boolean().optional(),
      sortOrder: z.number().int().optional(),
    })
  ),
  async (c) => {
    const denied = authorizeAdminRequest(c, { gallery: ["manage"] })
    if (denied) return denied

    try {
      const id = parseId(c.req.param("id"))
      const payload = c.req.valid("json")

      const [updated] = await db
        .update(galleryPhotos)
        .set(payload)
        .where(eq(galleryPhotos.id, id))
        .returning()

      if (!updated) return c.json({ error: "Photo not found" }, 404)
      return c.json(updated)
    } catch (error) {
      if (error instanceof ApiError) return c.json({ error: error.message }, error.status as any)
      throw error
    }
  }
)

adminGalleryRoute.delete("/photos/:id", async (c) => {
  const denied = authorizeAdminRequest(c, { gallery: ["manage"] })
  if (denied) return denied

  try {
    const id = parseId(c.req.param("id"))

    const [deleted] = await db
      .delete(galleryPhotos)
      .where(eq(galleryPhotos.id, id))
      .returning()

    if (!deleted) return c.json({ error: "Photo not found" }, 404)

    try { await unlink(join(UPLOADS_DIR, deleted.filename)) } catch {}

    return c.json({ ok: true })
  } catch (error) {
    if (error instanceof ApiError) return c.json({ error: error.message }, error.status as any)
    throw error
  }
})

// ── Promo Items ───────────────────────────────────────────────────────────────

adminGalleryRoute.get("/promos", async (c) => {
  const denied = authorizeAdminRequest(c, { gallery: ["view"] })
  if (denied) return denied

  const rows = await db
    .select()
    .from(promoItems)
    .orderBy(asc(promoItems.sortOrder), asc(promoItems.createdAt))

  return c.json({ data: rows })
})

adminGalleryRoute.post("/promos/upload", async (c) => {
  const denied = authorizeAdminRequest(c, { gallery: ["manage"] })
  if (denied) return denied

  try {
    const formData = await c.req.formData()
    const file = formData.get("file") as File | null
    const title = (formData.get("title") as string) || ""
    const subtitle = (formData.get("subtitle") as string) || ""
    const ctaText = (formData.get("ctaText") as string) || ""
    const ctaUrl = (formData.get("ctaUrl") as string) || ""

    if (!title) return c.json({ error: "Title is required" }, 400)

    let imageFilename = ""
    if (file && file instanceof File) {
      const allowed = ["image/jpeg", "image/png", "image/webp"]
      if (!allowed.includes(file.type)) {
        return c.json({ error: "Only JPEG, PNG, or WebP accepted" }, 400)
      }
      if (file.size > 10 * 1024 * 1024) {
        return c.json({ error: "File must be under 10 MB" }, 400)
      }
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
      imageFilename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      await Bun.write(join(PROMOS_DIR, imageFilename), await file.arrayBuffer())
    }

    const [created] = await db
      .insert(promoItems)
      .values({ title, subtitle, imageFilename, ctaText, ctaUrl })
      .returning()

    return c.json(created, 201)
  } catch (error) {
    if (error instanceof ApiError) return c.json({ error: error.message }, error.status as any)
    throw error
  }
})

adminGalleryRoute.patch(
  "/promos/:id",
  zValidator(
    "json",
    z.object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
      ctaText: z.string().optional(),
      ctaUrl: z.string().optional(),
      isActive: z.boolean().optional(),
      sortOrder: z.number().int().optional(),
    })
  ),
  async (c) => {
    const denied = authorizeAdminRequest(c, { gallery: ["manage"] })
    if (denied) return denied

    try {
      const id = parseId(c.req.param("id"))
      const payload = c.req.valid("json")

      const [updated] = await db
        .update(promoItems)
        .set(payload)
        .where(eq(promoItems.id, id))
        .returning()

      if (!updated) return c.json({ error: "Promo not found" }, 404)
      return c.json(updated)
    } catch (error) {
      if (error instanceof ApiError) return c.json({ error: error.message }, error.status as any)
      throw error
    }
  }
)

adminGalleryRoute.delete("/promos/:id", async (c) => {
  const denied = authorizeAdminRequest(c, { gallery: ["manage"] })
  if (denied) return denied

  try {
    const id = parseId(c.req.param("id"))

    const [deleted] = await db
      .delete(promoItems)
      .where(eq(promoItems.id, id))
      .returning()

    if (!deleted) return c.json({ error: "Promo not found" }, 404)

    try {
      if (deleted.imageFilename) await unlink(join(PROMOS_DIR, deleted.imageFilename))
    } catch {}

    return c.json({ ok: true })
  } catch (error) {
    if (error instanceof ApiError) return c.json({ error: error.message }, error.status as any)
    throw error
  }
})
