#!/bin/sh
set -e

echo "Running database migrations..."
MIGRATIONS_DIR=/app/lib/db/drizzle node --enable-source-maps /app/dist/migrate.mjs

echo "Starting Harmonia API server..."
exec node --enable-source-maps /app/dist/index.mjs
