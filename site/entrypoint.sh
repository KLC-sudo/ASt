#!/bin/sh
set -e

export PORT=${PORT:-80}

envsubst '${PORT}' < /etc/nginx/conf.d/default.conf > /tmp/default.conf
mv /tmp/default.conf /etc/nginx/conf.d/default.conf

echo "[entrypoint] nginx listening on port ${PORT}"
exec nginx -g 'daemon off;'
