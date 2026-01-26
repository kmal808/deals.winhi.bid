import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/db/schema'

const connectionString = process.env.DATABASE_URL!

// For server-side usage
const client = postgres(connectionString)
export const db = drizzle(client, { schema })
