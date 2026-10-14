#!/usr/bin/env bash
# scripts/dev.sh
# Run both the API server and Vite frontend concurrently.
# Usage: bash scripts/dev.sh  (from project root)

set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Ensure .env exists
if [ ! -f "$ROOT/.env" ]; then
    echo "[Setup] .env not found — copying .env.example → .env"
    cp "$ROOT/.env.example" "$ROOT/.env"
    echo "[Setup] Edit .env and set JWT_SECRET before production use."
fi

# Install root deps (concurrently)
if [ ! -d "$ROOT/node_modules" ]; then
    echo "[Setup] Installing root dependencies..."
    cd "$ROOT" && npm install
fi

# Install server deps
if [ ! -d "$ROOT/server/node_modules" ]; then
    echo "[Setup] Installing server dependencies..."
    cd "$ROOT/server" && npm install
fi

# Install client deps
if [ ! -d "$ROOT/client/node_modules" ]; then
    echo "[Setup] Installing client dependencies..."
    cd "$ROOT/client" && npm install
fi

# Seed DB if not present
DB_PATH="$ROOT/server/data/sharespot.db"
if [ ! -f "$DB_PATH" ]; then
    echo "[Setup] Database not found — running seed..."
    cd "$ROOT/server" && npm run db:seed
    echo "[Setup] ✅ Database seeded! Demo: rohan/demo1234"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ShareSpot Dev Server Starting..."
echo "  API  → http://localhost:3001/api/health"
echo "  App  → http://localhost:5173"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$ROOT"
npm run dev
