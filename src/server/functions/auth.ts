import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import type { SessionData } from '@/server/session'

export type { SessionData }

const loginInput = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

export const performLogin = createServerFn({ method: 'POST' })
  .inputValidator(loginInput)
  .handler(async ({ data }) => {
    const { eq } = await import('drizzle-orm')
    const { getDb } = await import('@/lib/db')
    const { representatives } = await import('@/db/schema')
    const { setCookie } = await import('@tanstack/react-start/server')
    const { createSession, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } = await import(
      '@/server/session'
    )
    const { default: bcrypt } = await import('bcryptjs')

    const db = await getDb()
    const user = await db.query.representatives.findFirst({
      where: eq(representatives.username, data.username),
    })

    // Compare against a dummy hash when the user is missing so that a bad
    // username and a bad password take the same amount of time to reject.
    const hash = user?.passwordHash ?? '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv'
    const passwordMatches = await bcrypt.compare(data.password, hash)

    if (!user || !user.active || !passwordMatches) {
      throw new Error('Invalid credentials')
    }

    const sessionId = await createSession(user.id)

    setCookie(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: '/',
    })

    const session: SessionData = {
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    }

    return { success: true as const, user: session }
  })

export const logout = createServerFn({ method: 'POST' }).handler(async () => {
  const { getCookie, deleteCookie } = await import('@tanstack/react-start/server')
  const { destroySession, SESSION_COOKIE } = await import('@/server/session')

  await destroySession(getCookie(SESSION_COOKIE))
  deleteCookie(SESSION_COOKIE, { path: '/' })

  return { success: true as const }
})

export const getSession = createServerFn().handler(async (): Promise<SessionData | null> => {
  const { getCookie } = await import('@tanstack/react-start/server')
  const { readSession, SESSION_COOKIE } = await import('@/server/session')

  return await readSession(getCookie(SESSION_COOKIE))
})
