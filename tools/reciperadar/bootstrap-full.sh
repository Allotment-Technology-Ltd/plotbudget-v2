#!/usr/bin/env bash
# Full automated RecipeRadar setup: clone if needed, start stack, optional cron + webhook.
# Generates webhook secret and starts webhook in background; prints GitHub secrets to add.
# Run from anywhere; set REPO_URL if not inside a plotbudget clone.
#
# Usage:
#   ./tools/reciperadar/bootstrap-full.sh
#   REPO_URL=https://github.com/Allotment-Technology-Ltd/plotbudget-v2.git REPO_PATH=/opt/plotbudget ./tools/reciperadar/bootstrap-full.sh
#
# Optional env:
#   REPO_URL                    - Git clone URL (required if not in repo)
#   REPO_PATH                   - Where to clone or repo path (default: current dir if in repo, else /opt/plotbudget)
#   BRANCH                      - Branch (default: main)
#   INSTALL_CRON                - 1 = install monthly cron (default: 1)
#   START_WEBHOOK               - 1 = start webhook in background and print GitHub secrets (default: 1)
#   RECIPERADAR_WEBHOOK_PUBLIC_URL - Public URL for webhook (e.g. https://my-server:9090/update). If unset, prints placeholder.

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  REPO_ROOT="${REPO_PATH:-$(git rev-parse --show-toplevel)}"
  REPO_URL="${REPO_URL:-$(git remote get-url origin 2>/dev/null || true)}"
else
  REPO_ROOT="${REPO_PATH:-/opt/plotbudget}"
  REPO_URL="${REPO_URL:-}"
fi

BRANCH="${BRANCH:-main}"
INSTALL_CRON="${INSTALL_CRON:-1}"
START_WEBHOOK="${START_WEBHOOK:-1}"

if [[ ! -f "$REPO_ROOT/tools/reciperadar/docker-compose.yml" ]]; then
  if [[ -z "$REPO_URL" ]]; then
    echo "Error: not in a plotbudget repo and REPO_URL not set."
    echo "Example: REPO_URL=https://github.com/Allotment-Technology-Ltd/plotbudget-v2.git REPO_PATH=/opt/plotbudget $0"
    exit 1
  fi
  echo "Cloning plotbudget into $REPO_ROOT..."
  mkdir -p "$(dirname "$REPO_ROOT")"
  if [[ -d "$REPO_ROOT" && -n "$(ls -A "$REPO_ROOT" 2>/dev/null)" ]]; then
    echo "Error: $REPO_ROOT exists and is not empty."
    exit 1
  fi
  git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$REPO_ROOT"
  cd "$REPO_ROOT"
else
  echo "Using repo at $REPO_ROOT"
  cd "$REPO_ROOT"
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
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

WEBHOOK_SECRET=""
if [[ "$START_WEBHOOK" == "1" ]]; then
  WEBHOOK_DIR="$REPO_ROOT/tools/reciperadar"
  ENV_WEBHOOK="$WEBHOOK_DIR/.env.webhook"
  if [[ -f "$ENV_WEBHOOK" ]]; then
    # Reuse existing secret so GitHub secrets don't need changing
    WEBHOOK_SECRET="$(grep -E '^RECIPERADAR_UPDATE_SECRET=' "$ENV_WEBHOOK" | cut -d= -f2- | tr -d '"')"
  fi
  if [[ -z "$WEBHOOK_SECRET" ]]; then
    WEBHOOK_SECRET="$(openssl rand -hex 24)"
    mkdir -p "$WEBHOOK_DIR"
    echo "RECIPERADAR_UPDATE_SECRET=$WEBHOOK_SECRET" > "$ENV_WEBHOOK"
    echo "RECIPERADAR_UPDATE_PORT=9090" >> "$ENV_WEBHOOK"
    echo "Created $ENV_WEBHOOK (do not commit)."
  fi
  export RECIPERADAR_UPDATE_SECRET="$WEBHOOK_SECRET"
  export RECIPERADAR_UPDATE_PORT="9090"
  PID_FILE="$WEBHOOK_DIR/.update-webhook.pid"
  if [[ -f "$PID_FILE" ]]; then
    OLD_PID="$(cat "$PID_FILE")"
    if kill -0 "$OLD_PID" 2>/dev/null; then
      echo "Update webhook already running (PID $OLD_PID)."
    else
      rm -f "$PID_FILE"
    fi
  fi
  if [[ ! -f "$PID_FILE" ]]; then
    cd "$REPO_ROOT" && nohup node tools/reciperadar/update-webhook.js >> "$WEBHOOK_DIR/webhook.log" 2>&1 &
    echo $! > "$PID_FILE"
    echo "Update webhook started (PID $(cat "$PID_FILE")). Log: $WEBHOOK_DIR/webhook.log"
  fi
  WEBHOOK_BASE="${RECIPERADAR_WEBHOOK_PUBLIC_URL:-http://localhost:9090/update}"
  echo ""
  echo "--- Add these GitHub repo secrets (Settings → Secrets and variables → Actions) ---"
  echo "RECIPERADAR_UPDATE_WEBHOOK_URL = $WEBHOOK_BASE"
  echo "RECIPERADAR_UPDATE_SECRET      = $WEBHOOK_SECRET"
  echo "--- End ---"
fi

echo ""
echo "RecipeRadar is running. API: http://localhost:8000"
echo "Set RECIPERADAR_API_BASE_URL to this host's URL in your PLOT app (e.g. Vercel env)."
