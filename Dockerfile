FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# ── Install all dependencies (dev + prod) ────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY tsconfig.base.json tsconfig.json ./
COPY lib/db/package.json             ./lib/db/
COPY lib/api-zod/package.json        ./lib/api-zod/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-spec/package.json       ./lib/api-spec/
COPY artifacts/api-server/package.json ./artifacts/api-server/
RUN pnpm install --frozen-lockfile

# ── Build ────────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY lib/       ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/

# Build the API server bundle
RUN pnpm --filter @workspace/api-server run build

# Bundle the DB migration script as a standalone file
RUN node_modules/.bin/esbuild lib/db/src/migrate.ts \
    --platform=node --bundle --format=esm \
    --outfile=artifacts/api-server/dist/migrate.mjs \
    --external:pg --external:pg-native \
    --banner:js="import{createRequire}from'node:module';globalThis.require=createRequire(import.meta.url);"

# Use pnpm deploy to produce a self-contained prod folder (resolves workspace:* correctly)
RUN pnpm deploy --filter @workspace/api-server --prod /deploy

# Copy the compiled dist and migration files into the deploy folder
RUN cp -r artifacts/api-server/dist /deploy/dist
RUN mkdir -p /deploy/lib/db && cp -r lib/db/drizzle /deploy/lib/db/drizzle

# ── Final image ───────────────────────────────────────────────────────────────
FROM node:24-alpine AS runner
WORKDIR /app

COPY --from=builder /deploy/node_modules ./node_modules
COPY --from=builder /deploy/dist         ./dist
COPY --from=builder /deploy/lib/db/drizzle ./lib/db/drizzle

COPY scripts/docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
