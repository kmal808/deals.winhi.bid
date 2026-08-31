import { createMiddleware } from '@tanstack/react-start'
import type { SessionData } from '@/server/session'

/**
 * Server functions are ordinary HTTP endpoints, so identity must be derived from
 * the request cookie on the server. Anything the client sends about *who it is*
 * is attacker-controlled and is never trusted here.
 *
 * Attach `authMiddleware` to every function that touches customer data, and
 * `adminMiddleware` to every function that mutates shared configuration.
 */
export const authMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const { getCookie } = await import('@tanstack/react-start/server')
    const { readSession, SESSION_COOKIE } = await import('@/server/session')

    const session = await readSession(getCookie(SESSION_COOKIE))
    if (!session) {
      throw new Error('Not authenticated')
    }

    return next({ context: { session } })
  }
)

export const adminMiddleware = createMiddleware({ type: 'function' })
  .middleware([authMiddleware])
  .server(async ({ next, context }) => {
    const session = context.session as SessionData
    if (session.role !== 'admin') {
      throw new Error('Admin access required')
    }

    return next({ context: { session } })
  })
