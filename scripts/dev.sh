#!/usr/bin/env bash
# Local dev runner: checks the things that silently break `next dev`, then starts
# it with hot reload. Safe to re-run; it is idempotent.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f conf/config.yaml ]; then
  echo "==> conf/config.yaml is missing. Creating it from the template."
  cp conf/config.example.yaml conf/config.yaml
  echo "    Set database.postgres.url in conf/config.yaml, then run this again."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "==> Installing dependencies"
  npm install
fi

# The generated client is what typecheck and the app import, so a schema edit
# without a regenerate shows up as confusing "field does not exist" errors.
generated="node_modules/.prisma/client/index.js"
if [ ! -f "$generated" ] || [ prisma/schema.prisma -nt "$generated" ]; then
  echo "==> Generating Prisma client (schema changed)"
  npx prisma generate
fi

if [ "${CHECK:-0}" = "1" ]; then
  echo "==> Typecheck"
  npm run typecheck
  echo "==> Lint"
  npm run lint
fi

echo
echo "==> http://localhost:3000  (edits hot-reload; Ctrl+C to stop)"
echo
exec npm run dev -- "$@"
