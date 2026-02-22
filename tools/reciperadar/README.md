# RecipeRadar minimal stack (API + OpenSearch)

Runs the [RecipeRadar API](https://github.com/openculinary/api) (OpenCulinary) and OpenSearch for PLOT’s **“What can I cook?”** external suggestions. The recipe index starts **empty**; see [Populating the index](#populating-the-index) and [docs/RECIPERADAR-SELF-HOSTING.md](../../docs/RECIPERADAR-SELF-HOSTING.md).

**Run everything from the Git repo** (clone plotbudget, then use the scripts below). The repo is the source of truth.

## Quick start

**Fully automated (no manual config):** From repo root run `./tools/reciperadar/bootstrap-full.sh`. It starts the stack, installs monthly cron, and starts the update webhook with a generated secret. See [SETUP.md](SETUP.md) for one-liners (including from a fresh server) and optional GitHub Actions secrets.

From repo root (after cloning plotbudget):

```bash
./tools/reciperadar/run-from-repo.sh start
```

Or:

```bash
cd tools/reciperadar
docker compose up -d
```

- **API:** http://localhost:8000 (e.g. `GET /recipes/search?ingredients[]=chicken&limit=5`)
- **OpenSearch:** http://localhost:9200 (dev only; no auth)

**Start / update from repo:** `./tools/reciperadar/run-from-repo.sh start` or `run-from-repo.sh update` (update does git pull then rebuild/restart). See [Scheduled update](#scheduled-update-monthly) for monthly options.

Then in `apps/web` set:

```bash
RECIPERADAR_API_BASE_URL=http://localhost:8000
RECIPERADAR_RECIPE_BASE_URL=http://localhost:8000
```

## Build args

- `API_REV` — Git branch/tag of [openculinary/api](https://github.com/openculinary/api) to build (default: `main`).

Example:

```bash
docker compose build --build-arg API_REV=main
docker compose up -d
```

## Populating the index

This stack does **not** run the OpenCulinary backend or crawler. To get recipe data:

1. Use the [full RecipeRadar infrastructure](https://codeberg.org/openculinary/infrastructure) (Kubernetes, backend, crawler), or  
2. Import an existing OpenSearch recipe index (e.g. from a snapshot) into the `recipes` index.

Until the index is populated, `/recipes/search` returns `{"total":0,"results":[]}`.

## Run from Git (start / update)

All commands are intended to be run from the **plotbudget repo root** (where you cloned the repo).

| Command | Purpose |
|--------|--------|
| `./tools/reciperadar/run-from-repo.sh start` | Start the stack (docker compose up -d). |
| `./tools/reciperadar/run-from-repo.sh update` | Pull latest from Git, then pull images, rebuild API, recreate containers. |
| `./tools/reciperadar/update.sh` | Update only (no git pull). Run from repo root or from `tools/reciperadar`. |

## Scheduled update (monthly)

To keep the stack updated from Git on a schedule (e.g. monthly), use one of the following.

**Option A: GitHub Actions + webhook (run from Git, no self-hosted runner)**

1. On the host that runs RecipeRadar (VPS or always-on machine), start the update webhook server (Node 18+):

   ```bash
   cd /path/to/plotbudget
   RECIPERADAR_UPDATE_SECRET="$(openssl rand -hex 24)"
   RECIPERADAR_UPDATE_PORT=9090
   node tools/reciperadar/update-webhook.js
   ```

   Run it in the background (e.g. `nohup ... &`, or a systemd unit, or screen/tmux). The server listens for POST with `Authorization: Bearer <secret>` and runs the update script.

2. In the **plotbudget** GitHub repo: **Settings → Secrets and variables → Actions**, add:
   - `RECIPERADAR_UPDATE_WEBHOOK_URL` = `https://your-host:9090/update` (or `http://` if no TLS)
   - `RECIPERADAR_UPDATE_SECRET` = the same secret you used above

3. The workflow `.github/workflows/update-reciperadar.yml` runs on the 1st of each month (and can be triggered manually). It will call your webhook; the host runs the actual update.

**Option B: Cron on the host**

On the machine where RecipeRadar runs, from repo root:

```bash
./tools/reciperadar/install-cron.sh
```

Adds a cron job (1st of each month at 00:00). To remove: `crontab -e` and delete the line with `reciperadar/update.sh`.

**Option C: Self-hosted runner**

Register a [self-hosted runner](https://docs.github.com/en/actions/agents/self-hosted-runners) on the host that runs RecipeRadar and has Docker. Then change the workflow to run on that runner and execute `./tools/reciperadar/update.sh` instead of calling the webhook (see workflow comments).

## Full deployment (VPS or server)

On a fresh host that has **Docker** (and **Git**), you can clone the repo and start the stack in one go. Optionally install cron or run the webhook so GitHub Actions can trigger monthly updates.

**One-time bootstrap (clone + start):**

```bash
# Replace with your plotbudget repo URL (HTTPS or SSH).
export REPO_URL="https://github.com/YourOrg/plotbudget.git"
export REPO_PATH="/opt/plotbudget"   # where to clone (default /opt/plotbudget)
./tools/reciperadar/bootstrap-server.sh
```

If you already have the repo cloned, run from repo root (no `REPO_URL`/`REPO_PATH` needed):

```bash
./tools/reciperadar/bootstrap-server.sh
```

**Bootstrap options (env vars):**

| Variable | Purpose |
|----------|--------|
| `REPO_URL` | Git clone URL (required if not already inside a clone). |
| `REPO_PATH` | Where to clone or path to existing repo (default: `/opt/plotbudget` or current dir). |
| `BRANCH` | Branch to clone (default: `main`). |
| `INSTALL_CRON=1` | Install monthly cron after starting the stack. |
| `START_WEBHOOK=1` | Print instructions to run the update webhook and set GitHub secrets. |

**After bootstrap:** Point your PLOT app at this host (e.g. set `RECIPERADAR_API_BASE_URL=https://your-server:8000` in Vercel). For monthly updates from Git, either set `INSTALL_CRON=1` and re-run bootstrap, or run `./tools/reciperadar/install-cron.sh` from repo root, or set up the webhook (see Option A above) and add the two repo secrets.

**Webhook env:** Optional `.env.webhook` (copy from `.env.webhook.example`) for `RECIPERADAR_UPDATE_SECRET` and `RECIPERADAR_UPDATE_PORT` when running the webhook server. Do not commit `.env.webhook`. The full-auto script `bootstrap-full.sh` creates `.env.webhook` and starts the webhook for you.

**Step-by-step:** See [SETUP.md](SETUP.md) for automated one-command setup, the **run_reciperadar_bootstrap** MCP tool (Cursor), and manual steps.

## License

RecipeRadar (OpenCulinary) is AGPL-3.0. This tooling is for running the upstream API; see [RECIPERADAR-SELF-HOSTING.md](../../docs/RECIPERADAR-SELF-HOSTING.md) for options.
