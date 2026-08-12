import { calculateUnitPrice } from '@/lib/pricing'

export interface UnitSelection {
  width: number | string
  height: number | string
  brandId?: number | null
  frameTypeId?: number | null
  frameColorId?: number | null
  glassTypeId?: number | null
  gridStyleId?: number | null
}

/**
 * Prices a unit from the factor tables rather than from whatever the client
 * says it costs. The configurator computes the same number locally for instant
 * feedback, but the figure that reaches the database is always this one.
 */
export async function computeUnitPrice(selection: UnitSelection): Promise<number> {
  const { getDb } = await import('@/lib/db')
  const { brands, frameTypes, frameColors, glassTypes, gridStyles } = await import('@/db/schema')
  const { eq } = await import('drizzle-orm')

  const db = await getDb()

  const [brand, frameType, frameColor, glassType, gridStyle] = await Promise.all([
    selection.brandId
      ? db.query.brands.findFirst({ where: eq(brands.id, selection.brandId) })
      : undefined,
    selection.frameTypeId
      ? db.query.frameTypes.findFirst({ where: eq(frameTypes.id, selection.frameTypeId) })
      : undefined,
    selection.frameColorId
      ? db.query.frameColors.findFirst({ where: eq(frameColors.id, selection.frameColorId) })
      : undefined,
    selection.glassTypeId
      ? db.query.glassTypes.findFirst({ where: eq(glassTypes.id, selection.glassTypeId) })
      : undefined,
    selection.gridStyleId
      ? db.query.gridStyles.findFirst({ where: eq(gridStyles.id, selection.gridStyleId) })
      : undefined,
  ])

  return calculateUnitPrice(selection.width, selection.height, {
    brand: brand?.factor,
    frameType: frameType?.factor,
    frameColor: frameColor?.factor,
    glassType: glassType?.factor,
    gridStyle: gridStyle?.factor,
  })
}
