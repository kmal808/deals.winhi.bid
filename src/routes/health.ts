import { createFileRoute } from '@tanstack/react-router'

/**
 * Deployment health check.
 *
 * Reports 200 only when the process is up *and* the database answers, because
 * a container that booted but cannot reach postgres serves nothing but errors —
 * a deploy that gets that far should be treated as failed, not live.
 *
 * The query is deliberately trivial and time-boxed: this runs on every probe,
 * and a health check that hangs is worse than one that fails.
 */
export const Route = createFileRoute('/health')({
  server: {
    handlers: {
      GET: async () => {
        const started = Date.now()
        let database: 'ok' | 'unreachable' = 'unreachable'
        let detail: string | undefined

        try {
          const { getDb } = await import('@/lib/db')
          const { sql } = await import('drizzle-orm')
          const db = await getDb()

          await Promise.race([
            db.execute(sql`select 1`),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('timed out after 3000ms')), 3000)
            ),
          ])
          database = 'ok'
        } catch (err) {
          detail = err instanceof Error ? err.message : 'unknown error'
        }

        const healthy = database === 'ok'
        return new Response(
          JSON.stringify({
            status: healthy ? 'ok' : 'degraded',
            database,
            ...(detail ? { detail } : {}),
            // Set at build time so a probe says which build answered.
            version: process.env.APP_VERSION ?? 'dev',
            checkedInMs: Date.now() - started,
          }),
          {
            status: healthy ? 200 : 503,
            headers: {
              'content-type': 'application/json',
              'cache-control': 'no-store',
            },
          }
        )
      },
    },
  },
})
