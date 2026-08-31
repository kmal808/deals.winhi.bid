/**
 * Applies pending migrations, then exits.
 *
 * Runs from the container entrypoint before the server starts, so a deploy
 * either brings the schema forward or fails loudly rather than serving against
 * a database it does not match.
 *
 * This is bundled into .output/migrate.mjs at build time because the runtime
 * image deliberately carries no package manager and no node_modules — see the
 * Dockerfile. It uses drizzle-orm's migrator rather than drizzle-kit, which is
 * a build-time tool.
 *
 * One replica at a time. Two containers migrating concurrently would race on
 * the migrations table; at this scale that is a rolling deploy of one.
 */
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('migrate: DATABASE_URL is not set')
  process.exit(1)
}

const folder = process.env.MIGRATIONS_FOLDER ?? 'drizzle'

/**
 * The connection details worth printing when something fails, with the password
 * replaced. Deliberately shows the username, host, port and database, because a
 * typo in any of them is by far the most common cause of a failed deploy.
 */
function describePassword(connectionString: string, decoded: string): string {
  if (!decoded) return '(empty)'
  const raw = /:\/\/[^:]*:([^@]*)@/.exec(connectionString)?.[1] ?? ''
  const encodedDiffers = raw !== decoded
  const risky = /[@:/?#[\]$]/.test(decoded)
  return [
    `(set, ${decoded.length} chars`,
    encodedDiffers ? ', percent-decoded' : '',
    risky ? ', CONTAINS CHARACTERS THAT MUST BE PERCENT-ENCODED IN A URL' : '',
    ')',
  ].join('')
}

function describeConnection(connectionString: string): string {
  try {
    const u = new URL(connectionString)
    return [
      `user=${u.username || '(none — will fall back to the OS user)'}`,
      `host=${u.hostname || '(none)'}`,
      `port=${u.port || '5432'}`,
      `database=${u.pathname.replace(/^\//, '') || '(none)'}`,
      // Length, not the value. A password shorter than expected is the
      // signature of a $ being eaten by shell or compose interpolation, and a
      // decoded length differing from the raw one means it needed encoding.
      `password=${describePassword(connectionString, u.password)}`,
    ].join(' ')
  } catch {
    return 'DATABASE_URL could not be parsed as a URL — check for unencoded @ : / ? # or $ in the password'
  }
}

// max: 1 because the migrator wants a single connection, and this process does
// nothing else. Short timeouts so a wedged database fails the deploy promptly
// rather than hanging it.
const client = postgres(url, { max: 1, connect_timeout: 10, idle_timeout: 5 })

try {
  const started = Date.now()
  await migrate(drizzle(client), { migrationsFolder: folder })
  console.log(`migrate: schema up to date (${Date.now() - started}ms)`)
  await client.end()
  process.exit(0)
} catch (err) {
  // postgres.js reports a connection problem as a failure of whatever query was
  // being attempted, so the useful part — the driver's error code and the
  // connection it was actually using — has to be dug out and printed
  // deliberately. Without this a bad username reads as "CREATE SCHEMA failed".
  const e = err as { message?: string; code?: string; routine?: string }
  console.error('migrate: failed —', e?.message ?? err)
  if (e?.code) console.error('migrate: postgres code', e.code, e.routine ? `(${e.routine})` : '')

  console.error('migrate: connection was', describeConnection(url))
  if (e?.code === '28P01' || e?.code === '28000') {
    console.error(
      'migrate: postgres rejects an unknown role the same way it rejects a bad\n' +
      '         password, so check the username above exists before assuming the\n' +
      '         password is wrong.'
    )
  }

  await client.end({ timeout: 5 }).catch(() => {})
  process.exit(1)
}
