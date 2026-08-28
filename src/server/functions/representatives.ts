import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { adminMiddleware } from '@/server/middleware/auth'

/**
 * Managing the people who use the app.
 *
 * Admin-only throughout. Accounts previously existed only as database rows,
 * which meant every new rep and every forgotten password was a SQL prompt.
 *
 * Password hashes are never returned to the client, and an admin cannot
 * deactivate or demote their own account — locking the last administrator out
 * of the tool that manages administrators has no in-app remedy.
 */

const name = z.string().trim().min(1, 'Name is required').max(255)
const username = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(100)
  .regex(/^[a-zA-Z0-9._-]+$/, 'Letters, numbers, dot, dash and underscore only')
const password = z.string().min(8, 'Password must be at least 8 characters').max(200)
const role = z.enum(['admin', 'representative'])
const optionalContact = z.string().trim().max(255).optional().nullable()

export const listRepresentatives = createServerFn()
  .middleware([adminMiddleware])
  .handler(async () => {
    const { getDb } = await import('@/lib/db')
    const { representatives, customers } = await import('@/db/schema')
    const { asc, sql } = await import('drizzle-orm')

    const db = await getDb()

    // Customer count comes along so an admin can see who would be affected
    // before deactivating someone.
    return await db
      .select({
        id: representatives.id,
        name: representatives.name,
        username: representatives.username,
        email: representatives.email,
        phone: representatives.phone,
        role: representatives.role,
        active: representatives.active,
        createdAt: representatives.createdAt,
        customerCount: sql<number>`(
          select count(*)::int from ${customers}
          where ${customers.representativeId} = ${representatives.id}
        )`,
      })
      .from(representatives)
      .orderBy(asc(representatives.name))
  })

export const createRepresentative = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator(
    z.object({
      name,
      username,
      password,
      role,
      email: optionalContact,
      phone: optionalContact,
    })
  )
  .handler(async ({ data }) => {
    const { getDb } = await import('@/lib/db')
    const { representatives } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    const { default: bcrypt } = await import('bcryptjs')

    const db = await getDb()

    const taken = await db
      .select({ id: representatives.id })
      .from(representatives)
      .where(eq(representatives.username, data.username))
      .limit(1)
    if (taken.length > 0) {
      throw new Error(`The username "${data.username}" is already taken`)
    }

    const [created] = await db
      .insert(representatives)
      .values({
        name: data.name,
        username: data.username,
        passwordHash: await bcrypt.hash(data.password, 10),
        role: data.role,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        active: true,
      })
      .returning({ id: representatives.id, username: representatives.username })

    return created
  })

export const updateRepresentative = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator(
    z.object({
      representativeId: z.number().int().positive(),
      name,
      role,
      active: z.boolean(),
      email: optionalContact,
      phone: optionalContact,
    })
  )
  .handler(async ({ data, context }) => {
    const { getDb } = await import('@/lib/db')
    const { representatives } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')

    // Guard against an admin removing their own access; there is no way back
    // in from the UI once the last admin is locked out.
    if (data.representativeId === context.session.userId) {
      if (!data.active) throw new Error('You cannot deactivate your own account')
      if (data.role !== 'admin') throw new Error('You cannot remove your own admin access')
    }

    const db = await getDb()
    const [updated] = await db
      .update(representatives)
      .set({
        name: data.name,
        role: data.role,
        active: data.active,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(representatives.id, data.representativeId))
      .returning({ id: representatives.id })

    // Signing a deactivated account out immediately, rather than letting an
    // existing session run until it expires.
    if (!data.active) {
      const { destroySessionsForRepresentative } = await import('@/server/session')
      await destroySessionsForRepresentative(data.representativeId)
    }

    return updated
  })

export const resetRepresentativePassword = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator(z.object({ representativeId: z.number().int().positive(), password }))
  .handler(async ({ data }) => {
    const { getDb } = await import('@/lib/db')
    const { representatives } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    const { destroySessionsForRepresentative } = await import('@/server/session')
    const { default: bcrypt } = await import('bcryptjs')

    const db = await getDb()
    await db
      .update(representatives)
      .set({ passwordHash: await bcrypt.hash(data.password, 10), updatedAt: new Date() })
      .where(eq(representatives.id, data.representativeId))

    // A password reset ends every existing session for that account, so a
    // reset after a lost phone actually revokes access.
    await destroySessionsForRepresentative(data.representativeId)

    return { success: true as const }
  })
