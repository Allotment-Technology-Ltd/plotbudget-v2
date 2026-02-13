# Polar.sh setup: make payments work

This doc lists what to do **in the Polar dashboard** and **in the app** so Polar payments work end-to-end. Billing is **per household**; we support **Premium** (£4.99/month and £49.99/year).

---

## What’s already done

- Pricing page (app + marketing), feature flag `pricing-enabled`, currency (GBP/USD/EUR), region restriction, Founding Member (first 50) in DB.
- **Not yet done:** Polar SDK, checkout route, webhook, `subscriptions` table, and (optionally) limit enforcement.

---

## Part 1: Polar dashboard

Do this in [Polar](https://polar.sh) (or your Polar org).

### 1.1 Create products and prices

1. **Products**
   - **Premium Monthly:** e.g. name “PLOT Premium (Monthly)”, price **£4.99**, recurring **monthly**.
   - **Premium Annual:** e.g. name “PLOT Premium (Annual)”, price **£49.99**, recurring **yearly** (or one-time for 12 months, depending on how you want it).

2. **Note the IDs**
   - Copy the **Product ID** (or **Price ID**) for each. You’ll use these in the app (e.g. env) and in the webhook to set `current_tier = 'pro'`.

### 1.2 Create access token

1. In Polar: **Settings → API / Developers** (or similar).
2. Create an **Access token** with scope that allows reading/writing subscriptions and customers.
3. Copy the token; you’ll set it as **`POLAR_ACCESS_TOKEN`** in the app (server-side only, not `NEXT_PUBLIC_`).

### 1.3 Webhook endpoint

1. In Polar: **Webhooks** (or **Developers → Webhooks**).
2. **Add endpoint:** `https://app.plotbudget.com/api/webhooks/polar` (use your real app URL; for local testing use Polar CLI—see docs/LOCAL-WEBHOOK-TESTING.md).
3. **Events to send:** at least:
   - `subscription.created`
   - `subscription.updated`
4. **Secret:** Polar will show a **Signing secret**. Copy it; you’ll set it as **`POLAR_WEBHOOK_SECRET`** in the app.

### 1.4 Success URL (checkout redirect)

- Decide where users land after a successful checkout, e.g. `https://app.plotbudget.com/dashboard?checkout_id={CHECKOUT_ID}`.
- You’ll pass this when configuring the checkout (or set a default in Polar if available). `{CHECKOUT_ID}` is replaced by Polar.

---

## Part 2: App environment variables

Set these where the **Next.js app** runs (e.g. Vercel → Project → Settings → Environment Variables). Use **Production** (and optionally Preview) as needed.

| Variable | Where to use it | Example / notes |
|----------|-----------------|------------------|
| `POLAR_ACCESS_TOKEN` | Server-only (checkout route, webhook, API) | From Polar dashboard (1.2) |
| `POLAR_WEBHOOK_SECRET` | Server-only (webhook handler) | From Polar webhook (1.3) |
| `POLAR_SUCCESS_URL` | Checkout redirect | `https://app.plotbudget.com/dashboard?checkout_id={CHECKOUT_ID}` |
| `POLAR_PWYL_GBP_PRODUCT_ID` | Checkout: PWYL for GBP households | From create-polar-products script (prod) |
| `POLAR_PWYL_USD_PRODUCT_ID` | Checkout: PWYL for USD households | Same PWYL product ID if single product |
| `POLAR_PWYL_EUR_PRODUCT_ID` | Checkout: PWYL for EUR households | Same PWYL product ID if single product |
| `POLAR_PREMIUM_PRODUCT_ID` or `POLAR_PREMIUM_PRICE_ID` | Webhook + checkout: monthly | Product or price ID from (1.1) |
| (Optional) `POLAR_PREMIUM_ANNUAL_PRODUCT_ID` | Webhook + checkout: annual | If you want monthly vs annual |
| `POLAR_SANDBOX` | Sandbox vs production API | `true` for sandbox; **omit or `false` for production** |

- Do **not** expose the access token or webhook secret to the client (`NEXT_PUBLIC_*`).
- **Production:** For Vercel Production scope, omit `POLAR_SANDBOX` or set `POLAR_SANDBOX=false`. Never set `POLAR_SANDBOX=true` for production.

---

## Part 3: Code to add (in this repo)

These are the pieces that still need to be implemented so Polar actually works.

### 3.1 Install Polar SDK

In `apps/web`:

```bash
pnpm add @polar-sh/sdk
```

We use `@polar-sh/sdk` directly for checkout creation and webhook validation. The `@polar-sh/nextjs` adapter was removed — it adds unnecessary abstraction and our checkout route already handles the flow with the SDK.

### 3.2 Subscriptions table (Supabase)

Add a migration that creates **`public.subscriptions`** keyed by **household** (billing is per household), for example:

- `id` (UUID, PK)
- `household_id` (UUID, FK → households, NOT NULL)
- `polar_subscription_id` (TEXT, UNIQUE, NOT NULL)
- `status` (TEXT, e.g. `active` | `cancelled` | `past_due` | `trialing`)
- `current_tier` (TEXT, e.g. `pro`)
- `trial_end_date` (TIMESTAMPTZ, optional)
- `polar_product_id` (TEXT, optional, for mapping)
- `created_at`, `updated_at` (TIMESTAMPTZ)

When the webhook receives `subscription.created` / `subscription.updated`, you **upsert** this table by `polar_subscription_id` and set `household_id` (from Polar metadata: pass `household_id` when creating the checkout so the webhook can link the subscription to the right household).

### 3.3 Checkout route (Next.js)

- **Path:** e.g. `apps/web/app/api/checkout/route.ts` (or a dynamic route if you have multiple products).
- **Handler:** Use `@polar-sh/sdk` to create a checkout and redirect, e.g.:

  ```ts
  import { Polar } from '@polar-sh/sdk';

  const polar = new Polar({ accessToken: process.env.POLAR_ACCESS_TOKEN });

  export async function GET(req: Request) {
    const checkout = await polar.checkouts.create({
      productId: process.env.POLAR_PREMIUM_PRODUCT_ID,
      successUrl: process.env.POLAR_SUCCESS_URL,
      // metadata: { household_id: "..." }
    });
    return Response.redirect(checkout.url);
  }
  ```

- **Upgrade CTA:** Point “Upgrade to Premium” (e.g. on the pricing page or settings) to this route. For “Premium Monthly” vs “Premium Annual”, you can use two links (e.g. `/api/checkout?product=monthly` and `?product=annual`) or handle it in the route handler.

### 3.4 Webhook route (Next.js)

- **Path:** `apps/web/app/api/webhooks/polar/route.ts`.
- **Method:** POST.
- **Behaviour:**
  1. **Verify signature** using `POLAR_WEBHOOK_SECRET` (see [Polar webhook docs](https://polar.sh/docs/integrate/webhooks/delivery)).
  2. Parse the body and handle **`subscription.created`** and **`subscription.updated`**.
  3. From the payload, get `polar_subscription_id`, status, product/price ID, and **household_id** (from custom metadata you set when creating the checkout).
  4. **Upsert** `public.subscriptions` by `polar_subscription_id`; set `household_id`, `status`, `current_tier` (if product/price matches `POLAR_PREMIUM_*`, set `current_tier = 'pro'`), `trial_end_date` if present, `polar_product_id`, `updated_at`.
  5. Optionally update the household **owner’s** row in `public.users` (e.g. `subscription_tier`, `subscription_status`) for fast reads.
  6. Return **200** quickly.

Important: pass **`household_id`** (and optionally user id) when creating the checkout (e.g. as custom metadata or client_reference_id) so the webhook can attach the subscription to the correct household without looking up by email.

### 3.5 Pass household_id into checkout

When redirecting the user to the checkout (e.g. from “Upgrade to Premium”):

- Either use Polar’s API to create a checkout session with **metadata** `{ household_id: "..." }` (and optionally `user_id`), then redirect the user to that session URL.
- Or use the Next.js checkout route with query params that the route uses to call Polar’s API with that metadata; then the webhook receives it and can set `subscriptions.household_id`.

(See `@polar-sh/sdk` docs for "create checkout" with metadata.)

### 3.6 (Optional) Limit enforcement

- **Server helper:** Given `household_id`, compute effective tier (Founding Member, active subscription in `subscriptions`, or trial/free from pay cycle count). If not Premium, get limits (Trial vs Free) and check current seed counts per category for the pay cycle.
- **createSeed:** Before inserting a seed, call this helper; if over limit, return an error and optionally capture a PostHog “limit_reached” event.
- **UI:** Optional `useSubscription` hook that fetches tier and limits/usage and disables “Add” or shows upgrade CTA when at limit.

This can be done after checkout and webhook are working.

---

## Part 4: Order of operations

1. **Polar dashboard:** Products, access token, webhook endpoint + secret, success URL.
2. **App env:** Set `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_SUCCESS_URL`, `POLAR_PREMIUM_PRODUCT_ID` (and optional annual ID).
3. **Code:** Install SDK → migration for `subscriptions` → webhook route (verify signature, handle events, upsert `subscriptions` and optionally `users`) → checkout route (and pass `household_id` into checkout) → wire “Upgrade” to checkout.
4. **Test:** Use **Polar Sandbox** (sandbox.polar.sh) and test cards; trigger a subscription and confirm the webhook runs and `subscriptions` (and optionally `users`) are updated. See **[POLAR-TESTING.md](./POLAR-TESTING.md)** for manual and automated testing in line with Polar’s docs.
5. **Optional:** Add limit logic and UI (useSubscription, createSeed check, upgrade CTA).

---

## Production go-live checklist

When moving from sandbox to live payments (polar.sh, not sandbox.polar.sh):

1. **Polar production:** Create access token, create products (`pnpm exec tsx apps/web/scripts/create-polar-products.ts` with no `--sandbox`), create webhook at `https://app.plotbudget.com/api/webhooks/polar`.
2. **Vercel Production env vars:** Set `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_SUCCESS_URL`, `POLAR_PWYL_GBP_PRODUCT_ID`, `POLAR_PWYL_USD_PRODUCT_ID`, `POLAR_PWYL_EUR_PRODUCT_ID`, `POLAR_PREMIUM_PRODUCT_ID`, `POLAR_PREMIUM_ANNUAL_PRODUCT_ID`.
3. **Critical:** Omit `POLAR_SANDBOX` or set `POLAR_SANDBOX=false` for Production. Do not set `POLAR_SANDBOX=true` in production.
4. **Verify:** Run a live purchase, confirm webhook delivery and DB updates, then enable `NEXT_PUBLIC_PRICING_ENABLED=true`.

See [LIVE-PAYMENTS-SETUP.md](./LIVE-PAYMENTS-SETUP.md) for a fuller rollout checklist.

---

## Quick reference

| Goal | Where |
|------|--------|
| Create products & prices | Polar dashboard |
| Webhook URL | Polar dashboard → Webhooks → `https://app.plotbudget.com/api/webhooks/polar` |
| Env vars | Vercel (or your host) for the Next.js app |
| Subscriptions storage | New migration: `public.subscriptions` (household_id, polar_subscription_id, status, current_tier, …) |
| Start payment flow | `apps/web/app/api/checkout/route.ts` (GET) using `@polar-sh/sdk` |
| Receive subscription events | `apps/web/app/api/webhooks/polar/route.ts` (POST), verify secret, upsert `subscriptions` |
| Link subscription to household | Pass `household_id` in checkout metadata; webhook reads it and sets `subscriptions.household_id` |

Once the webhook and checkout are in place and env is set, Polar is “wired up”; you can then add limit enforcement and polish (e.g. success page, customer portal link) as needed.

---

## Testing

For manual and automated testing of subscription options (sandbox, webhooks, tier/limit logic, E2E), see **[POLAR-TESTING.md](./POLAR-TESTING.md)**. It follows Polar's recommendations: use the sandbox environment, the delivery overview for webhooks, and optional Polar CLI for local webhook receipt.
