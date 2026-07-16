#!/usr/bin/env sh
set -eu

echo "[entrypoint] waiting for database..."
i=0
until node -e "
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL, { max: 1, connect_timeout: 3 });
sql\`select 1\`.then(() => { sql.end({ timeout: 1 }); process.exit(0); }).catch(() => process.exit(1));
" 2>/dev/null; do
  i=$((i + 1))
  if [ "$i" -ge 60 ]; then
    echo "[entrypoint] database not ready after 60 attempts" >&2
    exit 1
  fi
  sleep 2
done
echo "[entrypoint] database is ready"

echo "[entrypoint] applying schema (drizzle-kit push)..."
# non-interactive push for first boot
if npx drizzle-kit push --help 2>&1 | grep -q -- '--force'; then
  npx drizzle-kit push --force
else
  # older/newer kits: pipe yes if prompted
  yes | npx drizzle-kit push || npx drizzle-kit push
fi

if [ "${RUN_SEED:-true}" = "true" ]; then
  echo "[entrypoint] seeding demo data (idempotent)..."
  node scripts/seed.js || echo "[entrypoint] seed skipped/failed (non-fatal)"
fi

echo "[entrypoint] starting Next.js on :${PORT:-3000}"
exec npx next start -H 0.0.0.0 -p "${PORT:-3000}"
