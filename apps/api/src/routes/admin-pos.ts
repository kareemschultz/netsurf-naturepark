import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm"
import { z } from "zod"
import { db } from "../db.js"
import { authorizeAdminRequest, getAdminSubject } from "../auth.js"
import {
  posAuditLog,
  productCategories,
  products,
  saleItems,
  salePayments,
  sales,
  stockMovements,
} from "@workspace/db"
import {
  paymentMethods,
  type PaymentMethod,
} from "@workspace/shared"
import {
  ApiError,
  buildNextDocumentNumber,
  getDateStamp,
  parseId,
} from "./admin-helpers.js"

export const adminPosRoute = new Hono()

const paymentMethodValues = paymentMethods.map(
  (method) => method.value
) as [PaymentMethod, ...PaymentMethod[]]
const paymentMethodSchema = z.enum(paymentMethodValues)

const saleSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  paymentMethod: paymentMethodSchema.default("cash"),
  paymentReference: z.string().max(200).optional().nullable(),
  discountGyd: z.number().int().min(0).optional().default(0),
  taxGyd: z.number().int().min(0).optional().default(0),
  notes: z.string().max(2000).optional().default(""),
})

const voidSaleSchema = z.object({
  reason: z.string().min(2).max(500),
})

async function generateSaleNumber(
  tx: any
): Promise<string> {
  const prefix = `S-${getDateStamp()}-`
  const [lastSale] = await tx
    .select({ saleNumber: sales.saleNumber })
    .from(sales)
    .where(sql`${sales.saleNumber} like ${`${prefix}%`}`)
    .orderBy(desc(sales.saleNumber))
    .limit(1)

  return buildNextDocumentNumber(prefix, lastSale?.saleNumber)
}

adminPosRoute.get("/products", async (c) => {
  const denied = authorizeAdminRequest(c, { pos: ["view"] })
  if (denied) return denied

  const rows = await db
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
    .where(eq(products.isActive, true))
    .orderBy(asc(productCategories.sortOrder), asc(products.name))

  return c.json(rows)
})

adminPosRoute.post("/sale", zValidator("json", saleSchema), async (c) => {
  try {
    const denied = authorizeAdminRequest(c, { pos: ["checkout"] })
    if (denied) return denied

    const payload = c.req.valid("json")
    const aggregatedItems = new Map<number, number>()
    for (const item of payload.items) {
      aggregatedItems.set(
        item.productId,
        (aggregatedItems.get(item.productId) ?? 0) + item.quantity
      )
    }

    const result = await db.transaction(async (tx) => {
      const productIds = Array.from(aggregatedItems.keys())
      const productRows = await tx
        .select()
        .from(products)
        .where(inArray(products.id, productIds))

      if (productRows.length !== productIds.length) {
        throw new ApiError(400, "One or more products no longer exist")
      }

      const productMap = new Map(productRows.map((product) => [product.id, product]))
      const normalizedItems = productIds.map((productId) => {
        const product = productMap.get(productId)
        if (!product) {
          throw new ApiError(400, "One or more products no longer exist")
        }
        if (!product.isActive) {
          throw new ApiError(400, `${product.name} is no longer active`)
        }

        const quantity = aggregatedItems.get(productId) ?? 0
        if (product.trackStock && product.stockQty < quantity) {
          throw new ApiError(409, `${product.name} is out of stock`)
        }

        return {
          product,
          quantity,
          lineTotalGyd: product.priceGyd * quantity,
        }
      })

      const subtotalGyd = normalizedItems.reduce(
        (sum, item) => sum + item.lineTotalGyd,
        0
      )
      const totalGyd = subtotalGyd - payload.discountGyd + payload.taxGyd
      if (totalGyd < 0) {
        throw new ApiError(400, "Total cannot be negative")
      }

      const saleNumber = await generateSaleNumber(tx)
      const itemsCount = normalizedItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      )

      const [sale] = await tx
        .insert(sales)
        .values({
          saleNumber,
          subtotalGyd,
          discountGyd: payload.discountGyd,
          taxGyd: payload.taxGyd,
          totalGyd,
          itemsCount,
          paymentMethod: payload.paymentMethod,
          notes: payload.notes.trim(),
        })
        .returning()

      const insertedItems = await tx
        .insert(saleItems)
        .values(
          normalizedItems.map((item) => ({
            saleId: sale.id,
            productId: item.product.id,
            productName: item.product.name,
            unitPriceGyd: item.product.priceGyd,
            quantity: item.quantity,
            lineTotalGyd: item.lineTotalGyd,
          }))
        )
        .returning()

      const [payment] = await tx
        .insert(salePayments)
        .values({
          saleId: sale.id,
          method: payload.paymentMethod,
          amountGyd: totalGyd,
          reference: payload.paymentReference?.trim() || null,
        })
        .returning()

      for (const item of normalizedItems) {
        if (!item.product.trackStock) continue

        await tx
          .update(products)
          .set({
            stockQty: item.product.stockQty - item.quantity,
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.product.id))

        await tx.insert(stockMovements).values({
          productId: item.product.id,
          type: "sale",
          quantityChange: -item.quantity,
          referenceId: sale.id,
          notes: `Sale ${sale.saleNumber}`,
        })
      }

      return { sale, items: insertedItems, payments: [payment] }
    })

    return c.json(result, 201)
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json({ error: error.message }, error.status as any)
    }
    throw error
  }
})

adminPosRoute.post(
  "/sale/:id/void",
  zValidator("json", voidSaleSchema),
  async (c) => {
    try {
      const denied = authorizeAdminRequest(c, { sales: ["void"] })
      if (denied) return denied

      const id = parseId(c.req.param("id"))
      const payload = c.req.valid("json")

      const result = await db.transaction(async (tx) => {
        const [sale] = await tx
          .select()
          .from(sales)
          .where(eq(sales.id, id))
          .limit(1)

        if (!sale) {
          throw new ApiError(404, "Sale not found")
        }
        if (sale.voided) {
          throw new ApiError(409, "Sale has already been voided")
        }

        const lineItems = await tx
          .select()
          .from(saleItems)
          .where(eq(saleItems.saleId, sale.id))

        const trackedProductIds = lineItems.map((item) => item.productId)
        const productRows = trackedProductIds.length
          ? await tx
              .select()
              .from(products)
              .where(inArray(products.id, trackedProductIds))
          : []
        const productMap = new Map(productRows.map((product) => [product.id, product]))

        for (const item of lineItems) {
          const product = productMap.get(item.productId)
          if (!product) {
            throw new ApiError(400, `${item.productName} can no longer be restored`)
          }
          if (!product.trackStock) continue

          await tx
            .update(products)
            .set({
              stockQty: product.stockQty + item.quantity,
              updatedAt: new Date(),
            })
            .where(eq(products.id, product.id))

          await tx.insert(stockMovements).values({
            productId: product.id,
            type: "void_reversal",
            quantityChange: item.quantity,
            referenceId: sale.id,
            notes: `Void ${sale.saleNumber}`,
          })
        }

        const [updatedSale] = await tx
          .update(sales)
          .set({
            voided: true,
            voidedAt: new Date(),
            voidReason: payload.reason.trim(),
          })
          .where(eq(sales.id, sale.id))
          .returning()

        await tx.insert(posAuditLog).values({
          action: "SALE_VOID",
          entityType: "sale",
          entityId: sale.id,
          performedBy: getAdminSubject(c),
          metadata: {
            saleNumber: sale.saleNumber,
            reason: payload.reason.trim(),
          },
        })

        return updatedSale
      })

      return c.json(result)
    } catch (error) {
      if (error instanceof ApiError) {
        return c.json({ error: error.message }, error.status as any)
      }
      throw error
    }
  }
)
