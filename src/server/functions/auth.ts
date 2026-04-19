import { createServerFn } from '@tanstack/react-start'
import { getCookie, setCookie, deleteCookie } from '@tanstack/react-start/server'
import bcrypt from 'bcryptjs'

const SESSION_COOKIE = 'wh_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export interface SessionData {
  userId: number
  username: string
  name: string
  role: 'admin' | 'representative'
}

// Simple in-memory session store
const sessions = new Map<string, SessionData>()

export const performLogin = createServerFn().handler(
  async (ctx: any) => {
    const { username, password } = ctx?.data || {}

    const { eq } = await import('drizzle-orm')
    const { getDb } = await import('@/lib/db')
    const { representatives } = await import('@/db/schema')

    const db = await getDb()
    const user = await db.query.representatives.findFirst({
      where: eq(representatives.username, username),
    })

    if (!user || !user.active) {
      throw new Error('Invalid credentials')
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      throw new Error('Invalid credentials')
    }

    const sessionId = crypto.randomUUID()
    const sessionData: SessionData = {
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    }

    sessions.set(sessionId, sessionData)

    setCookie(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    })

    return { success: true as const, user: sessionData }
  }
)

export const logout = createServerFn().handler(async () => {
  const sessionId = getCookie(SESSION_COOKIE)
  if (sessionId) {
    sessions.delete(sessionId)
  }
  deleteCookie(SESSION_COOKIE, { path: '/' })
  return { success: true as const }
})

export const getSession = createServerFn().handler(async (): Promise<SessionData | null> => {
  const sessionId = getCookie(SESSION_COOKIE)
  if (!sessionId) return null
  return sessions.get(sessionId) || null
})
