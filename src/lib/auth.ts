import { createServerFn } from '@tanstack/react-start'
import { getRequest, setResponseHeader } from '@tanstack/react-start/server'
import bcrypt from 'bcryptjs'
import { db } from './db'
import { representatives } from '@/db/schema'
import { eq } from 'drizzle-orm'

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

function getSessionIdFromRequest(): string | null {
  const request = getRequest()
  const cookieHeader = request?.headers?.get('cookie')
  const cookies = parseCookies(cookieHeader)
  return cookies[SESSION_COOKIE] || null
}

// Server-side login function (not a server function - called from actions)
export async function performLogin(username: string, password: string) {
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
  setResponseHeader('Set-Cookie', cookieValue)

  return { success: true as const, user: sessionData }
}

export const logout = createServerFn().handler(async () => {
  const sessionId = getSessionIdFromRequest()
  if (sessionId) {
    sessions.delete(sessionId)
    // Clear cookie
    setResponseHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; Max-Age=0`)
  }
  return { success: true as const }
})

export const getSession = createServerFn().handler(async (): Promise<SessionData | null> => {
  const sessionId = getSessionIdFromRequest()
  if (!sessionId) return null

  const session = sessions.get(sessionId)
  return session || null
})
