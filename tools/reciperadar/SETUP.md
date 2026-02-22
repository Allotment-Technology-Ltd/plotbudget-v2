# RecipeRadar setup: automated vs manual

## Automated (no manual configuration)

From a machine that has **Docker**, **Git**, and **Node 18+** (for the webhook):

**If you're already inside the plotbudget repo (e.g. in Cursor):**

```bash
./tools/reciperadar/bootstrap-full.sh
```

**If you're on a fresh server (clone + start in one go):**

```bash
curl -fsSL https://raw.githubusercontent.com/Allotment-Technology-Ltd/plotbudget-v2/main/tools/reciperadar/bootstrap-full.sh -o /tmp/bootstrap-full.sh
chmod +x /tmp/bootstrap-full.sh
REPO_URL="https://github.com/Allotment-Technology-Ltd/plotbudget-v2.git" REPO_PATH="/opt/plotbudget" /tmp/bootstrap-full.sh
```

Or clone first then run from repo root:

```bash
git clone --depth 1 https://github.com/Allotment-Technology-Ltd/plotbudget-v2.git /opt/plotbudget
cd /opt/plotbudget && ./tools/reciperadar/bootstrap-full.sh
```

**What this does with no input from you:**

- Clones the repo if needed
- Starts the RecipeRadar stack (OpenSearch + API)
- Installs a monthly cron job to update the stack
- Generates a webhook secret and writes `tools/reciperadar/.env.webhook`
- Starts the update webhook server in the background (for GitHub Actions)
- Prints the two values you need for GitHub repo secrets (only step that might be “manual” if you use the webhook)

**After running:** Set `RECIPERADAR_API_BASE_URL` in your PLOT app (e.g. Vercel) to this host’s URL (e.g. `http://localhost:8000` for local, or `https://your-server:8000` for a VPS).

**Optional – GitHub Actions monthly update:**  
If the script printed “Add these GitHub repo secrets”, go to the plotbudget repo → **Settings → Secrets and variables → Actions** and add:

- `RECIPERADAR_UPDATE_WEBHOOK_URL` = the URL it printed (use your server’s public URL and port, e.g. `https://your-server:9090/update`; for local dev, GitHub cannot reach localhost so this is only for a deployed server).
- `RECIPERADAR_UPDATE_SECRET` = the secret it printed.

No other manual configuration is required.

### Run bootstrap from Cursor (MCP)

The repo includes an MCP server that exposes a single tool **run_reciperadar_bootstrap**. You can say “run RecipeRadar bootstrap” or “deploy RecipeRadar” in Cursor and the agent will call the tool so you don’t run the script yourself.

**Setup:** The project has `.cursor/mcp.json` that registers the server. Restart Cursor (or reload the window) so it picks up the MCP. Ensure the workspace is the plotbudget repo root (so `tools/reciperadar-mcp` exists). The MCP runs `tools/reciperadar/bootstrap-full.sh`; you can pass an optional `repo_path` if the agent should use a different directory.

**First-time dependency install:** From repo root run `npm install` in the MCP package once:

```bash
cd tools/reciperadar-mcp && npm install && cd ../..
```

After that, the tool is available in Cursor with no other manual configuration.

---

## Manual steps (if you prefer or need to do it by hand)

1. **Clone the repo** (if needed)  
   `git clone https://github.com/Allotment-Technology-Ltd/plotbudget-v2.git /opt/plotbudget && cd /opt/plotbudget`

2. **Start the stack**  
   `./tools/reciperadar/run-from-repo.sh start`

3. **Optional: monthly update via cron**  
   `./tools/reciperadar/install-cron.sh`

4. **Optional: webhook for GitHub Actions**  
   - Generate secret: `RECIPERADAR_UPDATE_SECRET=$(openssl rand -hex 24)`  
   - Copy `tools/reciperadar/.env.webhook.example` to `tools/reciperadar/.env.webhook` and set `RECIPERADAR_UPDATE_SECRET` (and optionally `RECIPERADAR_UPDATE_PORT=9090`)  
   - Run: `cd /path/to/plotbudget && node tools/reciperadar/update-webhook.js` (in background or via systemd; see README)  
   - Add repo secrets: `RECIPERADAR_UPDATE_WEBHOOK_URL`, `RECIPERADAR_UPDATE_SECRET`

5. **Configure PLOT app**  
   Set `RECIPERADAR_API_BASE_URL` (and optionally `RECIPERADAR_RECIPE_BASE_URL`) in your app env (e.g. Vercel).

You can also use the **RecipeRadar bootstrap MCP tool** in Cursor (see above) so the agent runs the bootstrap for you.
