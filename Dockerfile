# syntax=docker/dockerfile:1.7

# ---- Builder: install all workspaces and build client + server + shared ----
FROM oven/bun:1.2-alpine AS builder
WORKDIR /app

# Copy workspace manifests first so dep-install can cache.
COPY package.json bun.lock tsconfig.json turbo.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install all deps. Skip lifecycle scripts because the root postinstall runs
# `turbo build --filter=shared --filter=server`, which needs source files that
# are not in the image yet.
RUN bun install --ignore-scripts

# Copy the rest of the sources, then run the full build once.
COPY shared ./shared
COPY server ./server
COPY client ./client
RUN bun run build

# ---- Runner: minimal image that boots the Hono server ----
FROM oven/bun:1.2-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    CLIENT_DIST_DIR=/app/public

# Hop the built artefacts and resolved node_modules out of the builder.
COPY --from=builder /app/package.json /app/bun.lock ./
COPY --from=builder /app/shared/package.json ./shared/
COPY --from=builder /app/server/package.json ./server/
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O - http://127.0.0.1:${PORT}/healthz || exit 1

# Drop privileges; the oven/bun image ships a non-root "bun" user.
USER bun
CMD ["bun", "run", "server/dist/index.js"]
