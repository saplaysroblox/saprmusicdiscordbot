#!/bin/sh
set -e

echo "Running database migrations..."
node --enable-source-maps /app/artifacts/api-server/dist/migrate.mjs

echo "Starting Harmonia API server..."
exec node --enable-source-maps /app/artifacts/api-server/dist/index.mjs
