import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { authMiddleware, adminMiddleware } from '@/server/middleware/auth'

/**
 * Feedback from reps using the app.
 *
 * Submitting is open to any signed-in rep; reading is admin-only, because
 * reports name customers and quote figures.
 */

export const submitFeedback = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      message: z.string().trim().min(1, 'Tell us what happened').max(4000),
      // Captured by the client so a report carries its own context.
      path: z.string().max(500).optional().nullable(),
      customerId: z.number().int().positive().optional().nullable(),
      userAgent: z.string().max(500).optional().nullable(),
    })
  )
  .handler(async ({ data, context }) => {
    const { getDb } = await import('@/lib/db')
    const { feedback, customers } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')

    const db = await getDb()

    // A deleted or mistyped customer id must not lose the whole report, so it
    // is dropped rather than allowed to fail the insert.
    let customerId: number | null = data.customerId ?? null
    if (customerId !== null) {
      const exists = await db
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.id, customerId))
        .limit(1)
      if (exists.length === 0) customerId = null
    }

    const [created] = await db
      .insert(feedback)
      .values({
        representativeId: context.session.userId,
        message: data.message,
        path: data.path ?? null,
        customerId,
        userAgent: data.userAgent ?? null,
        appVersion: process.env.APP_VERSION ?? 'dev',
      })
      .returning()

    return { id: created.id }
  })

export const listFeedback = createServerFn()
  .middleware([adminMiddleware])
  .inputValidator(z.object({ includeResolved: z.boolean().optional() }).optional())
  .handler(async ({ data }) => {
    const { getDb } = await import('@/lib/db')
    const { feedback } = await import('@/db/schema')
    const { desc, isNull } = await import('drizzle-orm')

    const db = await getDb()
    return await db.query.feedback.findMany({
      where: data?.includeResolved ? undefined : isNull(feedback.resolvedAt),
      with: { representative: true, customer: true },
      orderBy: [desc(feedback.createdAt)],
      limit: 200,
    })
  })

export const setFeedbackResolved = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator(
    z.object({ feedbackId: z.number().int().positive(), resolved: z.boolean() })
  )
  .handler(async ({ data }) => {
    const { getDb } = await import('@/lib/db')
    const { feedback } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')

    const db = await getDb()
    await db
      .update(feedback)
      .set({ resolvedAt: data.resolved ? new Date() : null })
      .where(eq(feedback.id, data.feedbackId))

    return { success: true as const }
  })
