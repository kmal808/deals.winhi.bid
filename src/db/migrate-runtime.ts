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
  console.error('migrate: failed —', err instanceof Error ? err.message : err)
  await client.end({ timeout: 5 }).catch(() => {})
  process.exit(1)
}
