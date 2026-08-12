import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'url'

/**
 * Tests deliberately do not reuse vite.config.ts: the nitro and tanstackStart
 * plugins build a server bundle and fail to load under Vitest. Unit tests only
 * need path aliases and a DOM, so this config stays minimal.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
