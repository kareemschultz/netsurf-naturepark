FROM oven/bun:1.3-alpine AS builder
WORKDIR /app

COPY package.json bun.lock* turbo.json ./
COPY apps/admin/package.json ./apps/admin/
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY packages/ui/package.json ./packages/ui/
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/

RUN bun install --frozen-lockfile

COPY apps/admin ./apps/admin
COPY packages/ui ./packages/ui
COPY packages/shared ./packages/shared

WORKDIR /app/apps/admin

ARG VITE_API_URL=https://api.netsurfnaturepark.com
ENV VITE_API_URL=$VITE_API_URL

RUN bunx vite build

# ── Serve with nginx ──────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html

RUN printf 'server {\n\
    listen 80;\n\
    listen [::]:80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    gzip on;\n\
    gzip_types text/css application/javascript application/json image/svg+xml;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1
