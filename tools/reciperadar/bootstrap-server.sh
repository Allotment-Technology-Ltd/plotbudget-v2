#!/usr/bin/env bash
# Bootstrap RecipeRadar on a server: clone the repo if needed, then start the stack.
# Run on a host that has Docker (and optionally Node 18+ for the webhook).
#
# Usage:
#   REPO_URL=https://github.com/YOUR_ORG/plotbudget.git REPO_PATH=/opt/plotbudget ./bootstrap-server.sh
#   Or run from inside an existing clone (REPO_PATH not set): ./tools/reciperadar/bootstrap-server.sh
#
# Optional env:
#   REPO_URL     - Git clone URL (default: from origin if already in repo, else must set)
#   REPO_PATH    - Where to clone or where repo is (default: current dir if in repo, else /opt/plotbudget)
#   BRANCH       - Branch to use (default: main)
#   INSTALL_CRON - Set to 1 to install monthly cron after start
#   START_WEBHOOK - Set to 1 to print commands to start the update webhook (you run them)

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Detect repo root if we're inside a clone
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  REPO_ROOT="${REPO_PATH:-$(git rev-parse --show-toplevel)}"
  REPO_URL="${REPO_URL:-$(git remote get-url origin 2>/dev/null || true)}"
else
  REPO_ROOT="${REPO_PATH:-/opt/plotbudget}"
  REPO_URL="${REPO_URL:-}"
fi

BRANCH="${BRANCH:-main}"

if [[ ! -f "$REPO_ROOT/tools/reciperadar/docker-compose.yml" ]]; then
  if [[ -z "$REPO_URL" ]]; then
    echo "Error: not in a plotbudget repo and REPO_URL not set. Clone the repo first or set REPO_URL."
    echo "Example: REPO_URL=https://github.com/YourOrg/plotbudget.git REPO_PATH=/opt/plotbudget $0"
    exit 1
  fi
  echo "Cloning plotbudget into $REPO_ROOT..."
  mkdir -p "$(dirname "$REPO_ROOT")"
  if [[ -d "$REPO_ROOT" && -n "$(ls -A "$REPO_ROOT" 2>/dev/null)" ]]; then
    echo "Error: $REPO_ROOT exists and is not empty. Use REPO_PATH to point to an existing clone or an empty dir."
    exit 1
  fi
  git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$REPO_ROOT"
  cd "$REPO_ROOT"
else
  echo "Using existing repo at $REPO_ROOT"
  cd "$REPO_ROOT"
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "Pulling latest..."
    git pull --ff-only || true
  fi
fi

chmod +x "$REPO_ROOT/tools/reciperadar/update.sh" 2>/dev/null || true
chmod +x "$REPO_ROOT/tools/reciperadar/run-from-repo.sh" 2>/dev/null || true

echo "Starting RecipeRadar stack..."
"$REPO_ROOT/tools/reciperadar/run-from-repo.sh" start

if [[ "$INSTALL_CRON" == "1" ]]; then
  echo "Installing monthly cron..."
  "$REPO_ROOT/tools/reciperadar/install-cron.sh"
fi

if [[ "$START_WEBHOOK" == "1" ]]; then
  echo ""
  echo "To run the update webhook (for GitHub Actions), generate a secret and run:"
  echo "  export RECIPERADAR_UPDATE_SECRET=\$(openssl rand -hex 24)"
  echo "  export RECIPERADAR_UPDATE_PORT=9090"
  echo "  cd $REPO_ROOT && node tools/reciperadar/update-webhook.js"
  echo "Then add RECIPERADAR_UPDATE_WEBHOOK_URL and RECIPERADAR_UPDATE_SECRET to GitHub repo secrets."
fi

echo ""
echo "RecipeRadar is running. API: http://localhost:8000"
echo "Set RECIPERADAR_API_BASE_URL to this host's URL (e.g. https://this-server:8000) in your PLOT app."
