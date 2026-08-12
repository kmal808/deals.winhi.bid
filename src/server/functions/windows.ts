import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { authMiddleware } from '@/server/middleware/auth'

const optionalId = z.number().int().positive().nullable().optional()

// Get windows for a customer
export const getWindows = createServerFn()
  .middleware([authMiddleware])
  .inputValidator(z.object({ customerId: z.number().int().positive() }))
  .handler(async ({ data, context }) => {
    const { assertCustomerAccess } = await import('@/server/access')
    const { getDb } = await import('@/lib/db')
    const { windows } = await import('@/db/schema')
    const { eq, asc } = await import('drizzle-orm')

    await assertCustomerAccess(data.customerId, context.session)

    const db = await getDb()
    return await db.query.windows.findMany({
      where: eq(windows.customerId, data.customerId),
      with: {
        brand: true,
        productConfig: true,
        frameType: true,
        frameColor: true,
        glassType: true,
        gridStyle: true,
        gridSize: true,
      },
      orderBy: [asc(windows.sortOrder)],
    })
  })

// Update a single window
export const updateWindow = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      windowId: z.number().int().positive(),
      data: z.object({
        location: z.string().trim().min(1).max(255).optional(),
        width: z.union([z.string(), z.number()]).optional(),
        height: z.union([z.string(), z.number()]).optional(),
        brandId: optionalId,
        productConfigId: optionalId,
        frameTypeId: optionalId,
        frameColorId: optionalId,
        glassTypeId: optionalId,
        gridStyleId: optionalId,
        gridSizeId: optionalId,
        // An explicit override entered by the rep. Null clears it and returns
        // the line to the calculated price.
        manualPrice: z.union([z.string(), z.number()]).nullable().optional(),
        specialInstructions: z.string().max(5000).nullable().optional(),
        sortOrder: z.number().int().optional(),
      }),
    })
  )
  .handler(async ({ data, context }) => {
    const { assertWindowAccess } = await import('@/server/access')
    const { computeUnitPrice } = await import('@/server/pricing')
    const { getDb } = await import('@/lib/db')
    const { windows } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')

    const existing = await assertWindowAccess(data.windowId, context.session)
    const fields = data.data

    const next = {
      location: fields.location ?? existing.location,
      width: fields.width !== undefined ? String(fields.width) : existing.width,
      height: fields.height !== undefined ? String(fields.height) : existing.height,
      brandId: fields.brandId !== undefined ? fields.brandId : existing.brandId,
      productConfigId:
        fields.productConfigId !== undefined ? fields.productConfigId : existing.productConfigId,
      frameTypeId: fields.frameTypeId !== undefined ? fields.frameTypeId : existing.frameTypeId,
      frameColorId: fields.frameColorId !== undefined ? fields.frameColorId : existing.frameColorId,
      glassTypeId: fields.glassTypeId !== undefined ? fields.glassTypeId : existing.glassTypeId,
      gridStyleId: fields.gridStyleId !== undefined ? fields.gridStyleId : existing.gridStyleId,
      gridSizeId: fields.gridSizeId !== undefined ? fields.gridSizeId : existing.gridSizeId,
    }

    /**
     * A saved line keeps the rate it was quoted at.
     *
     * Factors are edited as the market moves, so repricing on every save would
     * mean correcting a typo in a location silently reissued the line at
     * today's rates — which is exactly the trap that led the old app to keep
     * five spellings of one brand at five different factors rather than edit
     * the factor in place.
     *
     * Only a change that actually alters the unit re-prices it.
     */
    const PRICING_FIELDS = [
      'width',
      'height',
      'brandId',
      'frameTypeId',
      'frameColorId',
      'glassTypeId',
      'gridStyleId',
    ] as const
    const repriced = PRICING_FIELDS.some((key) => fields[key] !== undefined)

    const calculatedPrice = repriced
      ? await computeUnitPrice({ ...next, isDoor: existing.isDoor ?? false })
      : null

    const db = await getDb()
    const [updated] = await db
      .update(windows)
      .set({
        ...next,
        calculatedPrice: calculatedPrice === null ? existing.calculatedPrice : String(calculatedPrice),
        manualPrice:
          fields.manualPrice === undefined
            ? existing.manualPrice
            : fields.manualPrice === null || fields.manualPrice === ''
              ? null
              : String(fields.manualPrice),
        specialInstructions:
          fields.specialInstructions !== undefined
            ? fields.specialInstructions
            : existing.specialInstructions,
        sortOrder: fields.sortOrder ?? existing.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(windows.id, data.windowId))
      .returning()

    return updated
  })

// Delete a window
export const deleteWindow = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(z.object({ windowId: z.number().int().positive() }))
  .handler(async ({ data, context }) => {
    const { assertWindowAccess } = await import('@/server/access')
    const { getDb } = await import('@/lib/db')
    const { windows } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')

    await assertWindowAccess(data.windowId, context.session)

    const db = await getDb()
    await db.delete(windows).where(eq(windows.id, data.windowId))

    return { success: true as const }
  })

// Reorder windows
export const reorderWindows = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      customerId: z.number().int().positive(),
      windowIds: z.array(z.number().int().positive()).min(1),
    })
  )
  .handler(async ({ data, context }) => {
    const { assertCustomerAccess } = await import('@/server/access')
    const { getDb } = await import('@/lib/db')
    const { windows } = await import('@/db/schema')
    const { and, eq, inArray } = await import('drizzle-orm')

    await assertCustomerAccess(data.customerId, context.session)

    const db = await getDb()

    // Only reorder ids that actually belong to this customer, so a crafted
    // payload cannot renumber someone else's line items.
    const owned = await db
      .select({ id: windows.id })
      .from(windows)
      .where(and(eq(windows.customerId, data.customerId), inArray(windows.id, data.windowIds)))

    const ownedIds = new Set(owned.map((w) => w.id))
    const ordered = data.windowIds.filter((id) => ownedIds.has(id))

    await db.transaction(async (tx) => {
      for (let i = 0; i < ordered.length; i++) {
        await tx
          .update(windows)
          .set({ sortOrder: i + 1 })
          .where(eq(windows.id, ordered[i]))
      }
    })

    return { success: true as const }
  })
