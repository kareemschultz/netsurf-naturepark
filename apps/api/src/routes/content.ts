import { Hono } from "hono";
import { db } from "../db.js";
import { galleryPhotos, promoItems } from "@workspace/db";
import { eq, and, asc, inArray } from "drizzle-orm";

const contentRoute = new Hono();

// Public: Get active photos by category (comma-separated)
contentRoute.get("/photos", async (c) => {
  const categoryParam = c.req.query("category");

  let photos;
  if (categoryParam) {
    const categories = categoryParam.split(",").map((s) => s.trim());
    photos = await db
      .select()
      .from(galleryPhotos)
      .where(
        and(
          eq(galleryPhotos.isActive, true),
          inArray(galleryPhotos.category, categories)
        )
      )
      .orderBy(asc(galleryPhotos.sortOrder), asc(galleryPhotos.uploadedAt));
  } else {
    photos = await db
      .select()
      .from(galleryPhotos)
      .where(eq(galleryPhotos.isActive, true))
      .orderBy(asc(galleryPhotos.sortOrder), asc(galleryPhotos.uploadedAt));
  }

  return c.json(photos);
});

// Public: Get active promos
contentRoute.get("/promos", async (c) => {
  const promos = await db
    .select()
    .from(promoItems)
    .where(eq(promoItems.isActive, true))
    .orderBy(asc(promoItems.sortOrder), asc(promoItems.createdAt));
  return c.json(promos);
});

export { contentRoute };
