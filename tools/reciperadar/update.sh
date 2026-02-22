#!/usr/bin/env bash
# Update local RecipeRadar stack: pull latest images and rebuild API from upstream.
# Run monthly (e.g. via cron or GitHub Actions on a self-hosted runner).
# Usage: from repo root, ./tools/reciperadar/update.sh

set -e
cd "$(dirname "$0")"

echo "Pulling latest OpenSearch image..."
docker compose pull opensearch 2>/dev/null || true

echo "Rebuilding API from upstream (openculinary/api main)..."
docker compose build --no-cache api

echo "Recreating containers..."
docker compose up -d --force-recreate

echo "RecipeRadar stack updated."
