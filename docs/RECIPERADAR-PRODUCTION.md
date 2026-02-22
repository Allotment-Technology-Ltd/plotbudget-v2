# RecipeRadar in production: get “What can I cook?” working for all users

**Simpler option (no self-hosting):** To enable web suggestions without running a server, set `SPOONACULAR_API_KEY` in Vercel (get a key at spoonacular.com/food-api). Then redeploy. No server to run. Free tier has daily limits; see Spoonacular pricing.

This checklist is for teams who prefer RecipeRadar (self-hosted). You need to (1) run RecipeRadar on a server with a **public URL**, then (2) set that URL in Vercel.

---

## Step 1: Run RecipeRadar on a server with a public URL

RecipeRadar must be reachable from the internet (Vercel’s servers will call it). You have two options.

### Option A: VPS (recommended)

Use any VPS (e.g. DigitalOcean, Hetzner, Linode, EC2) with **Docker** and **Git** installed.

1. SSH into the server.
2. Run the one-command bootstrap (clone + start + cron + webhook):

   ```bash
   curl -fsSL https://raw.githubusercontent.com/Allotment-Technology-Ltd/plotbudget-v2/main/tools/reciperadar/bootstrap-full.sh -o /tmp/bootstrap-full.sh
   chmod +x /tmp/bootstrap-full.sh
   REPO_URL="https://github.com/Allotment-Technology-Ltd/plotbudget-v2.git" REPO_PATH="/opt/plotbudget" /tmp/bootstrap-full.sh
   ```

   Or clone the repo first, then from repo root:

   ```bash
   git clone --depth 1 https://github.com/Allotment-Technology-Ltd/plotbudget-v2.git /opt/plotbudget
   cd /opt/plotbudget && ./tools/reciperadar/bootstrap-full.sh
   ```

3. Expose the API to the internet:
   - **Port 8000** = RecipeRadar API (required for PLOT).
   - Open port 8000 in the host firewall and (if applicable) the cloud security group.
   - Your **public URL** will be one of:
     - `http://YOUR_SERVER_IP:8000` (replace `YOUR_SERVER_IP` with the server’s public IP), or
     - `https://your-domain.com` if you put a reverse proxy (e.g. Caddy, nginx) with TLS in front of port 8000.

4. Confirm the API is reachable from the internet:

   ```bash
   curl -s "http://YOUR_SERVER_IP:8000/recipes/search?ingredients[]=chicken&limit=1"
   ```

   You should get JSON (e.g. `{"total":0,"results":[]}` if the index is empty). If you get “Connection refused” or timeout, fix firewall/DNS until this works.

### Option B: PaaS (Railway, Render, Fly.io, etc.)

You can run the RecipeRadar stack (API + OpenSearch) on a PaaS that supports Docker Compose or multiple services. Use that provider’s docs to:

1. Deploy from the plotbudget repo (e.g. use `tools/reciperadar/docker-compose.yml` and point the service at the repo root or a subpath).
2. Expose the API service on a **public URL** (e.g. `https://reciperadar-xxx.railway.app`).
3. Ensure the URL is reachable from outside (no private-only endpoints).

Details depend on the provider; the important part is that **the RecipeRadar API base URL** (e.g. `https://your-app.railway.app`) is publicly reachable and responds at `/recipes/search`.

---

## Step 2: Set the URL in Vercel

1. In **Vercel**: open your project → **Settings** → **Environment Variables**.
2. Add:

   | Name | Value | Environments |
   |------|--------|---------------|
   | `RECIPERADAR_API_BASE_URL` | Your RecipeRadar **public** URL (no trailing slash), e.g. `http://YOUR_SERVER_IP:8000` or `https://reciperadar.yourdomain.com` | **Production** (and Preview if you want suggestions there too) |
   | `RECIPERADAR_RECIPE_BASE_URL` | (Optional) Base URL for “View recipe” links if different from the API URL | Production / Preview |

   Use the **exact** URL you used in the `curl` test (or the PaaS URL). It must be reachable from Vercel’s servers (no localhost).

3. **Redeploy** the production app (e.g. **Deployments** → latest → **…** → **Redeploy**) so the new variable is applied. New deployments will pick it up automatically.

---

## Step 3: Verify

1. Open your **production** app URL (e.g. `https://app.plotbudget.com`).
2. Go to **Meals** → **What can I cook?** and add an ingredient, then **Find recipes**.
3. If the API is reachable and the env var is set, you’ll either see “More ideas from the web” with results (if the index has data) or an empty list; you should **not** see the “Set RECIPERADAR_API_BASE_URL” message. If you do, the env var isn’t set for that environment or the URL isn’t reachable from Vercel.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Run RecipeRadar on a server (VPS or PaaS) and get a **public** API URL (e.g. `http://IP:8000` or `https://…`). |
| 2 | In Vercel → **Settings** → **Environment Variables**, add `RECIPERADAR_API_BASE_URL` = that URL for **Production** (and Preview if desired). |
| 3 | Redeploy, then test “What can I cook?” in production. |

After this, **all users** in that environment use the same RecipeRadar instance; no per-user configuration is required.

For self-hosting details, optional subdomains, and populating the recipe index, see [RECIPERADAR-SELF-HOSTING.md](./RECIPERADAR-SELF-HOSTING.md) and [tools/reciperadar/README.md](../tools/reciperadar/README.md).
