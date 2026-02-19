# Testing subscription options (Polar)

This doc describes **manual** and **automated** testing for subscription flows, aligned with [Polar’s documentation](https://docs.polar.sh) (sandbox, webhooks, events).

---

## 1. Manual testing (Polar recommendations)

### 1.1 Use Polar Sandbox

Polar provides a **sandbox environment** isolated from production ([Sandbox Environment](https://docs.polar.sh/docs/integrate/sandbox)):

- **URL:** [sandbox.polar.sh](https://sandbox.polar.sh/start) (or “Go to sandbox” from the org switcher).
- **Separate org:** Create a dedicated user and organization in sandbox; production tokens and data are not shared.
- **Test payments:** Use Stripe test cards; successful payment example: **`4242 4242 4242 4242`** (future expiry, any CVC).
- **API/SDK:** Use base URL **`https://sandbox-api.polar.sh`** and an access token created **in the sandbox**; production tokens do not work in sandbox.
- **Limitation:** Subscriptions created in sandbox auto-cancel **90 days** after creation (sandbox-only).

**Recommendation:** Do all subscription and webhook testing against sandbox (separate products, webhook endpoint, and env vars) so production data and money are never involved.

### 1.2 Webhook delivery (manual verification)

Polar’s [Handle & monitor webhook deliveries](https://polar.sh/docs/integrate/webhooks/delivery) describes:

- **Delivery overview:** In the Polar dashboard (Webhooks → your endpoint) you can:
  - See historic deliveries.
  - Review the exact payload sent.
  - **Trigger redelivery** if the first attempt failed (useful after fixing your handler or local tunnel).

**Manual checklist:**

1. **Local receipt:** Use Polar CLI: `polar login` then `polar listen http://localhost:3000/` (or `pnpm dev:polar` from plotbudget root). Select sandbox org; copy the secret into `.env` as `POLAR_WEBHOOK_SECRET`. See `docs/LOCAL-WEBHOOK-TESTING.md`.
2. **Create a test subscription** in sandbox (checkout with `4242 4242 4242 4242`).
3. **Confirm** in the delivery overview that the request was sent and (if applicable) redeliver until you get 2xx.
4. **Verify** in your app/DB: `subscriptions` row upserted with correct `household_id`, `status`, `current_tier` (e.g. `pro`).

Testing interactively
When testing interactively, use a card number, such as 4242 4242 4242 4242. Enter the card number in the Dashboard or in any payment form.

Use a valid future date, such as 12/34.
Use any three-digit CVC (four digits for American Express cards).
Use any value you like for other form fields.
**Troubleshooting (from Polar docs):**

- **Not receiving webhooks:** Start Polar CLI (`pnpm dev:polar`); add logging in the handler; ensure no redirect (3xx) and webhook route is excluded from auth middleware; if using Cloudflare, consider Bot Fight Mode and WAF (see Polar’s “Not receiving webhooks”).
- **Invalid signature:** If you implement custom validation, the secret must be base64-encoded when generating the comparison signature; the Polar SDK handles this for you.
- **Fast response:** Respond within **~2 seconds** (Polar timeout is 10s); queue heavy work in a background job and return 200/202 quickly.

### 1.3 Events to test manually

From [Webhook Events](https://polar.sh/docs/integrate/webhooks/events), the minimum for subscriptions:

- **`subscription.created`** – new subscription; upsert `subscriptions` and set `household_id` from metadata.
- **`subscription.updated`** – status changes (active, canceled, past_due, revoked, etc.); update `subscriptions.status` and optionally `current_tier`.

Optional for a full picture:

- **`subscription.canceled`** / **`subscription.revoked`** – confirm your app treats “cancel at period end” vs “revoked” as intended.
- **`order.created`** with `billing_reason: 'subscription_cycle'` – if you track renewals.

**Suggested manual scenarios:**

| Scenario | Steps | What to check |
|----------|--------|----------------|
| New Premium (sandbox) | Checkout in sandbox with test card; pass `household_id` in metadata | Webhook delivery 200; `subscriptions` row for that household, `current_tier = 'pro'` |
| Founding Member | Use a user in first 100 (or backfilled `founding_member_until` on household) | Effective tier is Premium without a row in `subscriptions` (if you implement tier helper) |
| Trial / Free | New household, no checkout | Effective tier Trial then Free after 2 pay cycles; limits match tier (when limit logic exists) |
| Cancel / revoke | Cancel subscription in Polar (end-of-period or immediate) | `subscription.updated` (and related events); `subscriptions.status` updated |

---

## 2. Automated testing

### 2.1 Unit tests (tier and limit logic)

When you implement **effective tier** and **limit enforcement** (e.g. `getEffectiveTier(household_id)`, `checkOverLimit(household_id, category)`):

- **Mock Supabase** (and optionally Polar API) so tests don’t hit real DB or Polar.
- **Cover:**
  - **Founding Member:** `founding_member_until` in future → tier = Premium (or equivalent).
  - **Active subscription:** Row in `subscriptions` with `status = 'active'` and `current_tier = 'pro'` → tier = Premium.
  - **Trial:** No subscription, pay cycle count ≤ 2 (or your rule) → Trial limits (e.g. unlimited Needs/Wants, 5 Savings, 5 Repayments).
  - **Free:** No subscription, pay cycles > 2 → Free limits (e.g. 5/5/2/2).
  - **Over limit:** Counts at or above limit for category → `checkOverLimit` returns true; createSeed (or equivalent) should reject or return error.

Place these next to the module that implements tier/limits (e.g. `lib/subscription/` or `lib/billing/`).

### 2.2 Webhook handler (integration / unit)

- **Endpoint:** `POST /api/webhooks/polar` (or your actual path).
- **Options:**
  - **A – Real signature (integration):** Use a **test** `POLAR_WEBHOOK_SECRET` in CI/test env; send a real `subscription.created` (or `subscription.updated`) payload from a fixture and compute the signature with [Standard Webhooks](https://www.standardwebhooks.com/) or the Polar SDK so the handler accepts it. Assert: 200, and `subscriptions` upserted (e.g. via test DB or mocked Supabase).
  - **B – Skip signature in test:** In test env only, allow a header (e.g. `x-test-skip-signature: true`) and bypass verification; then assert parsing and upsert logic. Easiest to get green fast; less realistic.
- **Payloads:** Store sample JSON for `subscription.created` and `subscription.updated` (with `household_id` in metadata) in `tests/fixtures/` or similar; reuse in tests.
- **Polar SDK:** If you use `validateEvent()` from `@polar-sh/sdk/webhooks`, prefer option A with a valid signature so the full path is tested.

### 2.3 E2E (Playwright)

- **Pricing page:** When pricing is enabled (e.g. `NEXT_PUBLIC_PRICING_ENABLED=true` or PostHog flag), assert:
  - `/pricing` is reachable (and, if logged in, shows dashboard header/nav).
  - Premium “Upgrade” (or “Get Premium”) CTA links to the checkout route (e.g. `/api/checkout` or `/api/checkout?product=premium-monthly`).
- **Checkout flow:** Optionally, in E2E, open the checkout URL and confirm redirect to Polar (sandbox) and that the page loads; avoid asserting full payment in CI (flaky, and Polar sandbox may require auth). You can document “manual: complete checkout in sandbox” instead.
- **Feature flag:** If you have tests that depend on pricing UI, gate them on the same env/flag so they can be run when pricing is on.

### 2.4 Where to put tests

| Kind | Location (suggestion) |
|------|------------------------|
| Tier/limit unit | Next to subscription/billing module, e.g. `apps/web/lib/subscription/*.test.ts` or `__tests__/` |
| Webhook handler | `apps/web/app/api/webhooks/polar/route.test.ts` or `tests/api/webhooks-polar.test.ts` |
| Webhook fixtures | `apps/web/tests/fixtures/polar-webhooks.ts` or `.json` |
| E2E pricing/checkout | `apps/web/tests/specs/pricing.spec.ts` (or in existing `smoke.spec.ts` / `dashboard.spec.ts`) |

---

## 3. Quick reference

| Goal | Approach |
|------|----------|
| No real money, isolated data | Use **Polar Sandbox** (sandbox.polar.sh, sandbox-api.polar.sh, sandbox token) |
| Test cards | Stripe test card: `4242 4242 4242 4242` |
| Receive webhooks locally | Polar CLI: `pnpm dev:polar` or `polar listen http://localhost:3000/` |
| Inspect / redeliver webhooks | Polar dashboard → Webhooks → your endpoint → delivery overview |
| Validate webhooks in code | Polar SDK `validateEvent()` or Standard Webhooks; respond quickly (e.g. 200 within 2s) |
| Automate tier/limits | Unit tests with mocked DB for Trial / Free / Premium and over-limit |
| Automate webhook | Integration test with signed payload (or test-only bypass) and fixture payloads |
| Automate UI | E2E: pricing page and Upgrade CTA when flag on; optional checkout redirect check |

---

## 4. Links

- [Polar – Sandbox Environment](https://docs.polar.sh/docs/integrate/sandbox)
- [Polar – Handle & monitor webhook deliveries](https://polar.sh/docs/integrate/webhooks/delivery)
- [Polar – Webhook Events](https://polar.sh/docs/integrate/webhooks/events)
- [Polar – Integrating Webhooks Locally](https://polar.sh/docs/integrate/webhooks/locally) (CLI `polar listen`)
- [Stripe test cards](https://docs.stripe.com/testing#cards)
- [Standard Webhooks](https://www.standardwebhooks.com/) (signature validation)
- Project: [POLAR-SETUP.md](./POLAR-SETUP.md) (implementation checklist)
