#!/bin/bash
# One-time repair: mark remote migrations as reverted so db push can re-run (fixes version mismatch after renames).
# Run from repo root. Uses same .env.production.local as migrate-prod.sh.
# After this, run: echo yes | bash apps/web/scripts/migrate-prod.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
ENV_FILE="$REPO_ROOT/.env.production.local"
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
  if [ -z "$SUPABASE_PROD_DATABASE_URL" ] && grep -q '^SUPABASE_PROD_DATABASE_URL=' "$ENV_FILE"; then
    SUPABASE_PROD_DATABASE_URL="$(grep '^SUPABASE_PROD_DATABASE_URL=' "$ENV_FILE" | sed 's/^SUPABASE_PROD_DATABASE_URL=//' | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")"
    export SUPABASE_PROD_DATABASE_URL
  fi
fi

if [ -z "$SUPABASE_PROD_DATABASE_URL" ]; then
  echo "❌ Set SUPABASE_PROD_DATABASE_URL in $ENV_FILE"
  exit 1
fi

cd "$REPO_ROOT"
echo "Repairing remote migration history: marking 20240206 and 20250207 as reverted..."
supabase migration repair --db-url "$SUPABASE_PROD_DATABASE_URL" --status reverted 20240206 20250207
echo "✅ Done. Now run: echo yes | bash apps/web/scripts/migrate-prod.sh"
