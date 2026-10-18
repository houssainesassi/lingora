#!/usr/bin/env bash
# Applies all migrations + the seed to a disposable Postgres container and runs
# the authorization test-suite. Requires Docker. Does NOT touch any Supabase
# project. The container is removed afterwards.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
IMAGE="${PG_IMAGE:-postgres:16}"
NAME="lingora-db-test-$$"
PORT="${PG_TEST_PORT:-54329}"

cleanup() { docker rm -f "$NAME" >/dev/null 2>&1 || true; }
trap cleanup EXIT

docker run -d --rm --name "$NAME" --memory=512m \
  -e POSTGRES_PASSWORD=postgres -p "127.0.0.1:${PORT}:5432" "$IMAGE" >/dev/null

for _ in $(seq 1 60); do
  if docker exec "$NAME" pg_isready -U postgres >/dev/null 2>&1; then break; fi
  sleep 1
done
sleep 1

run_sql() {
  docker exec -i "$NAME" psql -q -v ON_ERROR_STOP=1 -U postgres -d postgres "$@"
}

echo "==> Supabase stub"
run_sql < "$ROOT/supabase/tests/supabase_stub.sql"

for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "==> $(basename "$f")"
  run_sql < "$f"
done

if [[ "${SKIP_SEED:-0}" != "1" ]]; then
  echo "==> seed.sql"
  run_sql < "$ROOT/supabase/seed.sql"
  # Tests expect a clean slate of users; remove the demo rows again.
  run_sql -c "delete from auth.users where email like '%@demo.lingora.invalid';"
fi

echo "==> rls_test.sql"
run_sql < "$ROOT/supabase/tests/rls_test.sql"
