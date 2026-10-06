#!/usr/bin/env bash
set -euo pipefail

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)

fail() {
  echo "Preview database: $1" >&2
  exit 1
}

prisma() {
  pnpm --dir "$root/packages/infra/db-schema" exec prisma "$@"
}

read -r -d '' is_preview <<'SQL' || true
DO $$
BEGIN
  IF shobj_description(
    (SELECT oid FROM pg_database WHERE datname = current_database()),
    'pg_database'
  ) IS DISTINCT FROM 'giveaway-preview' THEN
    RAISE EXCEPTION 'database % has no comment giveaway-preview', current_database();
  END IF;
END
$$;
SQL

check() {
  local name
  for name in POSTGRES_URL POSTGRES_URL_NON_POOLING; do
    if [ -z "${!name:-}" ]; then
      fail "$name is not set"
    fi
    if ! prisma db execute --url "${!name}" --stdin <<<"$is_preview"; then
      fail "$name is not the preview database. Stop: this could be production. On the preview database, run once: COMMENT ON DATABASE <name> IS 'giveaway-preview'"
    fi
  done
}

case "${1:-}" in
build)
  if [ "${VERCEL_ENV:-}" != "preview" ]; then
    echo "Preview database: skip the migrations, this is not a preview build"
    exit 0
  fi
  check
  prisma migrate deploy --schema src/schema.prisma
  ;;
reset)
  check
  prisma migrate reset --schema src/schema.prisma
  ;;
*)
  echo "Usage: $0 build|reset" >&2
  exit 2
  ;;
esac
