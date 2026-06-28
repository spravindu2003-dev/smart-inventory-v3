#!/bin/sh
set -e

echo "[start.sh] Pushing database schema..."
npx prisma db push --accept-data-loss

echo "[start.sh] Generating Prisma client..."
npx prisma generate

echo "[start.sh] Starting server..."
node src/index.js
