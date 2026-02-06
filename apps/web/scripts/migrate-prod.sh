#!/bin/bash
# Production migration script - USE WITH CAUTION
# Run from repo root. Requires: SUPABASE_PROD_PASSWORD, SUPABASE_PROD_PROJECT (project ref, e.g. xyzabc).

set -e

echo "🚨 WARNING: You are about to migrate PRODUCTION database"
echo "Project: plotbudget-prod (ref: \${SUPABASE_PROD_PROJECT})"
read -p "Type 'yes' to continue: " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Migration cancelled"
  exit 1
fi

if [ -z "$SUPABASE_PROD_PROJECT" ] || [ -z "$SUPABASE_PROD_PASSWORD" ]; then
  echo "❌ Set SUPABASE_PROD_PROJECT and SUPABASE_PROD_PASSWORD"
  exit 1
fi

export DATABASE_URL="postgresql://postgres:${SUPABASE_PROD_PASSWORD}@db.${SUPABASE_PROD_PROJECT}.supabase.co:5432/postgres"

echo "📦 Running migrations..."
supabase db push --db-url "$DATABASE_URL"

echo "✅ Migration complete"
echo "🔍 Verify at: https://supabase.com/dashboard/project/${SUPABASE_PROD_PROJECT}"
