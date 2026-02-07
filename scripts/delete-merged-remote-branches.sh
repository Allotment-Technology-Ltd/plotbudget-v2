#!/usr/bin/env bash
# Delete remote branches that are already merged into main.
# Run from repo root: ./scripts/delete-merged-remote-branches.sh
# Requires: git push access to origin.

set -e
cd "$(dirname "$0")/.."

git fetch origin --prune 2>/dev/null || true

for b in \
  feat/auth-feature-flags \
  feat/automated-test-setup \
  feat/budget-cycle-income-sources \
  feat/partner-invite-link-only \
  feat/production-infrastructure \
  feat/retro-80s-avatar \
  fix/bug-fixes-and-feedback \
  fix/partner-e2e-failures \
  fix/partner-invite-accept-error \
  fix/partner-invite-email \
  phase-4b-dashboard \
  vercel/vercel-speed-insights-to-nextj-knh2fh
do
  if git ls-remote --exit-code --heads origin "$b" >/dev/null 2>&1; then
    echo "Deleting origin/$b ..."
    git push origin --delete "$b" || echo "  (skip: failed or already gone)"
  fi
done

echo "Done. Pruning local refs to stale remotes..."
git fetch origin --prune
