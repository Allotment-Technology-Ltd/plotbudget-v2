#!/usr/bin/env bash
# Install a monthly cron job to run tools/reciperadar/update.sh.
# Run once from repo root: ./tools/reciperadar/install-cron.sh
# Removes any existing RecipeRadar update line and adds the current repo path.

set -e
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
UPDATE_SCRIPT="$REPO_ROOT/tools/reciperadar/update.sh"
CRON_LINE="0 0 1 * * $UPDATE_SCRIPT  # RecipeRadar monthly update"

if [[ ! -x "$UPDATE_SCRIPT" ]]; then
  echo "Making update.sh executable..."
  chmod +x "$UPDATE_SCRIPT"
fi

# Remove any existing RecipeRadar update cron line, then add current one
( crontab -l 2>/dev/null | grep -v "reciperadar/update.sh" | grep -v "RecipeRadar monthly"; echo "$CRON_LINE" ) | crontab -

echo "Cron installed: RecipeRadar stack will update at 00:00 on the 1st of each month."
echo "  Entry: $CRON_LINE"
echo "To remove later: crontab -e  # delete the line containing reciperadar/update.sh"
