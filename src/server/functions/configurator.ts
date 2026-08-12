import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { authMiddleware } from '@/server/middleware/auth'

// Load all pricing factors for the configurator
export const loadPricingFactors = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const { getDb } = await import('@/lib/db')
    const {
      brands,
      frameTypes,
      frameColors,
      glassTypes,
      gridStyles,
      gridSizes,
      productConfigs,
    } = await import('@/db/schema')
    const { asc, eq } = await import('drizzle-orm')

    const db = await getDb()

    // Only active options are offered in the wizard; deactivating a brand should
    // stop new quotes using it without disturbing quotes that already reference it.
    const [
      brandsData,
      frameTypesData,
      frameColorsData,
      glassTypesData,
      gridStylesData,
      gridSizesData,
      productConfigsData,
    ] = await Promise.all([
      db.select().from(brands).where(eq(brands.active, true)).orderBy(asc(brands.sortOrder), asc(brands.name)),
      db.select().from(frameTypes).where(eq(frameTypes.active, true)).orderBy(asc(frameTypes.sortOrder), asc(frameTypes.name)),
      db.select().from(frameColors).where(eq(frameColors.active, true)).orderBy(asc(frameColors.sortOrder), asc(frameColors.name)),
      db.select().from(glassTypes).where(eq(glassTypes.active, true)).orderBy(asc(glassTypes.sortOrder), asc(glassTypes.name)),
      db.select().from(gridStyles).where(eq(gridStyles.active, true)).orderBy(asc(gridStyles.sortOrder), asc(gridStyles.name)),
      db.select().from(gridSizes).where(eq(gridSizes.active, true)).orderBy(asc(gridSizes.sortOrder), asc(gridSizes.size)),
      db
        .select()
        .from(productConfigs)
        .where(eq(productConfigs.active, true))
        .orderBy(asc(productConfigs.category), asc(productConfigs.sortOrder), asc(productConfigs.name)),
    ])

    return {
      brands: brandsData,
      frameTypes: frameTypesData,
      frameColors: frameColorsData,
      glassTypes: glassTypesData,
      gridStyles: gridStylesData,
      gridSizes: gridSizesData,
      productConfigs: productConfigsData,
    }
  })

const cartItem = z.object({
  location: z.string().trim().max(255).optional(),
  category: z.enum(['window', 'door']).optional(),
  width: z.union([z.string(), z.number()]),
  height: z.union([z.string(), z.number()]),
  brandId: z.number().int().positive().nullable().optional(),
  productConfigId: z.number().int().positive().nullable().optional(),
  frameTypeId: z.number().int().positive().nullable().optional(),
  frameColorId: z.number().int().positive().nullable().optional(),
  glassTypeId: z.number().int().positive().nullable().optional(),
  gridStyleId: z.number().int().positive().nullable().optional(),
  gridSizeId: z.number().int().positive().nullable().optional(),
  noGrid: z.boolean().optional(),
  // The section tree is structural, not priced, so it is stored as given rather
  // than re-derived. Shape is validated loosely on purpose: adding a sash type
  // must not reject carts saved by an older client.
  design: z.unknown().nullable().optional(),
})

// Save cart items to database
export const saveCartToWindows = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      customerId: z.number().int().positive(),
      items: z.array(cartItem).min(1, 'Cart is empty'),
    })
  )
  .handler(async ({ data, context }) => {
    const { assertCustomerAccess } = await import('@/server/access')
    const { computeUnitPrice } = await import('@/server/pricing')
    const { getDb } = await import('@/lib/db')
    const { windows } = await import('@/db/schema')
    const { eq, max } = await import('drizzle-orm')

    await assertCustomerAccess(data.customerId, context.session)

    const db = await getDb()

    const [{ highest }] = await db
      .select({ highest: max(windows.sortOrder) })
      .from(windows)
      .where(eq(windows.customerId, data.customerId))

    let nextSortOrder = (highest ?? 0) + 1

    const rows = []
    for (const item of data.items) {
      const gridStyleId = item.noGrid ? null : (item.gridStyleId ?? null)

      // Priced here, not in the browser — the cart lives in localStorage and is
      // fully editable by the user.
      const calculatedPrice = await computeUnitPrice({
        width: item.width,
        height: item.height,
        isDoor: item.category === 'door',
        brandId: item.brandId,
        frameTypeId: item.frameTypeId,
        frameColorId: item.frameColorId,
        glassTypeId: item.glassTypeId,
        gridStyleId,
      })

      rows.push({
        customerId: data.customerId,
        location: item.location?.trim() || `Item ${nextSortOrder}`,
        width: String(item.width),
        height: String(item.height),
        brandId: item.brandId ?? null,
        productConfigId: item.productConfigId ?? null,
        frameTypeId: item.frameTypeId ?? null,
        frameColorId: item.frameColorId ?? null,
        glassTypeId: item.glassTypeId ?? null,
        gridStyleId,
        gridSizeId: item.noGrid ? null : (item.gridSizeId ?? null),
        isDoor: item.category === 'door',
        design: (item.design as never) ?? null,
        calculatedPrice: calculatedPrice === null ? null : String(calculatedPrice),
        sortOrder: nextSortOrder++,
      })
    }

    return await db.insert(windows).values(rows).returning()
  })
