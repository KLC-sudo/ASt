#!/usr/bin/env bash
set -e

if [ -z "${RAILWAY_SERVICE_NAME:-}" ]; then
  echo "[start.sh] RAILWAY_SERVICE_NAME not set."
fi

if [ -d "./api" ] && [ -f "./api/package.json" ] && [ "${RAILWAY_ROOT_DIR:-.}" = "." ]; then
  echo "[start.sh] Detected api/ at repo root. Starting Next.js standalone server."
  exec node ./api/.next/standalone/server.js
fi

echo "[start.sh] No api/ or Root Directory not set to repo root."
echo "[start.sh] Expected layout:"
echo "  - Root Directory = .  (this Dockerfile wraps api/)"
echo "  - OR Root Directory = api  (uses api/Dockerfile)"
echo "[start.sh] Refusing to start. Set Root Directory in Railway service settings."
exit 1
