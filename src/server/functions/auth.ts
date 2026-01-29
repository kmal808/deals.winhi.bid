import { createServerFn } from '@tanstack/react-start'
import { serverOnly$ } from 'vite-env-only/macros'

const SESSION_COOKIE = 'wh_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export interface SessionData {
  userId: number
  username: string
  name: string
  role: 'admin' | 'representative'
}

// Simple in-memory session store
// In production, use Redis or database sessions
const sessions = new Map<string, SessionData>()

function parseCookies(cookieHeader: string | null): Record<string, string> {
  const cookies: Record<string, string> = {}
  if (!cookieHeader) return cookies

  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...rest] = cookie.split('=')
    cookies[name.trim()] = rest.join('=').trim()
  })
  return cookies
}

const getSessionIdFromRequest = serverOnly$(async (): Promise<string | null> => {
  // Import inside function to avoid client bundle
  const startServer = await import('@tanstack/react-start/server')
  const request = startServer.getRequest()
  const cookieHeader = request?.headers?.get('cookie')
  const cookies = parseCookies(cookieHeader)
  return cookies[SESSION_COOKIE] || null
})

// Server-side login function - internal implementation
async function performLoginInternal(username: string, password: string) {
  // Import all server dependencies inside function
  const bcrypt = await import('bcryptjs')
  const { getDb } = await import('@/lib/db')
  const { representatives } = await import('@/db/schema')
  const { eq } = await import('drizzle-orm')
  const startServer = await import('@tanstack/react-start/server')

  const db = await getDb()

  const user = await db.query.representatives.findFirst({
    where: eq(representatives.username, username),
  })

  if (!user || !user.active) {
    throw new Error('Invalid credentials')
  }

  const valid = await bcrypt.default.compare(password, user.passwordHash)
  if (!valid) {
    throw new Error('Invalid credentials')
  }

  // Create session
  const sessionId = crypto.randomUUID()
  const sessionData: SessionData = {
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  }

  sessions.set(sessionId, sessionData)

  // Set cookie via response header
  const cookieValue = `${SESSION_COOKIE}=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`
  startServer.setResponseHeader('Set-Cookie', cookieValue)

  return { success: true as const, user: sessionData }
}

// Export as server function
export const performLogin = createServerFn({ method: 'POST' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .handler(async (ctx: any) => {
    const { username, password } = ctx?.data || {}
    if (!username || !password) {
      throw new Error('Username and password are required')
    }
    return performLoginInternal(username, password)
  })

export const logout = createServerFn().handler(serverOnly$(async () => {
  const sessionId = await getSessionIdFromRequest()
  if (sessionId) {
    sessions.delete(sessionId)
    // Import inside function
    const startServer = await import('@tanstack/react-start/server')
    startServer.setResponseHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; Max-Age=0`)
  }
  return { success: true as const }
}))

export const getSession = createServerFn().handler(serverOnly$(async (): Promise<SessionData | null> => {
  const sessionId = await getSessionIdFromRequest()
  if (!sessionId) return null

  const session = sessions.get(sessionId)
  return session || null
}))
