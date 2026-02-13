# Local Webhook Testing (Polar Sandbox)

This guide explains how to test Polar webhooks locally during development.

## Quick Start

### Option 1: Automatic (Recommended)

```bash
cd plotbudget/apps/web
pnpm dev:with-webhooks
```

This command:
1. Starts **ngrok** tunnel on port 3001
2. Displays the tunnel URL (e.g., `https://[RANDOM].ngrok-free.dev`)
3. Starts the Next.js dev server
4. Stops ngrok when you exit the dev server

### Option 2: Manual

If you prefer to manage ngrok separately:

**Terminal 1: Start ngrok**
```bash
ngrok http 3001
```

**Terminal 2: Start dev server**
```bash
cd plotbudget/apps/web
pnpm dev
```

## Setup Requirements

### 1. Environment Variables

Ensure `.env.local` has:

```bash
POLAR_SANDBOX=true
POLAR_WEBHOOK_SECRET=polar_whs_...
POLAR_ACCESS_TOKEN=polar_oat_...
POLAR_SUCCESS_URL=http://localhost:3001/dashboard
```

Copy these from your Polar sandbox dashboard.

### 2. ngrok Installation

```bash
brew install ngrok
```

Or from https://ngrok.com/download

### 3. Register Webhook URL in Polar

1. Go to [Polar Sandbox Dashboard](https://sandbox.polar.sh)
2. Navigate to **Webhooks** → **Endpoints**
3. Add/update endpoint:
   - **URL:** `https://[NGROK_URL]/api/webhooks/polar` (replace with actual ngrok URL from step 1)
   - **Events:** `subscription.created`, `subscription.updated`
   - **Secret:** Paste the value from `POLAR_WEBHOOK_SECRET` in `.env.local`

## Testing Webhooks

### Method 1: Via Polar Sandbox

1. Create a test checkout using the Polar API:
   ```bash
   curl -X POST https://sandbox-api.polar.sh/v1/checkouts/ \
     -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "products": ["YOUR_PRODUCT_ID"],
       "success_url": "http://localhost:3001/dashboard"
     }'
   ```

2. This triggers a `checkout.created` webhook

3. Check the webhook delivery status:
   - Look at dev server logs: `POST /api/webhooks/polar 200` = success
   - Or visit Polar dashboard: **Webhooks** → **Deliveries** → see HTTP 2xx status

### Method 2: Manual Testing

```bash
# Test locally (without signature verification)
curl -X POST http://localhost:3001/api/webhooks/polar \
  -H "Content-Type: application/json" \
  -d '{"type":"subscription.created","data":{"id":"test"}}'
# Response: {"error":"Invalid signature"} (400) — expected without a valid Polar signature
```

## Troubleshooting

### Webhooks not received?

1. **Is ngrok running?**
   ```bash
   # Check ngrok status
   curl http://127.0.0.1:4040/api/tunnels 2>/dev/null
   ```

2. **Is the webhook URL registered in Polar?**
   - Verify URL in Polar dashboard matches ngrok tunnel URL

3. **Is the webhook secret correct?**
   - Double-check `POLAR_WEBHOOK_SECRET` matches the one in Polar

4. **Is the dev server running?**
   - Verify `pnpm dev` is running on the specified port (default 3001 if 3000 in use)

### ngrok tunnel keeps changing?

- **Free tier:** ngrok assigns a new URL each time you restart. Update the webhook URL in Polar dashboard.
- **Paid tier:** Paid accounts have stable, reserved domains. Once set, the URL stays the same.

### Port 3000/3001 in use?

- The dev server will auto-select an available port. Check the output:
  ```
  ▲ Next.js 16.1.6
  - Local:         http://localhost:3001
  ```
- Update ngrok command to match: `ngrok http 3001`

## Architecture

```
Polar Sandbox
      ↓ webhook delivery
  ngrok tunnel (https://[NGROK_URL])
      ↓ HTTPS → HTTP
  Local dev server (localhost:3001)
      ↓
  /api/webhooks/polar handler
      ↓
  Validates signature with POLAR_WEBHOOK_SECRET
      ↓
  Processes event (updates subscriptions table)
      ↓
  Returns 200 OK to Polar
```

## Next Steps

After confirming webhooks work locally:

1. **Phase 2:** Add metadata column to subscriptions table (store PWYL amount)
2. **Phase 3:** Update tests for webhook metadata
3. **Phase 4:** Polish error handling and docs

See `docs/PRODUCTION-INFRASTRUCTURE.md` for production webhook setup.
