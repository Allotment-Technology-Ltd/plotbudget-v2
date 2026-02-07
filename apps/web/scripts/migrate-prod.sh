#!/bin/bash
# Production migration script - USE WITH CAUTION
# Run from repo root. Requires: SUPABASE_PROD_PASSWORD, SUPABASE_PROD_PROJECT (project ref, e.g. xyzabc).
# Optional: create .env.production.local at repo root with these vars (gitignored) and the script will load them.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Script lives at apps/web/scripts/, so repo root is three levels up
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
ENV_FILE="$REPO_ROOT/.env.production.local"
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
  # Fallback: read SUPABASE_PROD_DATABASE_URL without sourcing (avoids # or $ in password breaking the value)
  if [ -z "$SUPABASE_PROD_DATABASE_URL" ] && grep -q '^SUPABASE_PROD_DATABASE_URL=' "$ENV_FILE"; then
    SUPABASE_PROD_DATABASE_URL="$(grep '^SUPABASE_PROD_DATABASE_URL=' "$ENV_FILE" | sed 's/^SUPABASE_PROD_DATABASE_URL=//' | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")"
    export SUPABASE_PROD_DATABASE_URL
  fi
fi

echo "🚨 WARNING: You are about to migrate PRODUCTION database"
echo "Project: plotbudget-prod (ref: \${SUPABASE_PROD_PROJECT})"
read -p "Type 'yes' to continue: " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Migration cancelled"
  exit 1
fi

# Prefer full URI (e.g. Session pooler) to avoid IPv6 issues with direct db.*.supabase.co
if [ -n "$SUPABASE_PROD_DATABASE_URL" ]; then
  export DATABASE_URL="$SUPABASE_PROD_DATABASE_URL"
elif [ -n "$SUPABASE_PROD_PROJECT" ] && [ -n "$SUPABASE_PROD_PASSWORD" ]; then
  export DATABASE_URL="postgresql://postgres:${SUPABASE_PROD_PASSWORD}@db.${SUPABASE_PROD_PROJECT}.supabase.co:5432/postgres"
else
  echo "❌ Set SUPABASE_PROD_DATABASE_URL (full URI) or both SUPABASE_PROD_PROJECT and SUPABASE_PROD_PASSWORD"
  echo "   Expected file: $ENV_FILE"
  echo "   If the file exists and has SUPABASE_PROD_DATABASE_URL, put the value in single quotes if the password contains # or \$"
  exit 1
fi

echo "📦 Running migrations..."
supabase db push --db-url "$DATABASE_URL" --include-all

echo "✅ Migration complete"
[ -n "$SUPABASE_PROD_PROJECT" ] && echo "🔍 Verify at: https://supabase.com/dashboard/project/${SUPABASE_PROD_PROJECT}"
