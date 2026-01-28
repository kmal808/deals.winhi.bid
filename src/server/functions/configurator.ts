import { createServerFn } from '@tanstack/react-start'
import { serverOnly$ } from 'vite-env-only/macros'
import { getDb } from '@/lib/db'

// Load all pricing factors for the configurator
export const loadPricingFactors = createServerFn().handler(async () => {
  const db = await getDb()
  const {
    brands,
    frameTypes,
    frameColors,
    glassTypes,
    gridStyles,
    gridSizes,
    productConfigs,
  } = await serverOnly$(() => import('@/db/schema'))
  const { asc } = await serverOnly$(() => import('drizzle-orm'))

  const [
    brandsData,
    frameTypesData,
    frameColorsData,
    glassTypesData,
    gridStylesData,
    gridSizesData,
    productConfigsData,
  ] = await Promise.all([
    db.select().from(brands).orderBy(asc(brands.name)),
    db.select().from(frameTypes).orderBy(asc(frameTypes.name)),
    db.select().from(frameColors).orderBy(asc(frameColors.name)),
    db.select().from(glassTypes).orderBy(asc(glassTypes.name)),
    db.select().from(gridStyles).orderBy(asc(gridStyles.name)),
    db.select().from(gridSizes).orderBy(asc(gridSizes.size)),
    db.select().from(productConfigs).orderBy(asc(productConfigs.category), asc(productConfigs.name)),
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

// Save cart items to database
export const saveCartToWindows = createServerFn().handler(async (ctx: any) => {
  const { customerId, items, representativeId, role } = ctx?.data || {}
  const db = await getDb()
  const { windows, customers } = await serverOnly$(() => import('@/db/schema'))
  const { eq, asc } = await serverOnly$(() => import('drizzle-orm'))

  if (!customerId || !items?.length) {
    throw new Error('Customer ID and items are required')
  }

  // Verify customer access
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, customerId),
  })

  if (!customer) {
    throw new Error('Customer not found')
  }

  if (role === 'representative' && customer.representativeId !== representativeId) {
    throw new Error('Access denied')
  }

  // Get current max sort order
  const existingWindows = await db
    .select({ sortOrder: windows.sortOrder })
    .from(windows)
    .where(eq(windows.customerId, customerId))
    .orderBy(asc(windows.sortOrder))

  let nextSortOrder = existingWindows.length > 0
    ? Math.max(...existingWindows.map(w => w.sortOrder || 0)) + 1
    : 1

  // Insert each cart item
  const insertedWindows = []
  for (const item of items) {
    const [inserted] = await db
      .insert(windows)
      .values({
        customerId,
        location: item.location || `Item ${nextSortOrder}`,
        width: String(item.width),
        height: String(item.height),
        brandId: item.brandId,
        productConfigId: item.productConfigId,
        frameTypeId: item.frameTypeId,
        frameColorId: item.frameColorId,
        glassTypeId: item.glassTypeId,
        gridStyleId: item.noGrid ? null : item.gridStyleId,
        gridSizeId: item.noGrid ? null : item.gridSizeId,
        isDoor: item.category === 'door',
        calculatedPrice: String(item.calculatedPrice),
        sortOrder: nextSortOrder,
      })
      .returning()

    insertedWindows.push(inserted)
    nextSortOrder++
  }

  return insertedWindows
})
