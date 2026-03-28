FROM oven/bun:1.3-alpine AS base
WORKDIR /app

# Copy workspace manifests for dependency resolution
COPY package.json bun.lock* ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/admin/package.json ./apps/admin/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/

# Install all workspace deps
RUN bun install --frozen-lockfile

# Copy source
COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json ./apps/api/
COPY packages/db/src ./packages/db/src
COPY packages/shared/src ./packages/shared/src

WORKDIR /app/apps/api

ENV PORT=3001 \
    NODE_ENV=production

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["bun", "src/index.ts"]
