/**
 * Marks existing migrations as already applied, without running them.
 *
 *   pnpm db:baseline --dry-run     # show what would be recorded
 *   pnpm db:baseline               # record it
 *
 * A database built with `db:push` has the right tables but no migration
 * history, so the first `db:migrate` tries to CREATE TABLE things that already
 * exist and fails on the first one. This writes the history drizzle expects, so
 * the baseline counts as done and later migrations apply normally.
 *
 * ONLY run this against a database whose schema already matches the migrations
 * being recorded. It does not inspect the schema — it asserts a claim about it.
 * On an empty database, run `pnpm db:migrate` instead.
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

interface JournalEntry {
  idx: number
  when: number
  tag: string
}

const MIGRATIONS_DIR = 'drizzle'

/**
 * The identity drizzle gives a migration: a sha256 of the file's whole
 * contents. Matching it exactly is the point — a different hash would make
 * drizzle run the migration again.
 */
export function migrationHash(sql: string): string {
  return createHash('sha256').update(sql).digest('hex')
}

export function readJournal(dir = MIGRATIONS_DIR): JournalEntry[] {
  const journal = JSON.parse(readFileSync(join(dir, 'meta', '_journal.json'), 'utf8'))
  return journal.entries ?? []
}

export function plan(dir = MIGRATIONS_DIR) {
  return readJournal(dir).map((entry) => ({
    tag: entry.tag,
    when: entry.when,
    hash: migrationHash(readFileSync(join(dir, `${entry.tag}.sql`), 'utf8')),
  }))
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const entries = plan()

  if (entries.length === 0) {
    console.log('No migrations found. Run `pnpm db:generate` first.')
    process.exit(1)
  }

  console.log(`${entries.length} migration(s) to record:\n`)
  for (const e of entries) {
    console.log(`  ${e.tag}  ${e.hash.slice(0, 16)}…  ${new Date(e.when).toISOString()}`)
  }

  if (dryRun) {
    console.log('\nDry run — nothing written.')
    process.exit(0)
  }

  const { getDb } = await import('@/lib/db')
  const { sql } = await import('drizzle-orm')
  const db = await getDb()

  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS "drizzle"`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `)

  let recorded = 0
  for (const entry of entries) {
    const existing = await db.execute(
      sql`SELECT 1 FROM "drizzle"."__drizzle_migrations" WHERE hash = ${entry.hash} LIMIT 1`
    )
    if (existing.length > 0) {
      console.log(`\n  already recorded: ${entry.tag}`)
      continue
    }
    await db.execute(
      sql`INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at)
          VALUES (${entry.hash}, ${entry.when})`
    )
    recorded++
  }

  console.log(`\nRecorded ${recorded} migration(s). \`pnpm db:migrate\` will now apply only what comes next.`)
  process.exit(0)
}

// Only run when invoked directly, so the helpers above stay importable in tests.
if (process.argv[1]?.includes('baseline-migrations')) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
