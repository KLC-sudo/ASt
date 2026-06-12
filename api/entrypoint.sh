#!/bin/sh
set -e

echo "[entrypoint] Running prisma db push..."
node ./node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss 2>&1 || echo "[entrypoint] prisma db push failed, continuing anyway..."

echo "[entrypoint] Starting server..."
exec node server.js
