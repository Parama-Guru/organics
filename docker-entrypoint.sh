#!/bin/sh
set -e

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "==> Applying database migrations"
  node ./node_modules/prisma/build/index.js migrate deploy --schema=./prisma/schema.prisma
fi

echo "==> Starting Organics"
exec "$@"
