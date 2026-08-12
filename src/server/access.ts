import type { SessionData } from '@/server/session'

/**
 * Representatives may only reach their own customers; admins may reach any.
 * Every customer-scoped server function funnels through here so the rule lives
 * in exactly one place.
 *
 * Returns the customer row so callers do not have to load it twice.
 */
export async function assertCustomerAccess(customerId: number, session: SessionData) {
  const { getDb } = await import('@/lib/db')
  const { customers } = await import('@/db/schema')
  const { eq } = await import('drizzle-orm')

  const db = await getDb()
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, customerId),
  })

  if (!customer) {
    throw new Error('Customer not found')
  }

  if (session.role !== 'admin' && customer.representativeId !== session.userId) {
    // Deliberately the same message as a missing customer: a representative
    // should not be able to probe for the existence of other reps' customers.
    throw new Error('Customer not found')
  }

  return customer
}

/** Same rule, resolved from a window id via its parent customer. */
export async function assertWindowAccess(windowId: number, session: SessionData) {
  const { getDb } = await import('@/lib/db')
  const { windows } = await import('@/db/schema')
  const { eq } = await import('drizzle-orm')

  const db = await getDb()
  const row = await db.query.windows.findFirst({
    where: eq(windows.id, windowId),
    with: { customer: true },
  })

  if (!row) {
    throw new Error('Window not found')
  }

  if (session.role !== 'admin' && row.customer.representativeId !== session.userId) {
    throw new Error('Window not found')
  }

  return row
}
