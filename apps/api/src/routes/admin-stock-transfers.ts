import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { and, desc, eq, inArray, sql } from "drizzle-orm"
import { z } from "zod"
import { db } from "../db.js"
import {
  products,
  stockMovements,
  stockTransferItems,
  stockTransfers,
} from "@workspace/db"
import {
  ApiError,
  buildNextDocumentNumber,
  getDateStamp,
  parseId,
} from "./admin-helpers.js"

export const adminStockTransfersRoute = new Hono()

const transferLineSchema = z.object({
  productId: z.number().int().positive(),
  qtyDispatched: z.number().int().positive(),
})

const createTransferSchema = z.object({
  dispatchedBy: z.string().min(2).max(200),
  notes: z.string().max(1000).optional().default(""),
  items: z.array(transferLineSchema).min(1),
})

const updateTransferSchema = z.object({
  dispatchedBy: z.string().min(2).max(200).optional(),
  notes: z.string().max(1000).optional(),
  items: z.array(transferLineSchema).min(1).optional(),
})

const receiveTransferSchema = z.object({
  receivedBy: z.string().min(2).max(200),
  items: z
    .array(
      z.object({
        id: z.number().int().positive(),
        qtyReceived: z.number().int().min(0),
        discrepancyNotes: z.string().max(1000).optional().default(""),
      })
    )
    .min(1),
})

async function generateTransferNumber(tx: any): Promise<string> {
  const prefix = `TXF-${getDateStamp()}-`
  const [lastTransfer] = await tx
    .select({ transferNumber: stockTransfers.transferNumber })
    .from(stockTransfers)
    .where(sql`${stockTransfers.transferNumber} like ${`${prefix}%`}`)
    .orderBy(desc(stockTransfers.transferNumber))
    .limit(1)

  return buildNextDocumentNumber(prefix, lastTransfer?.transferNumber)
}

async function assertTransferProducts(items: Array<{ productId: number }>) {
  const productIds = Array.from(new Set(items.map((item) => item.productId)))
  const rows = await db
    .select()
    .from(products)
    .where(inArray(products.id, productIds))

  if (rows.length !== productIds.length) {
    throw new ApiError(400, "One or more products no longer exist")
  }

  return new Map(rows.map((product) => [product.id, product]))
}

async function getTransferDetail(transferId: number) {
  const [transfer] = await db
    .select()
    .from(stockTransfers)
    .where(eq(stockTransfers.id, transferId))
    .limit(1)

  if (!transfer) {
    throw new ApiError(404, "Transfer not found")
  }

  const items = await db
    .select()
    .from(stockTransferItems)
    .where(eq(stockTransferItems.transferId, transferId))
    .orderBy(stockTransferItems.id)

  return { ...transfer, items }
}

adminStockTransfersRoute.get("/", async (c) => {
  const status = c.req.query("status")?.trim()
  const page = Math.max(1, Number.parseInt(c.req.query("page") || "1", 10))
  const limit = Math.min(100, Number.parseInt(c.req.query("limit") || "20", 10))
  const offset = (page - 1) * limit

  const where = status ? eq(stockTransfers.status, status) : undefined

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: stockTransfers.id,
        transferNumber: stockTransfers.transferNumber,
        status: stockTransfers.status,
        dispatchedBy: stockTransfers.dispatchedBy,
        dispatchedAt: stockTransfers.dispatchedAt,
        notes: stockTransfers.notes,
        receivedBy: stockTransfers.receivedBy,
        receivedAt: stockTransfers.receivedAt,
        createdAt: stockTransfers.createdAt,
        itemCount: sql<number>`count(${stockTransferItems.id})::int`,
        totalDispatchedQty: sql<number>`coalesce(sum(${stockTransferItems.qtyDispatched}), 0)::int`,
      })
      .from(stockTransfers)
      .leftJoin(stockTransferItems, eq(stockTransferItems.transferId, stockTransfers.id))
      .where(where)
      .groupBy(
        stockTransfers.id,
        stockTransfers.transferNumber,
        stockTransfers.status,
        stockTransfers.dispatchedBy,
        stockTransfers.dispatchedAt,
        stockTransfers.notes,
        stockTransfers.receivedBy,
        stockTransfers.receivedAt,
        stockTransfers.createdAt
      )
      .orderBy(desc(stockTransfers.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(stockTransfers)
      .where(where),
  ])

  return c.json({
    data: rows,
    total: countResult[0]?.count ?? 0,
    page,
    limit,
  })
})

adminStockTransfersRoute.get("/:id", async (c) => {
  try {
    const id = parseId(c.req.param("id"))
    return c.json(await getTransferDetail(id))
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json({ error: error.message }, error.status as any)
    }
    throw error
  }
})

adminStockTransfersRoute.post(
  "/",
  zValidator("json", createTransferSchema),
  async (c) => {
    try {
      const payload = c.req.valid("json")
      const productMap = await assertTransferProducts(payload.items)

      const created = await db.transaction(async (tx) => {
        const transferNumber = await generateTransferNumber(tx)
        const [transfer] = await tx
          .insert(stockTransfers)
          .values({
            transferNumber,
            status: "draft",
            dispatchedBy: payload.dispatchedBy.trim(),
            notes: payload.notes.trim(),
          })
          .returning()

        await tx.insert(stockTransferItems).values(
          payload.items.map((item) => ({
            transferId: transfer.id,
            productId: item.productId,
            productNameSnapshot: productMap.get(item.productId)?.name ?? "Unknown Product",
            qtyDispatched: item.qtyDispatched,
          }))
        )

        return transfer.id
      })

      return c.json(await getTransferDetail(created), 201)
    } catch (error) {
      if (error instanceof ApiError) {
        return c.json({ error: error.message }, error.status as any)
      }
      throw error
    }
  }
)

adminStockTransfersRoute.patch(
  "/:id",
  zValidator("json", updateTransferSchema),
  async (c) => {
    try {
      const id = parseId(c.req.param("id"))
      const payload = c.req.valid("json")
      if (Object.keys(payload).length === 0) {
        throw new ApiError(400, "Nothing to update")
      }

      const [transfer] = await db
        .select()
        .from(stockTransfers)
        .where(eq(stockTransfers.id, id))
        .limit(1)

      if (!transfer) {
        throw new ApiError(404, "Transfer not found")
      }
      if (transfer.status !== "draft") {
        throw new ApiError(409, "Only draft transfers can be edited")
      }

      const productMap = payload.items
        ? await assertTransferProducts(payload.items)
        : undefined

      await db.transaction(async (tx) => {
        if (payload.dispatchedBy !== undefined || payload.notes !== undefined) {
          await tx
            .update(stockTransfers)
            .set({
              dispatchedBy: payload.dispatchedBy?.trim() ?? transfer.dispatchedBy,
              notes: payload.notes?.trim() ?? transfer.notes,
            })
            .where(eq(stockTransfers.id, transfer.id))
        }

        if (payload.items) {
          await tx
            .delete(stockTransferItems)
            .where(eq(stockTransferItems.transferId, transfer.id))

          await tx.insert(stockTransferItems).values(
            payload.items.map((item) => ({
              transferId: transfer.id,
              productId: item.productId,
              productNameSnapshot: productMap?.get(item.productId)?.name ?? "Unknown Product",
              qtyDispatched: item.qtyDispatched,
            }))
          )
        }
      })

      return c.json(await getTransferDetail(id))
    } catch (error) {
      if (error instanceof ApiError) {
        return c.json({ error: error.message }, error.status as any)
      }
      throw error
    }
  }
)

adminStockTransfersRoute.post("/:id/dispatch", async (c) => {
  try {
    const id = parseId(c.req.param("id"))
    const [transfer] = await db
      .select()
      .from(stockTransfers)
      .where(eq(stockTransfers.id, id))
      .limit(1)

    if (!transfer) {
      throw new ApiError(404, "Transfer not found")
    }
    if (transfer.status !== "draft") {
      throw new ApiError(409, "Only draft transfers can be dispatched")
    }

    const [updated] = await db
      .update(stockTransfers)
      .set({
        status: "dispatched",
        dispatchedAt: new Date(),
      })
      .where(eq(stockTransfers.id, id))
      .returning()

    return c.json(updated)
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json({ error: error.message }, error.status as any)
    }
    throw error
  }
})

adminStockTransfersRoute.post(
  "/:id/receive",
  zValidator("json", receiveTransferSchema),
  async (c) => {
    try {
      const id = parseId(c.req.param("id"))
      const payload = c.req.valid("json")

      await db.transaction(async (tx) => {
        const [transfer] = await tx
          .select()
          .from(stockTransfers)
          .where(eq(stockTransfers.id, id))
          .limit(1)

        if (!transfer) {
          throw new ApiError(404, "Transfer not found")
        }
        if (transfer.status !== "dispatched") {
          throw new ApiError(409, "Only dispatched transfers can be received")
        }

        const existingItems = await tx
          .select()
          .from(stockTransferItems)
          .where(eq(stockTransferItems.transferId, transfer.id))
          .orderBy(stockTransferItems.id)

        if (existingItems.length !== payload.items.length) {
          throw new ApiError(400, "All transfer items must be verified")
        }

        const payloadMap = new Map(payload.items.map((item) => [item.id, item]))
        const productIds = existingItems.map((item) => item.productId)
        const productRows = productIds.length
          ? await tx
              .select()
              .from(products)
              .where(inArray(products.id, productIds))
          : []
        const productMap = new Map(productRows.map((product) => [product.id, product]))

        let hasDiscrepancy = false
        for (const existingItem of existingItems) {
          const receivedItem = payloadMap.get(existingItem.id)
          if (!receivedItem) {
            throw new ApiError(400, "Receipt payload does not match transfer items")
          }
          if (receivedItem.qtyReceived > existingItem.qtyDispatched) {
            throw new ApiError(
              400,
              `Received quantity for ${existingItem.productNameSnapshot} exceeds the dispatched quantity`
            )
          }

          const product = productMap.get(existingItem.productId)
          if (!product) {
            throw new ApiError(400, `${existingItem.productNameSnapshot} no longer exists`)
          }

          hasDiscrepancy ||= receivedItem.qtyReceived !== existingItem.qtyDispatched

          await tx
            .update(stockTransferItems)
            .set({
              qtyReceived: receivedItem.qtyReceived,
              discrepancyNotes: receivedItem.discrepancyNotes.trim(),
            })
            .where(eq(stockTransferItems.id, existingItem.id))

          if (receivedItem.qtyReceived > 0) {
            await tx
              .update(products)
              .set({
                stockQty: product.stockQty + receivedItem.qtyReceived,
                updatedAt: new Date(),
              })
              .where(eq(products.id, product.id))

            await tx.insert(stockMovements).values({
              productId: product.id,
              type: "transfer_in",
              quantityChange: receivedItem.qtyReceived,
              referenceId: existingItem.id,
              notes: `Transfer ${transfer.transferNumber}`,
            })
          }
        }

        await tx
          .update(stockTransfers)
          .set({
            status: hasDiscrepancy ? "partial" : "received",
            receivedBy: payload.receivedBy.trim(),
            receivedAt: new Date(),
          })
          .where(eq(stockTransfers.id, transfer.id))
      })

      return c.json(await getTransferDetail(id))
    } catch (error) {
      if (error instanceof ApiError) {
        return c.json({ error: error.message }, error.status as any)
      }
      throw error
    }
  }
)
