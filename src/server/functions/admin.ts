import { createServerFn } from '@tanstack/react-start'
import { db } from '@/lib/db'
import {
  brands,
  frameTypes,
  frameColors,
  glassTypes,
  gridStyles,
  gridSizes,
  productConfigs,
  disclaimers,
} from '@/db/schema'
import { eq, asc } from 'drizzle-orm'

// ============= BRANDS =============
export const listBrands = createServerFn().handler(async () => {
  return await db.select().from(brands).orderBy(asc(brands.name))
})

export const createBrand = createServerFn().handler(async (ctx: any) => {
  const { name, factor } = ctx?.data || {}
  if (!name?.trim()) throw new Error('Name is required')

  const [brand] = await db
    .insert(brands)
    .values({ name: name.trim(), factor: factor || '1.0' })
    .returning()
  return brand
})

export const updateBrand = createServerFn().handler(async (ctx: any) => {
  const { id, name, factor } = ctx?.data || {}
  if (!id) throw new Error('ID is required')

  const [brand] = await db
    .update(brands)
    .set({ name: name?.trim(), factor })
    .where(eq(brands.id, id))
    .returning()
  return brand
})

export const deleteBrand = createServerFn().handler(async (ctx: any) => {
  const { id } = ctx?.data || {}
  if (!id) throw new Error('ID is required')
  await db.delete(brands).where(eq(brands.id, id))
  return { success: true }
})

// ============= FRAME TYPES =============
export const listFrameTypes = createServerFn().handler(async () => {
  return await db.select().from(frameTypes).orderBy(asc(frameTypes.name))
})

export const createFrameType = createServerFn().handler(async (ctx: any) => {
  const { name, factor } = ctx?.data || {}
  if (!name?.trim()) throw new Error('Name is required')

  const [frameType] = await db
    .insert(frameTypes)
    .values({ name: name.trim(), factor: factor || '1.0' })
    .returning()
  return frameType
})

export const updateFrameType = createServerFn().handler(async (ctx: any) => {
  const { id, name, factor } = ctx?.data || {}
  if (!id) throw new Error('ID is required')

  const [frameType] = await db
    .update(frameTypes)
    .set({ name: name?.trim(), factor })
    .where(eq(frameTypes.id, id))
    .returning()
  return frameType
})

export const deleteFrameType = createServerFn().handler(async (ctx: any) => {
  const { id } = ctx?.data || {}
  if (!id) throw new Error('ID is required')
  await db.delete(frameTypes).where(eq(frameTypes.id, id))
  return { success: true }
})

// ============= FRAME COLORS =============
export const listFrameColors = createServerFn().handler(async () => {
  return await db.select().from(frameColors).orderBy(asc(frameColors.name))
})

export const createFrameColor = createServerFn().handler(async (ctx: any) => {
  const { name, hexColor, factor } = ctx?.data || {}
  if (!name?.trim()) throw new Error('Name is required')

  const [frameColor] = await db
    .insert(frameColors)
    .values({
      name: name.trim(),
      hexColor: hexColor || '#000000',
      factor: factor || '1.0'
    })
    .returning()
  return frameColor
})

export const updateFrameColor = createServerFn().handler(async (ctx: any) => {
  const { id, name, hexColor, factor } = ctx?.data || {}
  if (!id) throw new Error('ID is required')

  const [frameColor] = await db
    .update(frameColors)
    .set({ name: name?.trim(), hexColor, factor })
    .where(eq(frameColors.id, id))
    .returning()
  return frameColor
})

export const deleteFrameColor = createServerFn().handler(async (ctx: any) => {
  const { id } = ctx?.data || {}
  if (!id) throw new Error('ID is required')
  await db.delete(frameColors).where(eq(frameColors.id, id))
  return { success: true }
})

// ============= GLASS TYPES =============
export const listGlassTypes = createServerFn().handler(async () => {
  return await db.select().from(glassTypes).orderBy(asc(glassTypes.name))
})

export const createGlassType = createServerFn().handler(async (ctx: any) => {
  const { name, factor, imagePath } = ctx?.data || {}
  if (!name?.trim()) throw new Error('Name is required')

  const [glassType] = await db
    .insert(glassTypes)
    .values({
      name: name.trim(),
      factor: factor || '1.0',
      imagePath: imagePath || null,
    })
    .returning()
  return glassType
})

export const updateGlassType = createServerFn().handler(async (ctx: any) => {
  const { id, name, factor, imagePath } = ctx?.data || {}
  if (!id) throw new Error('ID is required')

  const [glassType] = await db
    .update(glassTypes)
    .set({ name: name?.trim(), factor, imagePath })
    .where(eq(glassTypes.id, id))
    .returning()
  return glassType
})

export const deleteGlassType = createServerFn().handler(async (ctx: any) => {
  const { id } = ctx?.data || {}
  if (!id) throw new Error('ID is required')
  await db.delete(glassTypes).where(eq(glassTypes.id, id))
  return { success: true }
})

// ============= GRID STYLES =============
export const listGridStyles = createServerFn().handler(async () => {
  return await db.select().from(gridStyles).orderBy(asc(gridStyles.name))
})

export const createGridStyle = createServerFn().handler(async (ctx: any) => {
  const { name, factor, imagePath } = ctx?.data || {}
  if (!name?.trim()) throw new Error('Name is required')

  const [gridStyle] = await db
    .insert(gridStyles)
    .values({
      name: name.trim(),
      factor: factor || '1.0',
      imagePath: imagePath || null,
    })
    .returning()
  return gridStyle
})

export const updateGridStyle = createServerFn().handler(async (ctx: any) => {
  const { id, name, factor, imagePath } = ctx?.data || {}
  if (!id) throw new Error('ID is required')

  const [gridStyle] = await db
    .update(gridStyles)
    .set({ name: name?.trim(), factor, imagePath })
    .where(eq(gridStyles.id, id))
    .returning()
  return gridStyle
})

export const deleteGridStyle = createServerFn().handler(async (ctx: any) => {
  const { id } = ctx?.data || {}
  if (!id) throw new Error('ID is required')
  await db.delete(gridStyles).where(eq(gridStyles.id, id))
  return { success: true }
})

// ============= GRID SIZES =============
export const listGridSizes = createServerFn().handler(async () => {
  return await db.select().from(gridSizes).orderBy(asc(gridSizes.size))
})

export const createGridSize = createServerFn().handler(async (ctx: any) => {
  const { size } = ctx?.data || {}
  if (!size?.trim()) throw new Error('Size is required')

  const [gridSize] = await db
    .insert(gridSizes)
    .values({ size: size.trim() })
    .returning()
  return gridSize
})

export const updateGridSize = createServerFn().handler(async (ctx: any) => {
  const { id, size } = ctx?.data || {}
  if (!id) throw new Error('ID is required')

  const [gridSize] = await db
    .update(gridSizes)
    .set({ size: size?.trim() })
    .where(eq(gridSizes.id, id))
    .returning()
  return gridSize
})

export const deleteGridSize = createServerFn().handler(async (ctx: any) => {
  const { id } = ctx?.data || {}
  if (!id) throw new Error('ID is required')
  await db.delete(gridSizes).where(eq(gridSizes.id, id))
  return { success: true }
})

// ============= PRODUCT CONFIGS =============
export const listProductConfigs = createServerFn().handler(async () => {
  return await db.select().from(productConfigs).orderBy(asc(productConfigs.category), asc(productConfigs.name))
})

export const createProductConfig = createServerFn().handler(async (ctx: any) => {
  const { name, category, operationType, liteCount, imagePath, svgTemplate } = ctx?.data || {}
  if (!name?.trim()) throw new Error('Name is required')
  if (!category?.trim()) throw new Error('Category is required')

  const [productConfig] = await db
    .insert(productConfigs)
    .values({
      name: name.trim(),
      category: category.trim(),
      operationType: operationType || null,
      liteCount: liteCount || 1,
      imagePath: imagePath || null,
      svgTemplate: svgTemplate || null,
    })
    .returning()
  return productConfig
})

export const updateProductConfig = createServerFn().handler(async (ctx: any) => {
  const { id, name, category, operationType, liteCount, imagePath, svgTemplate } = ctx?.data || {}
  if (!id) throw new Error('ID is required')

  const [productConfig] = await db
    .update(productConfigs)
    .set({
      name: name?.trim(),
      category: category?.trim(),
      operationType,
      liteCount,
      imagePath,
      svgTemplate,
    })
    .where(eq(productConfigs.id, id))
    .returning()
  return productConfig
})

export const deleteProductConfig = createServerFn().handler(async (ctx: any) => {
  const { id } = ctx?.data || {}
  if (!id) throw new Error('ID is required')
  await db.delete(productConfigs).where(eq(productConfigs.id, id))
  return { success: true }
})

// ============= DISCLAIMERS =============
export const listDisclaimers = createServerFn().handler(async () => {
  return await db.select().from(disclaimers).orderBy(asc(disclaimers.sortOrder))
})

export const createDisclaimer = createServerFn().handler(async (ctx: any) => {
  const { description, sortOrder, includeByDefault } = ctx?.data || {}
  if (!description?.trim()) throw new Error('Description is required')

  const [disclaimer] = await db
    .insert(disclaimers)
    .values({
      description: description.trim(),
      sortOrder: sortOrder || 0,
      includeByDefault: includeByDefault ?? true,
    })
    .returning()
  return disclaimer
})

export const updateDisclaimer = createServerFn().handler(async (ctx: any) => {
  const { id, description, sortOrder, includeByDefault } = ctx?.data || {}
  if (!id) throw new Error('ID is required')

  const [disclaimer] = await db
    .update(disclaimers)
    .set({
      description: description?.trim(),
      sortOrder,
      includeByDefault,
    })
    .where(eq(disclaimers.id, id))
    .returning()
  return disclaimer
})

export const deleteDisclaimer = createServerFn().handler(async (ctx: any) => {
  const { id } = ctx?.data || {}
  if (!id) throw new Error('ID is required')
  await db.delete(disclaimers).where(eq(disclaimers.id, id))
  return { success: true }
})
