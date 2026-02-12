# PWYL Automated Test Plan

## Scope

Establish automated coverage for the Pay-What-You-Like (PWYL) Polar integration across unit/API layers, webhook handling, email delivery, and end-to-end journeys (sandbox-backed). The plan mirrors sandbox success paths and ensures production readiness.

---

## 1. Unit/API Tests (Vitest)

### Files
- `apps/web/tests/api/checkout.pwyl.spec.ts`
- `apps/web/tests/api/webhooks.polar.spec.ts`

### Mocks
- Mock `@polar-sh/sdk` client with vi.mock to intercept `checkouts.create`.
- Mock Supabase server client (createServerSupabaseClient + admin) using existing helpers or lightweight stubs.
- Environment variables injected via `vi.stubEnv()`.

### Happy Paths
1. **Checkout PWYL Success**
   - `GET /api/checkout?product=pwyl&household_id=H&user_id=U`
   - Expect Polar `checkouts.create` called with `{ products: [POLAR_PWYL_BASE_PRODUCT_ID], metadata: { household_id, user_id, pricing_mode: 'pwyl' } }`.
   - Response is a 302 redirect to mocked URL.

2. **Checkout Fixed Monthly**
   - `product=monthly` uses `POLAR_PREMIUM_PRODUCT_ID`.

3. **Webhook Subscription Created (PWYL)**
   - Payload includes metadata `{ household_id, user_id, pwyl_amount: '5.00', pricing_mode: 'pwyl' }`.
   - Ensure Supabase insert includes metadata, tier = `pro`.

4. **Webhook Subscription Updated (PWYL)**
   - Ensures upsert path updates metadata.

### Unhappy Paths
1. **Checkout missing env**
   - No `POLAR_PWYL_BASE_PRODUCT_ID` → 400 JSON.
   - Missing token/success URL → 500 JSON.

2. **Checkout Polar Failure**
   - Mock rejection from `checkouts.create`; expect 500 JSON with mode info.

3. **Webhook missing metadata**
   - No household → expect log warning + 200 (graceful).

4. **Webhook unknown product**
   - Ensure handler returns 200 without DB insert.

### Implementation Notes
- Use `supertest`-style helper or Next.js `NextResponse` evaluation via `await GET(req)`.
- Provide helper to build NextRequest with query params.
- Use `vi.fn()` for Supabase `from().insert()` etc.

---

## 2. End-to-End Tests (Playwright)

### Config
- `apps/web/tests/specs/pwyl.checkout.spec.ts` (reuse existing Playwright setup).
- Sandbox credentials stored in `.env.test.local` + GitHub secrets. Use `POLAR_ACCESS_TOKEN_SANDBOX`, `POLAR_SUCCESS_URL` (point to dev host), and `POLAR_PWYL_BASE_PRODUCT_ID_SANDBOX`.
- Run behind feature flag `NEXT_PUBLIC_PWYL_PRICING_ENABLED=true`.

### Happy Flow (Sandbox)
1. Seed account (existing helper `tests/utils`) to create user + household.
2. Visit `/pricing`, log in if needed.
3. Click “Start Premium”.
4. In Polar sandbox checkout:
   - Fill email (if required).
   - Set amount (e.g., £3.50) using slider (Polar UI). Polar sandbox supports `4242` card.
5. Confirm redirect back to app -> expect success toast, Settings → Subscription shows PWYL amount.

### Unhappy Flow
1. Temporarily intercept `POLAR_ACCESS_TOKEN` using Playwright `test.step` with route abort? Better: run API route unit test. For e2e, simulate failure by toggling feature flag to missing product ID (via test config env). Expect `/api/checkout` returns error JSON which UI should handle (show toast or fallback message). Validate error state.

### Additional Checks
- Validate telemetry/log presence (optional).
- Clean up: use Supabase admin to delete created subscription (helper script).

---

## 3. Email Testing Strategy

### Goals
- Ensure PWYL welcome and trial lifecycle emails render and trigger without sending real mail.

### Approach Options
1. **Component-level snapshot/tests**
   - Use Vitest + `@react-email/render` to render each template to HTML.
   - Assert critical text present (“Pay-What-You-Like”, dynamic amounts, CTA URLs).
   - Store inline snapshot or string assertions.

2. **Mock Resend Client**
   - Wrap email send function to accept `RESEND_API_KEY` and provide test double.
   - Use `vi.mock('@resend/sdk')` to capture payload.

3. **Sandbox Email**
   - Resend offers `Bounces`/`Emails` API to inspect; optional.

### Test Files
- `apps/web/emails/subscription/__tests__/pwyl-welcome.test.ts`
- `apps/web/emails/trial/__tests__/ending-soon.test.ts` etc.

---

## 4. Tooling & Scripts

- Add npm scripts in `apps/web/package.json`:
  - `"test:api": "vitest run --runInBand tests/api"`
  - `"test:api:watch": "vitest"`
  - `"test:emails": "vitest run tests/emails"`
  - `"test:e2e": "playwright test --project=chromium --config=playwright.config.ts --grep @pwyl"`

- Update `playwright.config.ts` with project `pwyl` that sets env vars from `.env.test.local.pwyl`.

---

## 5. CI Integration

- **GitHub Actions** job `pwyl-tests.yml`:
  1. Setup Node + PNPM
  2. `pnpm install`
  3. `pnpm --filter @repo/web run test:api`
  4. `pnpm --filter @repo/web run test:emails`
  5. `pnpm --filter @repo/web run test:e2e` (requires secrets: `POLAR_PWYL_BASE_PRODUCT_ID_SANDBOX`, `POLAR_ACCESS_TOKEN_SANDBOX`, `POLAR_WEBHOOK_SECRET_SANDBOX`)
- Add nightly cron job to run `test:e2e` with sandbox credentials, reporting via GitHub annotations or Slack.
- Mark Playwright job as optional/allowed-to-fail initially while stabilizing.

---

## 6. Next Steps
- Implement Vitest mocks for Polar + Supabase.
- Create test fixtures for Supabase responses (household, subscription rows).
- Build Playwright flows with sandbox credentials.
- Add email render tests verifying dynamic content.
- Wire CI and document required secrets.
