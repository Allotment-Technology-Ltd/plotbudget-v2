# Local Webhook Testing (Polar Sandbox)

This guide explains how to test Polar webhooks locally using **Polar CLI**.

---

## Approach change (ngrok → Polar CLI)

We previously used ngrok to expose localhost for webhook delivery. We switched to Polar CLI because:

- **502 errors:** ngrok free tier could return 502s to Polar when the tunnel or upstream was inconsistent
- **URL registration friction:** ngrok URLs change on restart; Polar’s webhook endpoint had to be updated each time
- **Simpler setup:** Polar CLI handles the tunnel itself; no third‑party tool or dashboard config

Polar CLI is now the only supported way to receive webhooks locally. For production and preview environments, the webhook URL is your deployed app (e.g. `https://app.plotbudget.com/api/webhooks/polar`).

---

## Setup

### One-time setup

1. **Install Polar CLI**
   ```bash
   curl -fsSL https://polar.sh/install.sh | bash
   ```

2. **Login and select sandbox org**
   ```bash
   polar login
   ```
   When prompted, select your **sandbox** organization.

3. **Copy the webhook secret**  
   When you run `polar listen` (below), the CLI displays a secret. Add it to `.env.local`:
   ```bash
   POLAR_WEBHOOK_SECRET=<secret from polar listen output>
   ```

### Run (two terminals)

**Terminal 1** — from plotbudget root:
```bash
pnpm dev:polar
```
Starts the dev server. Keep it running.

**Terminal 2** — in a terminal where you can type (agent terminals are read-only):
```bash
polar listen http://localhost:3000/
```
Select your sandbox org with arrow keys, then **Cmd+Enter** to confirm. Copy the webhook secret into `.env.local` as `POLAR_WEBHOOK_SECRET`.

**Why two terminals:** Polar CLI's org selection is interactive. Agent/background terminals are read-only—you must run `polar listen` in a terminal you control.

### Verify

1. Complete a checkout in sandbox (or redeliver a webhook from Polar dashboard)
2. Check dev server logs for:
   - `[webhook/polar] Processed subscription.created` (or `subscription.updated`)
   - `POST /api/webhooks/polar 200`
3. Polar CLI deliveries do not appear in the Polar dashboard Webhooks section—that only shows registered URL endpoints. The CLI uses a separate tunnel.

**Checking dev server logs:** Search for `[webhook/polar]` in the terminal (we log on every POST and on successful processing). For cleaner logs, run in two terminals: Terminal 1: `pnpm --filter @repo/web dev`; Terminal 2: `polar listen http://localhost:3000/`. To capture logs to a file: `pnpm --filter @repo/web dev 2>&1 | tee dev.log` then `grep webhook dev.log`.

---

## Environment variables (`.env.local`)

```bash
POLAR_SANDBOX=true
POLAR_WEBHOOK_SECRET=<from Polar CLI>
POLAR_ACCESS_TOKEN=polar_oat_...
POLAR_SUCCESS_URL=http://localhost:3000/dashboard
```

### Ports

- **Web app (Next.js):** `localhost:3000` — contains `/api/webhooks/polar`
- **Marketing (Vite):** `localhost:3001` — separate app
- If 3000 is in use, Next.js may use 3001; set `WEB_PORT=3001` before `pnpm dev:polar` if needed

---

## Testing Webhooks

### Via sandbox checkout

1. Go to your app's pricing page, click "Start Premium"
2. Complete checkout in Polar sandbox with test card `4242 4242 4242 4242`
3. You should see `subscription.created` (and related) webhooks in the Polar CLI output and `POST /api/webhooks/polar 200` in dev logs

### Via Polar dashboard redelivery

1. Polar Sandbox → **Webhooks** → **Deliveries**
2. Pick a failed delivery → **Redeliver**
3. With Polar CLI running, the event will reach your local handler

### Manual (no signature; expect 400)

```bash
curl -X POST http://localhost:3000/api/webhooks/polar \
  -H "Content-Type: application/json" \
  -d '{"type":"subscription.created","data":{"id":"test"}}'
# Response: {"error":"Invalid signature"} (400) — expected
```

---

## Troubleshooting

### Polar CLI: "polar: command not found"

Install: `curl -fsSL https://polar.sh/install.sh | bash`  
Restart your terminal or run `source ~/.zshrc` (or your shell config).

### No webhooks received

1. **Polar CLI:** Ensure `polar listen` is running and shows "Waiting for events..." (not stuck on org selection—press **Cmd+Enter** to confirm).
2. **Secret:** `POLAR_WEBHOOK_SECRET` in `.env.local` must match the secret shown by `polar listen`
3. **Org:** Use the sandbox org when running `polar login`
4. **Dev server:** Confirm Next.js is on port 3000 (or the port you passed to `polar listen`)

### No POST logs in terminal

If checkout succeeds (subscription in DB, user set to pro) but you never see `[webhook/polar] POST received` or `POST /api/webhooks/polar`:

1. **Verify the endpoint logs:** With dev server running, run: `curl -X POST http://localhost:3000/api/webhooks/polar -H "Content-Type: application/json" -d '{"type":"test"}'` — you should see `[webhook/polar] POST received` in the terminal and get `{"error":"Invalid signature"}` (400). If not, logs may not be visible in your terminal.
2. **Polar may use a registered URL:** In Polar Sandbox → Webhooks → Endpoints, remove any old ngrok or other URLs so Polar sends only via the CLI tunnel.
3. **Capture logs to file:** `pnpm --filter @repo/web dev 2>&1 | tee dev.log` then `grep webhook dev.log` after a checkout.

---

## Architecture

```
Polar Sandbox
      ↓ webhook delivery
  Polar CLI tunnel (managed by Polar)
      ↓ forwards to
  Local dev server (localhost:3000)
      ↓
  POST /api/webhooks/polar
      ↓
  Validates signature with POLAR_WEBHOOK_SECRET
      ↓
  Upserts subscriptions, returns 200
```

---

## Readiness checklist (before dev deployment)

1. ✅ **Polar CLI test:** Run `pnpm dev:polar`, complete a sandbox checkout, confirm webhooks reach handler (200)
2. ✅ **Unit tests:** `pnpm test:api` (or `pnpm --filter @repo/web test tests/api`) — webhook handler tests pass
3. ⬜ **Preview deploy:** Deploy to Vercel preview, set webhook URL to `https://[preview-url]/api/webhooks/polar`, complete one sandbox checkout for end-to-end verification
