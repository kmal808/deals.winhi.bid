import { createServerFn } from '@tanstack/react-start'
import { db } from '@/lib/db'
import { windows, customers } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'

// Get windows for a customer
export const getWindows = createServerFn().handler(async (ctx: any) => {
  const { customerId, representativeId, role } = ctx?.data || {}

  if (!customerId) {
    throw new Error('Customer ID is required')
  }

  // Check access
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, customerId),
  })

  if (!customer) {
    throw new Error('Customer not found')
  }

  if (role === 'representative' && customer.representativeId !== representativeId) {
    throw new Error('Access denied')
  }

  return await db.query.windows.findMany({
    where: eq(windows.customerId, customerId),
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
export const updateWindow = createServerFn().handler(async (ctx: any) => {
  const { windowId, data, representativeId, role } = ctx?.data || {}

  if (!windowId || !data) {
    throw new Error('Window ID and data are required')
  }

  // Get window and check access
  const window = await db.query.windows.findFirst({
    where: eq(windows.id, windowId),
    with: { customer: true },
  })

  if (!window) {
    throw new Error('Window not found')
  }

  if (role === 'representative' && window.customer.representativeId !== representativeId) {
    throw new Error('Access denied')
  }

  const [updated] = await db
    .update(windows)
    .set({
      location: data.location ?? window.location,
      width: data.width ?? window.width,
      height: data.height ?? window.height,
      brandId: data.brandId ?? window.brandId,
      productConfigId: data.productConfigId ?? window.productConfigId,
      frameTypeId: data.frameTypeId ?? window.frameTypeId,
      frameColorId: data.frameColorId ?? window.frameColorId,
      glassTypeId: data.glassTypeId ?? window.glassTypeId,
      gridStyleId: data.gridStyleId ?? window.gridStyleId,
      gridSizeId: data.gridSizeId ?? window.gridSizeId,
      calculatedPrice: data.calculatedPrice ?? window.calculatedPrice,
      manualPrice: data.manualPrice ?? window.manualPrice,
      specialInstructions: data.specialInstructions ?? window.specialInstructions,
      sortOrder: data.sortOrder ?? window.sortOrder,
      updatedAt: new Date(),
    })
    .where(eq(windows.id, windowId))
    .returning()

  return updated
})

// Delete a window
export const deleteWindow = createServerFn().handler(async (ctx: any) => {
  const { windowId, representativeId, role } = ctx?.data || {}

  if (!windowId) {
    throw new Error('Window ID is required')
  }

  // Get window and check access
  const window = await db.query.windows.findFirst({
    where: eq(windows.id, windowId),
    with: { customer: true },
  })

  if (!window) {
    throw new Error('Window not found')
  }

  if (role === 'representative' && window.customer.representativeId !== representativeId) {
    throw new Error('Access denied')
  }

  await db.delete(windows).where(eq(windows.id, windowId))

  return { success: true }
})

// Reorder windows
export const reorderWindows = createServerFn().handler(async (ctx: any) => {
  const { customerId, windowIds, representativeId, role } = ctx?.data || {}

  if (!customerId || !windowIds?.length) {
    throw new Error('Customer ID and window IDs are required')
  }

  // Check access
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, customerId),
  })

  if (!customer) {
    throw new Error('Customer not found')
  }

  if (role === 'representative' && customer.representativeId !== representativeId) {
    throw new Error('Access denied')
  }

  // Update sort order for each window
  for (let i = 0; i < windowIds.length; i++) {
    await db
      .update(windows)
      .set({ sortOrder: i + 1 })
      .where(eq(windows.id, windowIds[i]))
  }

  return { success: true }
})
