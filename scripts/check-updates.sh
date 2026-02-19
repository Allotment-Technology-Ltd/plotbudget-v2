#!/usr/bin/env bash
# Print outdated pnpm packages and CLI upgrade hints. No changes made.
# Usage: ./scripts/check-updates.sh (from repo root)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$ROOT_DIR"

echo "=== pnpm outdated (workspace packages) ==="
pnpm outdated 2>/dev/null || true
echo ""

echo "=== CLI versions and upgrade hints ==="
if command -v supabase &>/dev/null; then
  echo "Supabase CLI: $(supabase --version 2>/dev/null || echo 'unknown')"
  echo "  → Upgrade: brew upgrade supabase   (or npm update -g supabase)"
else
  echo "Supabase CLI: not installed"
  echo "  → Install: https://supabase.com/docs/guides/cli/getting-started"
fi
echo ""

if command -v polar &>/dev/null; then
  echo "Polar CLI: $(polar --version 2>/dev/null || echo 'unknown')"
  echo "  → Upgrade: curl -fsSL https://polar.sh/install.sh | bash"
else
  echo "Polar CLI: not installed (optional; only needed for local webhook testing)"
  echo "  → Install: https://polar.sh/docs (Integrating Webhooks Locally)"
fi
echo ""

echo "Dependabot handles npm and GitHub Actions weekly. See docs/KEEPING-DEPENDENCIES-UP-TO-DATE.md"
