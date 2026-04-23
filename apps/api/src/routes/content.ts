import { Hono } from "hono";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "../db.js";
import { galleryPhotos, promoItems } from "@workspace/db";

export const contentRoute = new Hono();

contentRoute.get("/photos", async (c) => {
  const categoryQuery = c.req.query("category");
  const categories = categoryQuery
    ? categoryQuery
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : [];

  const where =
    categories.length > 0
      ? and(eq(galleryPhotos.isActive, true), inArray(galleryPhotos.category, categories))
      : eq(galleryPhotos.isActive, true);

  const rows = await db
    .select()
    .from(galleryPhotos)
    .where(where)
    .orderBy(asc(galleryPhotos.sortOrder), asc(galleryPhotos.uploadedAt));

  return c.json({ data: rows });
});

contentRoute.get("/promos", async (c) => {
  const rows = await db
    .select()
    .from(promoItems)
    .where(eq(promoItems.isActive, true))
    .orderBy(asc(promoItems.sortOrder), asc(promoItems.createdAt));

  return c.json({ data: rows });
});
