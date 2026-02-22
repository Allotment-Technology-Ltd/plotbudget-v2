# RecipeRadar self-hosting (What can I cook?)

PLOT’s **“What can I cook?”** feature can use [RecipeRadar](https://reciperadar.com) (OpenCulinary, AGPL) for recipe suggestions by ingredients. Alternatively you can use Spoonacular with an API key (see DEPLOYMENT.md); no self-hosting required. This page describes RecipeRadar: you can use the public service or self-host the API.

## Why you see "No web suggestions"

The **public site reciperadar.com does not expose the RecipeRadar API** (requests to `/recipes/search` return 404). So web suggestions only work when you point the app at a **self-hosted** RecipeRadar API:

- **Local:** From the plotbudget repo root run `./tools/reciperadar/run-from-repo.sh start` (or `cd tools/reciperadar && docker compose up -d`), then in `apps/web/.env.local` set `RECIPERADAR_API_BASE_URL=http://localhost:8000`. The recipe index starts empty until you populate it (see Option B).
- **Production:** Deploy RecipeRadar from the Git repo (clone plotbudget on a VPS or use Railway/Fly with the repo); run `./tools/reciperadar/run-from-repo.sh start`. Then set `RECIPERADAR_API_BASE_URL` in Vercel to that instance's **public** URL.

If the env var is unset or the URL returns 404, the UI shows the message to set it to a self-hosted RecipeRadar API URL.

## Production: works for all users

The integration is **server-side**: the Next.js API route `/api/recipes/suggest-external` runs on Vercel (or your host) and reads `RECIPERADAR_API_BASE_URL` from the **environment**. There is a single value per deployment.

- **All users** in that environment use the **same** RecipeRadar URL. Set `RECIPERADAR_API_BASE_URL` in Vercel (Production) to your **self-hosted** RecipeRadar API URL (must be reachable from the internet, not localhost). No subdomain required unless you want a custom URL; see below.

## Do I need to set up a subdomain?

**No.** You only need a subdomain if you want a custom URL (e.g. reciperadar.plotbudget.com). Otherwise use the URL your host gives you.

**Only if you self-host and want a custom URL** (e.g. `https://reciperadar.plotbudget.com`):

1. Deploy RecipeRadar to a host (VPS, Railway, Fly.io, etc.) and note the URL they give you (e.g. `https://reciperadar-xxx.railway.app`).
2. **Optional subdomain:** In your DNS (where you manage plotbudget.com), add a **CNAME**: `reciperadar` → the host's URL (e.g. `reciperadar-xxx.railway.app`). Then in the host's dashboard, add **reciperadar.plotbudget.com** as a custom domain. After that, set `RECIPERADAR_API_BASE_URL=https://reciperadar.plotbudget.com` in Vercel.
3. If you skip the subdomain, just set `RECIPERADAR_API_BASE_URL` to the URL from step 1 (e.g. the Railway/Fly URL).

## Options

| Option | Effort | Best for |
|--------|--------|----------|
| **A. Public reciperadar.com** | N/A | The public site does not expose the API; use B or C. |
| **B. Minimal Docker stack** | Low | Local/dev; empty index until you add data |
| **C. Full OpenCulinary stack** | High | Production self-host; full crawl & index |

---

## A. Public RecipeRadar (not available)

The public site reciperadar.com does **not** expose the API (`/recipes/search` returns 404). Use Option B or C to self-host, then set `RECIPERADAR_API_BASE_URL`. If you have a third-party RecipeRadar instance URL:

1. Set in your server environment (e.g. Vercel or `.env.local` for `apps/web`):

   ```bash
   RECIPERADAR_API_BASE_URL=https://api.reciperadar.com
   ```

   (Use the actual API base URL; if it’s the same as the website, `https://reciperadar.com` may work.)

2. Optional: if recipe links use a different base URL:

   ```bash
   RECIPERADAR_RECIPE_BASE_URL=https://reciperadar.com
   ```

3. Restart the app. “What can I cook?” will show “More ideas from the web” when ingredients are entered (and the API returns results).

No API key is required in PLOT’s integration.

---

## B. Minimal Docker stack (local / dev)

A minimal self-hosted setup runs only the RecipeRadar **API** and **OpenSearch**. The API serves search and recipe-by-id; the index starts **empty** until you populate it (e.g. via OpenCulinary’s backend/crawler or an index snapshot).

### Prerequisites

- Docker and Docker Compose
- (Optional) Git, to build the API image from source

### Steps

1. From the repo root:

   ```bash
   cd tools/reciperadar
   docker compose up -d
   ```

2. Wait for OpenSearch and the API to be healthy (API on port **8000**).

3. In `apps/web`, set:

   ```bash
   RECIPERADAR_API_BASE_URL=http://localhost:8000
   RECIPERADAR_RECIPE_BASE_URL=http://localhost:8000
   ```

   For a browser on the same machine, use `http://localhost:8000`. For a containerized or remote app, use the host/URL that can reach the API.

4. Run the PLOT web app and open “What can I cook?”. Searches will hit your local API; with an empty index, results will be empty until the index is populated.

### Populating the recipe index

The minimal stack does **not** run the OpenCulinary backend or crawler. To get real recipe data you must either:

- Follow **Option C** (full stack) to run the crawler and backend workers, or  
- Import an existing OpenSearch recipe index (if you have a snapshot or export from another RecipeRadar instance).

See [OpenCulinary infrastructure](https://codeberg.org/openculinary/infrastructure) and [backend](https://github.com/openculinary/backend) for how the recipe index is built and updated.

---

## C. Full OpenCulinary stack (production self-host)

For a full self-hosted RecipeRadar (search, crawl, and indexing):

1. Use the official **[RecipeRadar infrastructure](https://codeberg.org/openculinary/infrastructure)** docs (Ubuntu, Kubernetes, OpenSearch, PostgreSQL, RabbitMQ, HAProxy, etc.).
2. Deploy the [API](https://github.com/openculinary/api), [backend](https://github.com/openculinary/backend), and other components per that repo and the infrastructure docs.
3. Point PLOT at your deployed API:

   ```bash
   RECIPERADAR_API_BASE_URL=https://your-reciperadar-api.example.com
   RECIPERADAR_RECIPE_BASE_URL=https://your-reciperadar-frontend.example.com
   ```

---

## Run from Git and monthly update

RecipeRadar is intended to be **run from the plotbudget Git repo**: clone the repo on the host (local or VPS), then use the scripts under `tools/reciperadar/`:

- **Start:** `./tools/reciperadar/run-from-repo.sh start` (from repo root).
- **Update (manual):** `./tools/reciperadar/run-from-repo.sh update` (git pull + rebuild/restart).
- **Monthly from Git:** Use the update webhook so GitHub Actions (schedule or manual) can trigger the update on your host without a self-hosted runner. See [tools/reciperadar/README.md](../tools/reciperadar/README.md) for webhook setup and repo secrets (`RECIPERADAR_UPDATE_WEBHOOK_URL`, `RECIPERADAR_UPDATE_SECRET`). Optional systemd unit: `tools/reciperadar/reciperadar-update-webhook.service.example`.

## PLOT configuration summary

| Variable | Required | Description |
|---------|----------|-------------|
| `RECIPERADAR_API_BASE_URL` | Yes (for web suggestions) | Base URL of the RecipeRadar API (e.g. `http://localhost:8000` or `https://api.reciperadar.com`). If unset, “What can I cook?” does not call an external API. |
| `RECIPERADAR_RECIPE_BASE_URL` | No | Base URL for “View on RecipeRadar” links. If unset, PLOT uses the API base or `https://reciperadar.com`. |

**No API key is used** — the integration is URL-based only.

---

## Vercel (and other server env)

To enable "What can I cook?" web suggestions on **Vercel** (Production or Preview), add the URL(s) below. The **same** URL is used for every user in that environment (no per-user config).

**Full production checklist (deploy RecipeRadar → get URL → set in Vercel):** see **[RECIPERADAR-PRODUCTION.md](./RECIPERADAR-PRODUCTION.md)**.

1. In the Vercel project: **Settings → Environment Variables**.
2. Add (for the environments where you want suggestions). Use a **public** URL (not localhost) so Vercel's servers can reach RecipeRadar:

   | Name | Value | Environments |
   |------|--------|--------------|
   | `RECIPERADAR_API_BASE_URL` | Your RecipeRadar API base URL (e.g. `https://reciperadar.com` or your self-hosted URL) | Production, Preview (optional) |
   | `RECIPERADAR_RECIPE_BASE_URL` | (Optional) Base URL for recipe links if different from API | Production, Preview (optional) |

3. Redeploy (or push a commit) so the new variables are applied.

You do **not** need to add any API key or secret for RecipeRadar. If you leave these variables unset, the feature simply won't call an external API and "More ideas from the web" will show the configuration message instead of results.
