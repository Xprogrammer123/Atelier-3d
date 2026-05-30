#!/usr/bin/env bash
# Stop dev servers that share this project's .next, then start clean.
set -euo pipefail
cd "$(dirname "$0")/.."

for port in 3000 3001; do
  fuser -k "${port}/tcp" 2>/dev/null || true
done

pkill -f 'node_modules/.bin/next dev' 2>/dev/null || true
sleep 1

rm -rf .next
exec npx next dev
