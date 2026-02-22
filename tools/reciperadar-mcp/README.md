# RecipeRadar bootstrap MCP server

MCP server that exposes one tool: **run_reciperadar_bootstrap**. It runs `tools/reciperadar/bootstrap-full.sh` (clone repo if needed, start stack, install cron, start webhook) so you can deploy or reconfigure RecipeRadar from Cursor without running the script yourself.

## Setup

1. **Install dependencies** (once):

   ```bash
   cd tools/reciperadar-mcp && npm install
   ```

2. **Enable in Cursor:** The project’s `.cursor/mcp.json` registers this server. Restart Cursor (or reload the window) so it loads the MCP. Open the plotbudget repo as the workspace root.

3. **Use:** In chat, ask e.g. “Run RecipeRadar bootstrap” or “Deploy RecipeRadar”. The agent will call the tool; you can pass `repo_path` (and optionally `install_cron`, `start_webhook`) if needed.

## Tool parameters

| Parameter        | Type    | Description |
|-----------------|--------|-------------|
| `repo_path`     | string | Path to plotbudget repo (default: workspace/current directory). |
| `install_cron`  | boolean| Install monthly cron (default: true). |
| `start_webhook` | boolean| Start webhook and print GitHub secrets (default: true). |

## If the MCP doesn’t start

- Ensure Cursor was opened from the **plotbudget repo root** (so `tools/reciperadar-mcp/index.js` exists).
- Or add the server manually: **Settings → Tools & MCP → Add MCP server** → Command: `node`, Args: path to `tools/reciperadar-mcp/index.js` (absolute path if needed).

## Requirements

- Node 18+
- Docker (for the bootstrap script)
- Git (if the tool will clone the repo)
