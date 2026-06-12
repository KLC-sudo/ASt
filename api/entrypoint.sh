#!/bin/sh
set -e

echo "[entrypoint] Running prisma db push..."
npx prisma db push --skip-generate --accept-data-loss

echo "[entrypoint] Starting server..."
exec node server.js
