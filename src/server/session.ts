/**
 * Server-side session storage.
 *
 * Sessions are rows in the database rather than entries in a module-level Map:
 * the app runs under `restart: unless-stopped` in Docker, and an in-process store
 * signs everybody out on every restart and cannot be shared across instances.
 *
 * Only ever imported from inside a server function handler or middleware body,
 * so none of this reaches the client bundle.
 */

export const SESSION_COOKIE = 'wh_session'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days

export interface SessionData {
  userId: number
  username: string
  name: string
  role: 'admin' | 'representative'
}

/** 256 bits of entropy, hex encoded — the cookie value is the only bearer token. */
function generateSessionId(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function createSession(representativeId: number): Promise<string> {
  const { getDb } = await import('@/lib/db')
  const { sessions } = await import('@/db/schema')

  const db = await getDb()
  const id = generateSessionId()

  await db.insert(sessions).values({
    id,
    representativeId,
    expiresAt: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000),
  })

  return id
}

/**
 * Resolves a session id to its representative, or null when the session is
 * unknown, expired, or belongs to a deactivated account.
 *
 * The role is read from the representative row on every request rather than
 * being frozen at login, so deactivating or demoting a user takes effect at once.
 */
export async function readSession(sessionId: string | undefined): Promise<SessionData | null> {
  if (!sessionId) return null

  const { getDb } = await import('@/lib/db')
  const { sessions } = await import('@/db/schema')
  const { eq } = await import('drizzle-orm')

  const db = await getDb()
  const row = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    with: { representative: true },
  })

  if (!row) return null

  if (row.expiresAt.getTime() <= Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, sessionId))
    return null
  }

  const rep = row.representative
  if (!rep || !rep.active) return null

  return {
    userId: rep.id,
    username: rep.username,
    name: rep.name,
    role: rep.role,
  }
}

export async function destroySession(sessionId: string | undefined): Promise<void> {
  if (!sessionId) return

  const { getDb } = await import('@/lib/db')
  const { sessions } = await import('@/db/schema')
  const { eq } = await import('drizzle-orm')

  const db = await getDb()
  await db.delete(sessions).where(eq(sessions.id, sessionId))
}

/** Clears every session for a representative — used when the account is disabled. */
export async function destroySessionsForRepresentative(representativeId: number): Promise<void> {
  const { getDb } = await import('@/lib/db')
  const { sessions } = await import('@/db/schema')
  const { eq } = await import('drizzle-orm')

  const db = await getDb()
  await db.delete(sessions).where(eq(sessions.representativeId, representativeId))
}
