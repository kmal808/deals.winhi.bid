import { serverOnly$ } from 'vite-env-only/macros'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '@/db/schema'

type DbType = PostgresJsDatabase<typeof schema>

let _db: DbType | null = null

export async function getDb(): Promise<DbType> {
  if (!_db) {
    const { drizzle } = await serverOnly$(() => import('drizzle-orm/postgres-js'))
    const { default: postgres } = await serverOnly$(() => import('postgres'))
    const schemaModule = await serverOnly$(() => import('@/db/schema'))

    const connectionString = process.env.DATABASE_URL!
    const client = postgres(connectionString)
    _db = drizzle(client, { schema: schemaModule }) as DbType
  }
  return _db
}
