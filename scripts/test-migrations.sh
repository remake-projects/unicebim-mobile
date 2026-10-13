#!/usr/bin/env bash
# Apply supabase/migrations to a throwaway local Postgres and run supabase/tests/ledger.test.sql.
# Requires Postgres binaries (initdb, pg_ctl, psql) on PATH, e.g. `brew install postgresql@16`.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d /tmp/ucdb.XXXX)" # short path: Unix socket paths are limited to ~100 bytes
PORT="${PGPORT_TEST:-54329}"
export LC_ALL="${LC_ALL:-en_US.UTF-8}" LANG="${LANG:-en_US.UTF-8}"

cleanup() {
  pg_ctl -D "$WORK/data" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT

initdb -D "$WORK/data" -U postgres --auth=trust --locale=C --encoding=UTF8 >/dev/null
pg_ctl -D "$WORK/data" -o "-p $PORT -k $WORK -c listen_addresses=''" -l "$WORK/log" -w start >/dev/null

PSQL=(psql -h "$WORK" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q -X)

"${PSQL[@]}" -f "$ROOT/supabase/tests/supabase_stub.sql"

migrations=("$ROOT"/supabase/migrations/*.sql)
PGOPTIONS="-c client_min_messages=warning" "${PSQL[@]}" -f "${migrations[0]}"   # baseline (web schema)
"${PSQL[@]}" -f "$ROOT/supabase/tests/legacy_seed.sql"                         # web-era data
# The baseline is applied to projects that already ran docs/supabase.sql, so it must be idempotent.
PGOPTIONS="-c client_min_messages=warning" "${PSQL[@]}" -f "${migrations[0]}"
for f in "${migrations[@]:1}"; do
  PGOPTIONS="-c client_min_messages=warning" "${PSQL[@]}" -f "$f"
done
# Later migrations must also be safe to re-run.
for f in "${migrations[@]:1}"; do
  PGOPTIONS="-c client_min_messages=warning" "${PSQL[@]}" -f "$f"
done

"${PSQL[@]}" -f "$ROOT/supabase/tests/ledger.test.sql" 2>&1 | sed -n 's/^psql:.*NOTICE:  //p; /ERROR/p'
echo "migration tests passed"
