import { createServerFn } from '@tanstack/react-start'
import { serverOnly$ } from 'vite-env-only/macros'
import { getDb } from '@/lib/db'

// List customers with optional search
export const listCustomers = createServerFn().handler(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async (ctx: any) => {
    const { search, representativeId, role } = ctx?.data || {}
    const db = await getDb()
    const { customers } = await serverOnly$(() => import('@/db/schema'))
    const { eq, like, or, desc, and } = await serverOnly$(() => import('drizzle-orm'))

    const conditions = []

    // Role-based filtering: representatives only see their own customers
    if (role === 'representative' && representativeId) {
      conditions.push(eq(customers.representativeId, representativeId))
    }

    // Search filter
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`
      conditions.push(
        or(
          like(customers.name, searchTerm),
          like(customers.address, searchTerm),
          like(customers.city, searchTerm),
          like(customers.zip, searchTerm)
        )
      )
    }

    const result = await db
      .select({
        id: customers.id,
        name: customers.name,
        address: customers.address,
        city: customers.city,
        state: customers.state,
        zip: customers.zip,
        phone: customers.phone,
        email: customers.email,
        createdAt: customers.createdAt,
        representativeId: customers.representativeId,
      })
      .from(customers)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(customers.createdAt))
      .limit(50)

    return result
  }
)

// Get single customer with windows and disclaimers
export const getCustomer = createServerFn().handler(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async (ctx: any) => {
    const { customerId, representativeId, role } = ctx?.data || {}
    const db = await getDb()
    const { customers } = await serverOnly$(() => import('@/db/schema'))
    const { eq } = await serverOnly$(() => import('drizzle-orm'))

    if (!customerId) {
      throw new Error('Customer ID is required')
    }

    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, customerId),
      with: {
        windows: {
          with: {
            brand: true,
            productConfig: true,
            frameType: true,
            frameColor: true,
            glassType: true,
            gridStyle: true,
            gridSize: true,
          },
          orderBy: (w, { asc }) => [asc(w.sortOrder)],
        },
        contractDisclaimers: {
          orderBy: (cd, { asc }) => [asc(cd.sortOrder)],
        },
        representative: true,
      },
    })

    if (!customer) {
      throw new Error('Customer not found')
    }

    // Check access for representatives
    if (role === 'representative' && customer.representativeId !== representativeId) {
      throw new Error('Access denied')
    }

    return customer
  }
)

// Create new customer
export const createCustomer = createServerFn().handler(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async (ctx: any) => {
    const { data, representativeId } = ctx?.data || {}
    const db = await getDb()
    const { customers, contractDisclaimers, disclaimers } = await serverOnly$(() => import('@/db/schema'))
    const { eq } = await serverOnly$(() => import('drizzle-orm'))

    if (!data || !representativeId) {
      throw new Error('Customer data and representative ID are required')
    }

    const { name, address, city, state, zip, phone, altPhone, email, comments } = data

    if (!name?.trim()) {
      throw new Error('Customer name is required')
    }

    // Insert customer
    const [newCustomer] = await db
      .insert(customers)
      .values({
        name: name.trim(),
        address: address?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || 'HI',
        zip: zip?.trim() || null,
        phone: phone?.trim() || null,
        altPhone: altPhone?.trim() || null,
        email: email?.trim() || null,
        comments: comments?.trim() || null,
        representativeId,
        discountPercent: '0',
      })
      .returning()

    // Copy default disclaimers
    const defaultDisclaimers = await db
      .select()
      .from(disclaimers)
      .where(eq(disclaimers.includeByDefault, true))

    if (defaultDisclaimers.length > 0) {
      await db.insert(contractDisclaimers).values(
        defaultDisclaimers.map((d) => ({
          customerId: newCustomer.id,
          description: d.description,
          sortOrder: d.sortOrder || 0,
        }))
      )
    }

    return newCustomer
  }
)

// Update customer
export const updateCustomer = createServerFn().handler(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async (ctx: any) => {
    const { customerId, data, representativeId, role } = ctx?.data || {}
    const db = await getDb()
    const { customers } = await serverOnly$(() => import('@/db/schema'))
    const { eq } = await serverOnly$(() => import('drizzle-orm'))

    if (!customerId || !data) {
      throw new Error('Customer ID and data are required')
    }

    // Check access
    const existing = await db.query.customers.findFirst({
      where: eq(customers.id, customerId),
    })

    if (!existing) {
      throw new Error('Customer not found')
    }

    if (role === 'representative' && existing.representativeId !== representativeId) {
      throw new Error('Access denied')
    }

    const {
      name,
      address,
      city,
      state,
      zip,
      phone,
      altPhone,
      email,
      comments,
      discountPercent,
      downPaymentAmount,
      estimateStartDate,
      estimateEndDate,
      noGrid,
      signatureSvg,
    } = data

    const [updated] = await db
      .update(customers)
      .set({
        name: name?.trim() || existing.name,
        address: address?.trim() ?? existing.address,
        city: city?.trim() ?? existing.city,
        state: state?.trim() ?? existing.state,
        zip: zip?.trim() ?? existing.zip,
        phone: phone?.trim() ?? existing.phone,
        altPhone: altPhone?.trim() ?? existing.altPhone,
        email: email?.trim() ?? existing.email,
        comments: comments?.trim() ?? existing.comments,
        discountPercent: discountPercent ?? existing.discountPercent,
        downPaymentAmount: downPaymentAmount ?? existing.downPaymentAmount,
        estimateStartDate: estimateStartDate ?? existing.estimateStartDate,
        estimateEndDate: estimateEndDate ?? existing.estimateEndDate,
        noGrid: noGrid ?? existing.noGrid,
        signatureSvg: signatureSvg ?? existing.signatureSvg,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customerId))
      .returning()

    return updated
  }
)

// Delete customer
export const deleteCustomer = createServerFn().handler(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async (ctx: any) => {
    const { customerId, representativeId, role } = ctx?.data || {}
    const db = await getDb()
    const { customers } = await serverOnly$(() => import('@/db/schema'))
    const { eq } = await serverOnly$(() => import('drizzle-orm'))

    if (!customerId) {
      throw new Error('Customer ID is required')
    }

    // Check access
    const existing = await db.query.customers.findFirst({
      where: eq(customers.id, customerId),
    })

    if (!existing) {
      throw new Error('Customer not found')
    }

    if (role === 'representative' && existing.representativeId !== representativeId) {
      throw new Error('Access denied')
    }

    // Delete customer (cascades to windows and disclaimers)
    await db.delete(customers).where(eq(customers.id, customerId))

    return { success: true }
  }
)
