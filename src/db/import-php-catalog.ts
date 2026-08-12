/**
 * Imports the product catalogue from a mysqldump of the PHP application.
 *
 *   pnpm db:import-catalog ~/Downloads/dbs12947220.sql
 *
 * Reads only the lookup tables — brands, frame types and colours, glass, grid
 * styles and sizes, and windowConfigs. It deliberately ignores `customers`,
 * `windows` and `representatives`: this app has its own customer data, and a
 * catalogue import has no business touching either those records or password
 * hashes.
 *
 * Idempotent. Rows are matched on their natural key and updated in place, so
 * re-running after a catalogue change in the old app brings the difference
 * across without creating duplicates.
 */
import { readFileSync } from 'node:fs'
import { getDb } from '@/lib/db'
import {
  brands,
  frameColors,
  frameTypes,
  glassTypes,
  gridSizes,
  gridStyles,
  productConfigs,
} from './schema'
import { eq, and } from 'drizzle-orm'

/** `INSERT INTO \`table\` VALUES (...),(...);` → the rows, as raw tuples. */
function readRows(sql: string, table: string): string[][] {
  const block = new RegExp(`INSERT INTO \`${table}\`[^;]*;`, 's').exec(sql)
  if (!block) return []

  const rows: string[][] = []
  // Walk the tuple list rather than regexing it, so values containing commas,
  // apostrophes or escaped quotes survive intact.
  const text = block[0]
  let i = text.indexOf('VALUES')
  let current: string[] | null = null
  let value = ''
  let inString = false

  for (; i < text.length; i++) {
    const c = text[i]
    if (inString) {
      if (c === '\\') {
        value += text[++i] ?? ''
      } else if (c === "'") {
        inString = false
      } else {
        value += c
      }
      continue
    }
    if (c === "'") {
      inString = true
    } else if (c === '(') {
      current = []
      value = ''
    } else if ((c === ',' || c === ')') && current) {
      current.push(value.trim())
      value = ''
      if (c === ')') {
        rows.push(current)
        current = null
      }
    } else if (current) {
      value += c
    }
  }
  return rows
}

/** `OXXO Swing In Master Left.PNG` → `/images/products/oxxo-swing-in-master-left.png` */
function imagePathFor(pictureName: string): string {
  const dot = pictureName.lastIndexOf('.')
  const stem = dot === -1 ? pictureName : pictureName.slice(0, dot)
  const ext = dot === -1 ? '.png' : pictureName.slice(dot).toLowerCase()
  const slug = stem
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `/images/products/${slug}${ext}`
}

/** The X/O code embedded in a configuration name, where there is one. */
function operationCodeFrom(name: string): string | null {
  const token = name.split(/\s+/).find((t) => /^[XO]{1,4}$/i.test(t))
  return token ? token.toUpperCase() : null
}

async function main() {
  const dumpPath = process.argv[2]
  if (!dumpPath) {
    console.error('usage: pnpm db:import-catalog <path-to-dump.sql>')
    process.exit(1)
  }

  const sql = readFileSync(dumpPath, 'utf8')
  const db = await getDb()

  const counts: Record<string, number> = {}

  // --- simple name/factor lookups -------------------------------------------
  const lookups = [
    { from: 'brands', table: brands, key: 'name' as const },
    { from: 'frameTypes', table: frameTypes, key: 'name' as const },
    { from: 'frameColors', table: frameColors, key: 'name' as const },
    { from: 'glass', table: glassTypes, key: 'name' as const },
    { from: 'grid', table: gridStyles, key: 'name' as const },
  ]

  for (const { from, table, key } of lookups) {
    const rows = readRows(sql, from)
    for (const [, name, factor] of rows) {
      if (!name) continue
      const values = { [key]: name, factor: String(factor ?? 0) } as never
      await db
        .insert(table)
        .values(values)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .onConflictDoUpdate({ target: (table as any)[key], set: { factor: String(factor ?? 0) } })
    }
    counts[from] = rows.length
  }

  // gridSizes keys on `size` rather than `name`
  const sizeRows = readRows(sql, 'gridSizes')
  for (const [, size] of sizeRows) {
    if (!size) continue
    await db.insert(gridSizes).values({ size }).onConflictDoNothing()
  }
  counts.gridSizes = sizeRows.length

  // --- product configurations ------------------------------------------------
  const configRows = readRows(sql, 'windowConfigs')
  for (const [, name, pictureName, isDoor, active] of configRows) {
    if (!name) continue
    const category = isDoor === '1' ? 'door' : 'window'
    const code = operationCodeFrom(name)

    const values = {
      name,
      category: category as 'window' | 'door',
      operationType: code,
      liteCount: code ? code.length : 1,
      imagePath: imagePathFor(pictureName),
      active: active !== '0',
    }

    const existing = await db
      .select({ id: productConfigs.id })
      .from(productConfigs)
      .where(and(eq(productConfigs.name, name), eq(productConfigs.category, values.category)))
      .limit(1)

    if (existing.length > 0) {
      await db.update(productConfigs).set(values).where(eq(productConfigs.id, existing[0].id))
    } else {
      await db.insert(productConfigs).values(values)
    }
  }
  counts.windowConfigs = configRows.length

  for (const [table, n] of Object.entries(counts)) {
    console.log(`${String(n).padStart(4)}  ${table}`)
  }
  console.log('\ncatalogue imported; customers, windows and representatives were not read')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
