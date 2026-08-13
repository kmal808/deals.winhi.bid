# syntax=docker/dockerfile:1

# ---------- build ----------
FROM node:24-alpine AS builder

WORKDIR /app

# Package files first, so corepack can read the pinned pnpm version from
# package.json and so this layer caches independently of the source.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# pnpm version comes from the `packageManager` field, not from `@latest`.
# An unpinned toolchain means the day pnpm ships a new lockfile format the
# build breaks here while still working on a developer's machine.
RUN corepack enable && corepack install

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

# ---------- run ----------
FROM node:24-alpine AS runner

WORKDIR /app

# No package manager in the runtime image: the server is started with plain
# node, and every dependency is already bundled into .output by the build.
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 appuser

COPY --from=builder --chown=appuser:nodejs /app/.output ./.output

USER appuser

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", ".output/server/index.mjs"]
