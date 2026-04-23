#!/bin/sh
set -eu

# Ensure upload directories exist
mkdir -p /srv/uploads/gallery /srv/uploads/promos

# Start Bun API server in background
cd /app/apps/api
bun src/index.ts &
BUN_PID=$!
echo "[entrypoint] Bun API started (PID $BUN_PID)"

# Kill bun when nginx exits
trap "kill $BUN_PID 2>/dev/null || true" EXIT INT TERM

# Start nginx as PID 1 (exec replaces shell)
exec nginx -g 'daemon off;'
