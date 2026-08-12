import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { authMiddleware } from '@/server/middleware/auth'

const optionalText = z.string().trim().max(500).optional().nullable()

const customerFields = z.object({
  name: z.string().trim().min(1, 'Customer name is required').max(255),
  address: optionalText,
  city: optionalText,
  state: optionalText,
  zip: optionalText,
  phone: optionalText,
  altPhone: optionalText,
  email: z.union([z.literal(''), z.email()]).optional().nullable(),
  comments: z.string().trim().max(5000).optional().nullable(),
})

/** Blank strings from HTML forms mean "no value", not an empty value. */
function nullIfBlank(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

// List customers with optional search
export const listCustomers = createServerFn()
  .middleware([authMiddleware])
  .inputValidator(z.object({ search: z.string().optional() }).optional())
  .handler(async ({ data, context }) => {
    const { session } = context
    const { getDb } = await import('@/lib/db')
    const { customers } = await import('@/db/schema')
    const { eq, ilike, or, desc, and } = await import('drizzle-orm')

    const db = await getDb()
    const conditions = []

    // Representatives only see their own customers; admins see everything.
    if (session.role !== 'admin') {
      conditions.push(eq(customers.representativeId, session.userId))
    }

    const search = data?.search?.trim()
    if (search) {
      const searchTerm = `%${search}%`
      conditions.push(
        or(
          ilike(customers.name, searchTerm),
          ilike(customers.address, searchTerm),
          ilike(customers.city, searchTerm),
          ilike(customers.zip, searchTerm)
        )
      )
    }

    return await db
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
  })

// Get single customer with windows and disclaimers
export const getCustomer = createServerFn()
  .middleware([authMiddleware])
  .inputValidator(z.object({ customerId: z.number().int().positive() }))
  .handler(async ({ data, context }) => {
    const { assertCustomerAccess } = await import('@/server/access')
    const { getDb } = await import('@/lib/db')
    const { customers } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')

    await assertCustomerAccess(data.customerId, context.session)

    const db = await getDb()
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, data.customerId),
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

    return customer
  })

// Create new customer
export const createCustomer = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(z.object({ data: customerFields }))
  .handler(async ({ data, context }) => {
    const { getDb } = await import('@/lib/db')
    const { customers, contractDisclaimers, disclaimers } = await import('@/db/schema')
    const { eq, asc } = await import('drizzle-orm')

    const db = await getDb()
    const fields = data.data

    // The customer belongs to whoever is signed in — never to a client-supplied id.
    const [newCustomer] = await db
      .insert(customers)
      .values({
        name: fields.name.trim(),
        address: nullIfBlank(fields.address),
        city: nullIfBlank(fields.city),
        state: nullIfBlank(fields.state) ?? 'HI',
        zip: nullIfBlank(fields.zip),
        phone: nullIfBlank(fields.phone),
        altPhone: nullIfBlank(fields.altPhone),
        email: nullIfBlank(fields.email),
        comments: nullIfBlank(fields.comments),
        representativeId: context.session.userId,
        discountPercent: '0',
      })
      .returning()

    // Snapshot the default disclaimers onto the contract so later edits to the
    // global templates do not rewrite contracts that already went out.
    const defaultDisclaimers = await db
      .select()
      .from(disclaimers)
      .where(eq(disclaimers.includeByDefault, true))
      .orderBy(asc(disclaimers.sortOrder))

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
  })

const customerUpdateFields = customerFields.partial().extend({
  discountPercent: z.union([z.string(), z.number()]).optional().nullable(),
  downPaymentAmount: z.union([z.string(), z.number()]).optional().nullable(),
  estimateStartDate: z.string().optional().nullable(),
  estimateEndDate: z.string().optional().nullable(),
  noGrid: z.boolean().optional(),
  customTerms: z.string().max(5000).optional().nullable(),
  signatureSvg: z.string().optional().nullable(),
})

// Update customer
export const updateCustomer = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      customerId: z.number().int().positive(),
      data: customerUpdateFields,
    })
  )
  .handler(async ({ data, context }) => {
    const { assertCustomerAccess } = await import('@/server/access')
    const { getDb } = await import('@/lib/db')
    const { customers } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')

    const existing = await assertCustomerAccess(data.customerId, context.session)

    const db = await getDb()
    const fields = data.data

    const [updated] = await db
      .update(customers)
      .set({
        name: fields.name?.trim() || existing.name,
        address: fields.address !== undefined ? nullIfBlank(fields.address) : existing.address,
        city: fields.city !== undefined ? nullIfBlank(fields.city) : existing.city,
        state: fields.state !== undefined ? nullIfBlank(fields.state) : existing.state,
        zip: fields.zip !== undefined ? nullIfBlank(fields.zip) : existing.zip,
        phone: fields.phone !== undefined ? nullIfBlank(fields.phone) : existing.phone,
        altPhone: fields.altPhone !== undefined ? nullIfBlank(fields.altPhone) : existing.altPhone,
        email: fields.email !== undefined ? nullIfBlank(fields.email) : existing.email,
        comments: fields.comments !== undefined ? nullIfBlank(fields.comments) : existing.comments,
        discountPercent:
          fields.discountPercent !== undefined && fields.discountPercent !== null
            ? String(fields.discountPercent)
            : existing.discountPercent,
        downPaymentAmount:
          fields.downPaymentAmount !== undefined && fields.downPaymentAmount !== null
            ? String(fields.downPaymentAmount)
            : existing.downPaymentAmount,
        estimateStartDate: fields.estimateStartDate ?? existing.estimateStartDate,
        estimateEndDate: fields.estimateEndDate ?? existing.estimateEndDate,
        noGrid: fields.noGrid ?? existing.noGrid,
        customTerms:
          fields.customTerms !== undefined ? nullIfBlank(fields.customTerms) : existing.customTerms,
        signatureSvg: fields.signatureSvg ?? existing.signatureSvg,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, data.customerId))
      .returning()

    return updated
  })

// Delete customer
export const deleteCustomer = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(z.object({ customerId: z.number().int().positive() }))
  .handler(async ({ data, context }) => {
    const { assertCustomerAccess } = await import('@/server/access')
    const { getDb } = await import('@/lib/db')
    const { customers } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')

    await assertCustomerAccess(data.customerId, context.session)

    const db = await getDb()
    // Cascades to windows and contract disclaimers.
    await db.delete(customers).where(eq(customers.id, data.customerId))

    return { success: true as const }
  })
