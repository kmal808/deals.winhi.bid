import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { adminMiddleware } from '@/server/middleware/auth'

/**
 * Configuration tables behind the /admin screens.
 *
 * Everything here is shared state that prices every quote in the system, so
 * every function — reads included — requires an admin session. These are plain
 * HTTP endpoints; hiding the nav link is not access control.
 */

const idInput = z.object({ id: z.number().int().positive() })
const name = z.string().trim().min(1, 'Name is required').max(100)
const factor = z.string().trim().regex(/^-?\d+(\.\d+)?$/, 'Factor must be a number')
const description = z.string().trim().max(5000).nullable().optional()
const imagePath = z.string().trim().max(255).nullable().optional()

/**
 * Factors are additive terms in `(width + height) × Σfactors`, not multipliers.
 * The brand carries the base rate; the rest are adjustments, so they default to
 * zero — a missing adjustment must not silently add a dollar per linear inch.
 */
const BRAND_DEFAULT_FACTOR = '1.0'
const ADJUSTMENT_DEFAULT_FACTOR = '0'

// ============= BRANDS =============
export const listBrands = createServerFn()
  .middleware([adminMiddleware])
  .handler(async () => {
    const { getDb } = await import('@/lib/db')
    const { brands } = await import('@/db/schema')
    const { asc } = await import('drizzle-orm')
    const db = await getDb()
    return await db.select().from(brands).orderBy(asc(brands.sortOrder), asc(brands.name))
  })

export const createBrand = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator(z.object({ name, factor: factor.optional(), parFactor: factor.optional() }))
  .handler(async ({ data }) => {
    const { getDb } = await import('@/lib/db')
    const { brands } = await import('@/db/schema')
    const db = await getDb()
    const [brand] = await db
      .insert(brands)
      .values({
        name: data.name,
        factor: data.factor ?? BRAND_DEFAULT_FACTOR,
        parFactor: data.parFactor ?? null,
      })
      .returning()
    return brand
  })

export const updateBrand = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator(
    z.object({
      id: z.number().int().positive(),
      name,
      factor: factor.optional(),
      parFactor: factor.optional(),
    })
  )
  .handler(async ({ data }) => {
    const { getDb } = await import('@/lib/db')
    const { brands } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    const db = await getDb()
    const [brand] = await db
      .update(brands)
      .set({
        name: data.name,
        ...(data.factor !== undefined ? { factor: data.factor } : {}),
        ...(data.parFactor !== undefined ? { parFactor: data.parFactor } : {}),
      })
      .where(eq(brands.id, data.id))
      .returning()
    return brand
  })

export const deleteBrand = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator(idInput)
  .handler(async ({ data }) => {
    const { getDb } = await import('@/lib/db')
    const { brands } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    const db = await getDb()
    await db.delete(brands).where(eq(brands.id, data.id))
    return { success: true as const }
  })

// ============= FRAME TYPES =============
export const listFrameTypes = createServerFn()
  .middleware([adminMiddleware])
  .handler(async () => {
    const { getDb } = await import('@/lib/db')
    const { frameTypes } = await import('@/db/schema')
    const { asc } = await import('drizzle-orm')
    const db = await getDb()
    return await db.select().from(frameTypes).orderBy(asc(frameTypes.sortOrder), asc(frameTypes.name))
  })

export const createFrameType = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator(z.object({ name, factor: factor.optional(), description }))
  .handler(async ({ data }) => {
    const { getDb } = await import('@/lib/db')
    const { frameTypes } = await import('@/db/schema')
    const db = await getDb()
    const [frameType] = await db
      .insert(frameTypes)
      .values({
        name: data.name,
        factor: data.factor ?? ADJUSTMENT_DEFAULT_FACTOR,
        description: data.description ?? null,
      })
      .returning()
    return frameType
  })

export const updateFrameType = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator(
    z.object({ id: z.number().int().positive(), name, factor: factor.optional(), description })
  )
  .handler(async ({ data }) => {
    const { getDb } = await import('@/lib/db')
    const { frameTypes } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    const db = await getDb()
    const [frameType] = await db
      .update(frameTypes)
      .set({
        name: data.name,
        ...(data.factor !== undefined ? { factor: data.factor } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
      })
      .where(eq(frameTypes.id, data.id))
      .returning()
    return frameType
  })

export const deleteFrameType = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator(idInput)
  .handler(async ({ data }) => {
    const { getDb } = await import('@/lib/db')
    const { frameTypes } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    const db = await getDb()
    await db.delete(frameTypes).where(eq(frameTypes.id, data.id))
    return { success: true as const }
  })

// ============= FRAME COLORS =============
const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Colour must be a hex value like #FFFFFF')

export const listFrameColors = createServerFn()
  .middleware([adminMiddleware])
  .handler(async () => {
    const { getDb } = await import('@/lib/db')
    const { frameColors } = await import('@/db/schema')
    const { asc } = await import('drizzle-orm')
    const db = await getDb()
    return await db
      .select()
      .from(frameColors)
      .orderBy(asc(frameColors.sortOrder), asc(frameColors.name))
  })

export const createFrameColor = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator(z.object({ name, hexColor: hexColor.optional(), factor: factor.optional() }))
  .handler(async ({ data }) => {
    const { getDb } = await import('@/lib/db')
    const { frameColors } = await import('@/db/schema')
    const db = await getDb()
    const [frameColor] = await db
      .insert(frameColors)
      .values({
        name: data.name,
        hexColor: data.hexColor ?? '#FFFFFF',
        factor: data.factor ?? ADJUSTMENT_DEFAULT_FACTOR,
      })
      .returning()
    return frameColor
  })

export const updateFrameColor = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator(
    z.object({
      id: z.number().int().positive(),
      name,
      hexColor: hexColor.optional(),
      factor: factor.optional(),
    })
  )
  .handler(async ({ data }) => {
    const { getDb } = await import('@/lib/db')
    const { frameColors } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    const db = await getDb()
    const [frameColor] = await db
      .update(frameColors)
      .set({
        name: data.name,
        ...(data.hexColor !== undefined ? { hexColor: data.hexColor } : {}),
        ...(data.factor !== undefined ? { factor: data.factor } : {}),
      })
      .where(eq(frameColors.id, data.id))
      .returning()
    return frameColor
  })

export const deleteFrameColor = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator(idInput)
  .handler(async ({ data }) => {
    const { getDb } = await import('@/lib/db')
    const { frameColors } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    const db = await getDb()
    await db.delete(frameColors).where(eq(frameColors.id, data.id))
    return { success: true as const }
  })

// ============= GLASS TYPES =============
export const listGlassTypes = createServerFn()
  .middleware([adminMiddleware])
  .handler(async () => {
    const { getDb } = await import('@/lib/db')
    const { glassTypes } = await import('@/db/schema')
    const { asc } = await import('drizzle-orm')
    const db = await getDb()
    return await db.select().from(glassTypes).orderBy(asc(glassTypes.sortOrder), asc(glassTypes.name))
  })

export const createGlassType = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator(z.object({ name, factor: factor.optional(), description, imagePath }))
  .handler(async ({ data }) => {
    const { getDb } = await import('@/lib/db')
    const { glassTypes } = await import('@/db/schema')
    const db = await getDb()
    const [glassType] = await db
      .insert(glassTypes)
      .values({
        name: data.name,
        factor: data.factor ?? ADJUSTMENT_DEFAULT_FACTOR,
        description: data.description ?? null,
        imagePath: data.imagePath ?? null,
      })
      .returning()
    return glassType
  })

export const updateGlassType = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator(
    z.object({
      id: z.number().int().positive(),
      name,
      factor: factor.optional(),
      description,
      imagePath,
    })
  )
  .handler(async ({ data }) => {
    const { getDb } = await import('@/lib/db')
    const { glassTypes } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    const db = await getDb()
    const [glassType] = await db
      .update(glassTypes)
      .set({
        name: data.name,
        ...(data.factor !== undefined ? { factor: data.factor } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.imagePath !== undefined ? { imagePath: data.imagePath } : {}),
      })
      .where(eq(glassTypes.id, data.id))
      .returning()
    return glassType
  })

export const deleteGlassType = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator(idInput)
  .handler(async ({ data }) => {
    const { getDb } = await import('@/lib/db')
    const { glassTypes } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    const db = await getDb()
    await db.delete(glassTypes).where(eq(glassTypes.id, data.id))
    return { success: true as const }
  })

// ============= GRID STYLES =============
export const listGridStyles = createServerFn()
  .middleware([adminMiddleware])
  .handler(async () => {
    const { getDb } = await import('@/lib/db')
    const { gridStyles } = await import('@/db/schema')
    const { asc } = await import('drizzle-orm')
    const db = await getDb()
    return await db.select().from(gridStyles).orderBy(asc(gridStyles.sortOrder), asc(gridStyles.name))
  })

export const createGridStyle = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator(z.object({ name, factor: factor.optional(), imagePath }))
  .handler(async ({ data }) => {
    const { getDb } = await import('@/lib/db')
    const { gridStyles } = await import('@/db/schema')
    const db = await getDb()
    const [gridStyle] = await db
      .insert(gridStyles)
      .values({
        name: data.name,
        factor: data.factor ?? ADJUSTMENT_DEFAULT_FACTOR,
        imagePath: data.imagePath ?? null,
      })
      .returning()
    return gridStyle
  })

export const updateGridStyle = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator(
    z.object({ id: z.number().int().positive(), name, factor: factor.optional(), imagePath })
  )
  .handler(async ({ data }) => {
    const { getDb } = await import('@/lib/db')
    const { gridStyles } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    const db = await getDb()
    const [gridStyle] = await db
      .update(gridStyles)
      .set({
        name: data.name,
        ...(data.factor !== undefined ? { factor: data.factor } : {}),
        ...(data.imagePath !== undefined ? { imagePath: data.imagePath } : {}),
      })
      .where(eq(gridStyles.id, data.id))
      .returning()
    return gridStyle
  })

export const deleteGridStyle = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator(idInput)
  .handler(async ({ data }) => {
    const { getDb } = await import('@/lib/db')
    const { gridStyles } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    const db = await getDb()
    await db.delete(gridStyles).where(eq(gridStyles.id, data.id))
    return { success: true as const }
  })

// ============= GRID SIZES =============
export const listGridSizes = createServerFn()
  .middleware([adminMiddleware])
  .handler(async () => {
    const { getDb } = await import('@/lib/db')
    const { gridSizes } = await import('@/db/schema')
    const { asc } = await import('drizzle-orm')
    const db = await getDb()
    return await db.select().from(gridSizes).orderBy(asc(gridSizes.sortOrder), asc(gridSizes.size))
  })

export const createGridSize = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator(z.object({ size: z.string().trim().min(1, 'Size is required').max(50) }))
  .handler(async ({ data }) => {
    const { getDb } = await import('@/lib/db')
    const { gridSizes } = await import('@/db/schema')
    const db = await getDb()
    const [gridSize] = await db.insert(gridSizes).values({ size: data.size }).returning()
    return gridSize
  })

export const updateGridSize = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator(
    z.object({
      id: z.number().int().positive(),
      size: z.string().trim().min(1, 'Size is required').max(50),
    })
  )
  .handler(async ({ data }) => {
    const { getDb } = await import('@/lib/db')
    const { gridSizes } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    const db = await getDb()
    const [gridSize] = await db
      .update(gridSizes)
      .set({ size: data.size })
      .where(eq(gridSizes.id, data.id))
      .returning()
    return gridSize
  })

export const deleteGridSize = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator(idInput)
  .handler(async ({ data }) => {
    const { getDb } = await import('@/lib/db')
    const { gridSizes } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    const db = await getDb()
    await db.delete(gridSizes).where(eq(gridSizes.id, data.id))
    return { success: true as const }
  })

// ============= PRODUCT CONFIGS =============
const productConfigFields = {
  name,
  category: z.enum(['window', 'door']),
  operationType: z.string().trim().max(50).nullable().optional(),
  liteCount: z.number().int().min(1).max(20).optional(),
  imagePath: z.string().trim().min(1, 'Image path is required').max(255),
  svgTemplate: z.string().nullable().optional(),
}

export const listProductConfigs = createServerFn()
  .middleware([adminMiddleware])
  .handler(async () => {
    const { getDb } = await import('@/lib/db')
    const { productConfigs } = await import('@/db/schema')
    const { asc } = await import('drizzle-orm')
    const db = await getDb()
    return await db
      .select()
      .from(productConfigs)
      .orderBy(asc(productConfigs.category), asc(productConfigs.sortOrder), asc(productConfigs.name))
  })

export const createProductConfig = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator(z.object(productConfigFields))
  .handler(async ({ data }) => {
    const { getDb } = await import('@/lib/db')
    const { productConfigs } = await import('@/db/schema')
    const db = await getDb()
    const [productConfig] = await db
      .insert(productConfigs)
      .values({
        name: data.name,
        category: data.category,
        operationType: data.operationType ?? null,
        liteCount: data.liteCount ?? 1,
        imagePath: data.imagePath,
        svgTemplate: data.svgTemplate ?? null,
      })
      .returning()
    return productConfig
  })

export const updateProductConfig = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator(z.object({ id: z.number().int().positive(), ...productConfigFields }))
  .handler(async ({ data }) => {
    const { getDb } = await import('@/lib/db')
    const { productConfigs } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    const db = await getDb()
    const [productConfig] = await db
      .update(productConfigs)
      .set({
        name: data.name,
        category: data.category,
        operationType: data.operationType ?? null,
        liteCount: data.liteCount ?? 1,
        imagePath: data.imagePath,
        svgTemplate: data.svgTemplate ?? null,
      })
      .where(eq(productConfigs.id, data.id))
      .returning()
    return productConfig
  })

export const deleteProductConfig = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator(idInput)
  .handler(async ({ data }) => {
    const { getDb } = await import('@/lib/db')
    const { productConfigs } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    const db = await getDb()
    await db.delete(productConfigs).where(eq(productConfigs.id, data.id))
    return { success: true as const }
  })

// ============= DISCLAIMERS =============
const disclaimerFields = {
  description: z.string().trim().min(1, 'Description is required').max(5000),
  sortOrder: z.number().int().min(0).optional(),
  includeByDefault: z.boolean().optional(),
}

export const listDisclaimers = createServerFn()
  .middleware([adminMiddleware])
  .handler(async () => {
    const { getDb } = await import('@/lib/db')
    const { disclaimers } = await import('@/db/schema')
    const { asc } = await import('drizzle-orm')
    const db = await getDb()
    return await db.select().from(disclaimers).orderBy(asc(disclaimers.sortOrder))
  })

export const createDisclaimer = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator(z.object(disclaimerFields))
  .handler(async ({ data }) => {
    const { getDb } = await import('@/lib/db')
    const { disclaimers } = await import('@/db/schema')
    const db = await getDb()
    const [disclaimer] = await db
      .insert(disclaimers)
      .values({
        description: data.description,
        sortOrder: data.sortOrder ?? 0,
        includeByDefault: data.includeByDefault ?? true,
      })
      .returning()
    return disclaimer
  })

export const updateDisclaimer = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator(z.object({ id: z.number().int().positive(), ...disclaimerFields }))
  .handler(async ({ data }) => {
    const { getDb } = await import('@/lib/db')
    const { disclaimers } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    const db = await getDb()
    const [disclaimer] = await db
      .update(disclaimers)
      .set({
        description: data.description,
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
        ...(data.includeByDefault !== undefined
          ? { includeByDefault: data.includeByDefault }
          : {}),
      })
      .where(eq(disclaimers.id, data.id))
      .returning()
    return disclaimer
  })

export const deleteDisclaimer = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator(idInput)
  .handler(async ({ data }) => {
    const { getDb } = await import('@/lib/db')
    const { disclaimers } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    const db = await getDb()
    await db.delete(disclaimers).where(eq(disclaimers.id, data.id))
    return { success: true as const }
  })
