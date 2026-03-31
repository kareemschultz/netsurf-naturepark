import { eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  beverageCatalogSource,
  beverageSeedCategories,
  beverageSeedProducts,
  productCategories,
  products,
  stockMovements,
} from "./index.js";

const shouldSyncStock = process.argv.includes("--sync-stock");

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client);

  try {
    const summary = await db.transaction(async (tx) => {
      for (const category of beverageSeedCategories) {
        await tx
          .insert(productCategories)
          .values({
            name: category.name,
            slug: category.slug,
            description: category.description,
            sortOrder: category.sortOrder,
            isActive: true,
          })
          .onConflictDoUpdate({
            target: productCategories.slug,
            set: {
              name: category.name,
              description: category.description,
              sortOrder: category.sortOrder,
              isActive: true,
            },
          });
      }

      const categoryRows = await tx
        .select({
          id: productCategories.id,
          name: productCategories.name,
        })
        .from(productCategories)
        .where(
          inArray(
            productCategories.slug,
            beverageSeedCategories.map((category) => category.slug)
          )
        );

      const categoryIdByName = new Map(categoryRows.map((row) => [row.name, row.id]));

      for (const item of beverageSeedProducts) {
        const categoryId = categoryIdByName.get(item.categoryName);

        if (!categoryId) {
          throw new Error(`Category missing for ${item.name}`);
        }

        await tx
          .insert(products)
          .values({
            categoryId,
            name: item.name,
            slug: item.slug,
            description: item.description,
            priceGyd: item.priceGyd,
            sku: item.sku,
            trackStock: true,
            stockQty: 0,
            lowStockThreshold: item.lowStockThreshold,
            isActive: true,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: products.slug,
            set: {
              categoryId,
              name: item.name,
              description: item.description,
              priceGyd: item.priceGyd,
              sku: item.sku,
              trackStock: true,
              lowStockThreshold: item.lowStockThreshold,
              isActive: true,
              updatedAt: new Date(),
            },
          });
      }

      const seededRows = await tx
        .select({
          id: products.id,
          slug: products.slug,
          stockQty: products.stockQty,
        })
        .from(products)
        .where(inArray(products.slug, beverageSeedProducts.map((item) => item.slug)));

      const movementRows =
        seededRows.length > 0
          ? await tx
              .select({
                productId: stockMovements.productId,
                movementCount: sql<number>`count(*)::int`,
              })
              .from(stockMovements)
              .where(inArray(stockMovements.productId, seededRows.map((row) => row.id)))
              .groupBy(stockMovements.productId)
          : [];

      const movementCountByProductId = new Map(
        movementRows.map((row) => [row.productId, row.movementCount])
      );
      const seedBySlug = new Map(beverageSeedProducts.map((item) => [item.slug, item]));

      let syncedStockCount = 0;
      let insertedOpeningMovements = 0;

      if (shouldSyncStock) {
        for (const row of seededRows) {
          const seed = seedBySlug.get(row.slug);
          if (!seed) continue;

          if ((movementCountByProductId.get(row.id) ?? 0) > 0) {
            continue;
          }

          if (row.stockQty !== seed.stockQty) {
            await tx
              .update(products)
              .set({
                stockQty: seed.stockQty,
                updatedAt: new Date(),
              })
              .where(eq(products.id, row.id));

            syncedStockCount += 1;
          }

          if (seed.stockQty > 0) {
            await tx.insert(stockMovements).values({
              productId: row.id,
              type: "seed_opening_stock",
              quantityChange: seed.stockQty,
              notes: `Seeded from ${beverageCatalogSource}`,
            });

            insertedOpeningMovements += 1;
          }
        }
      }

      return {
        categories: beverageSeedCategories.length,
        products: beverageSeedProducts.length,
        syncedStockCount,
        insertedOpeningMovements,
      };
    });

    console.log(
      JSON.stringify(
        {
          source: beverageCatalogSource,
          syncStock: shouldSyncStock,
          ...summary,
        },
        null,
        2
      )
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
