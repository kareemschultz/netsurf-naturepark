# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM oven/bun:1.3-alpine AS builder

WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package.json bun.lock turbo.json ./
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN bun install

# Copy source
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Build the web app
RUN bun run build --filter=web

# ─── Stage 2: Serve ──────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1
