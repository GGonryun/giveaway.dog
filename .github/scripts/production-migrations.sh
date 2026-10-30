#!/usr/bin/env bash
set -euo pipefail

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)

fail() {
  echo "::error::Production migrations: $1" >&2
  exit 1
}

prisma() {
  pnpm --dir "$root/packages/infra/db-schema" exec prisma "$@"
}

read -r -d '' is_not_preview <<'SQL' || true
DO $$
BEGIN
  IF shobj_description(
    (SELECT oid FROM pg_database WHERE datname = current_database()),
    'pg_database'
  ) IS NOT DISTINCT FROM 'giveaway-preview' THEN
    RAISE EXCEPTION 'database % is the preview database', current_database();
  END IF;
END
$$;
SQL

if [ -z "${POSTGRES_URL_NON_POOLING:-}" ]; then
  fail "the PRODUCTION_POSTGRES_URL_NON_POOLING secret is not set. Add the direct connection string of the production database to the production-database environment of the repository, then re-run the failed jobs of this run"
fi
export POSTGRES_URL="$POSTGRES_URL_NON_POOLING"

if ! prisma db execute --url "$POSTGRES_URL_NON_POOLING" --stdin <<<"$is_not_preview"; then
  fail "PRODUCTION_POSTGRES_URL_NON_POOLING points at the preview database (comment giveaway-preview) or cannot be reached"
fi

status=0
prisma migrate status --schema src/schema.prisma || status=$?
if [ "$status" -ne 0 ] && [ "$status" -ne 1 ]; then
  fail "prisma migrate status exited with $status"
fi

prisma migrate deploy --schema src/schema.prisma
