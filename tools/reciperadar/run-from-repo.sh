#!/usr/bin/env bash
# Run RecipeRadar from the Git repo: start or update the stack.
# Usage: from repo root, ./tools/reciperadar/run-from-repo.sh [start|update]
#   start  (default) - docker compose up -d
#   update            - git pull (optional), then ./update.sh (pull images, rebuild API, recreate)
# Requires: run from plotbudget repo root, Docker available.

set -e
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

if [[ ! -f "tools/reciperadar/docker-compose.yml" ]]; then
  echo "Error: run from plotbudget repo root (directory containing tools/reciperadar/docker-compose.yml)."
  exit 1
fi

MODE="${1:-start}"

if [[ "$MODE" == "update" ]]; then
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "Pulling latest from Git..."
    git pull --ff-only || true
  fi
  exec "$REPO_ROOT/tools/reciperadar/update.sh"
fi

if [[ "$MODE" != "start" ]]; then
  echo "Usage: $0 [start|update]"
  exit 1
fi

echo "Starting RecipeRadar from repo..."
cd "$REPO_ROOT/tools/reciperadar"
docker compose up -d
echo "RecipeRadar stack started. API: http://localhost:8000"
