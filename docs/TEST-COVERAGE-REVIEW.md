# Test Coverage Review

This document summarizes automated test coverage, gaps, and recommendations for the PlotBudget app (`apps/web`).

**Updates (post-review):** Vitest unit tests added for `lib/utils/pay-cycle-dates.ts` and `lib/utils/suggested-amount.ts`. E2E added: `dashboard.spec.ts` (dashboard smoke, settings from menu, logout) and `root.spec.ts` (home page CTAs, signup/learn-more). A bug in `calculateCycleEndDate('last_working_day')` was fixed (end date now uses the start month’s last working day).

---

## 1. Current state

### 1.1 E2E tests (Playwright)

| Spec | Project | What it covers |
|------|--------|----------------|
| `auth.spec.ts` | chromium (no auth) | Login with valid/invalid credentials; redirect to dashboard or onboarding; navigate to signup page |
| `onboarding.spec.ts` | chromium (solo) | Complete solo onboarding (income, pay cycle); validation (cannot proceed without income) |
| `dashboard.spec.ts` | chromium (solo) | Dashboard loads (hero or no-cycle state); navigate to settings via user menu; logout → login |
| `root.spec.ts` | chromium (no auth) | Home page loads; CTA signup → /signup; CTA learn more → #why-plot |
| `blueprint.spec.ts` | chromium-blueprint | Add seed, edit seed, delete seed with confirmation, validation (negative amount) |
| `ritual.spec.ts` | chromium-ritual | Active cycle shows progress bar and checkboxes; mark paid → celebration; dismiss celebration |

**Infrastructure:** Global setup logs in solo / blueprint / ritual users and saves storage state. `db-cleanup` resets onboarding or ensures blueprint-ready state. Tests run against `http://localhost:3000` (or `PLAYWRIGHT_TEST_BASE_URL`).

**Covered user journeys:**

- Auth: login, error state, go to signup.
- Onboarding: solo flow, validation.
- Blueprint: CRUD seeds, validation.
- Ritual: payment checkboxes, progress, celebration.

### 1.2 Unit tests (Vitest)

| Test file | What it covers |
|-----------|----------------|
| `lib/utils/pay-cycle-dates.test.ts` | `getLastWorkingDay`, `toWorkingDay`, `calculateCycleStartDate`, `calculateCycleEndDate`, `calculateNextCycleDates` (with fake timers where needed) |
| `lib/utils/suggested-amount.test.ts` | `countPayCyclesUntil`, `suggestedSavingsAmount`, `suggestedRepaymentAmount` (monthly / every_4_weeks, zero, null, rounding) |

Run with: `pnpm test:unit` or `pnpm test` from `apps/web`.

### 1.3 Pure logic suitable for unit tests

| Module | Purpose | Why unit test |
|--------|---------|----------------|
| `lib/utils/pay-cycle-dates.ts` | Cycle start/end, last working day, next cycle | Date logic is easy to get wrong; pure functions, no I/O |
| `lib/utils/suggested-amount.ts` | Suggested savings/repayment per cycle | Math and edge cases (zero, past dates) |
| `lib/auth/allowlist.ts` | `isEmailAllowed()` | Simple but env-dependent; can unit test with mocked env |
| Server actions (Zod schemas) | Validation in `settings-actions`, `account-actions` | Schemas can be unit-tested in isolation; actions themselves need Supabase mocks |

---

## 2. Gaps (not covered by e2e)

| Area | Gap | Risk |
|------|-----|------|
| **Dashboard** | ~~No dedicated e2e~~ → **Covered:** dashboard smoke (hero or no-cycle) | — |
| **Settings** | ~~No e2e~~ → **Smoke covered:** open settings from menu; change password, export, delete not covered | Remaining: change password, export, delete account |
| **Logout** | ~~No e2e~~ → **Covered:** user menu → Log out → login | — |
| **Root page** | ~~No e2e~~ → **Covered:** home CTAs (signup, learn more) | — |
| **Forgot password** | No e2e: link to reset-password, submit form | Recovery flow untested |
| **Signup** | Auth spec only checks navigation to signup page; no full signup flow | Allowlist and signup regressions |
| **Middleware** | No e2e: unauthenticated redirect to login; completed onboarding redirect away | Protection and redirect regressions |
| **Date / suggestion logic** | ~~No unit tests~~ → **Covered:** Vitest tests for pay-cycle-dates and suggested-amount | — |

---

## 3. Recommendations

### 3.1 E2E (Playwright)

**High value (add first):**

1. **Dashboard smoke** – After login, go to `/dashboard`, expect hero (e.g. `dashboard-hero`) and no crash. Reuses existing auth state.
2. **Root page CTAs** – On `/`, expect link “GET EARLY ACCESS” `href` to `/signup` and “LEARN MORE” to `#why-plot` (or equivalent). No auth required.
3. **Logout** – From an authenticated state, open user menu (e.g. by `aria-label="User menu"`), click “Log out”, expect redirect to `/login` and session cleared.
4. **Settings smoke** – Go to `/dashboard/settings`, expect page and tabs (Profile, Household, Privacy, Advanced). Optional: update display name and expect success toast.

**Medium value (next):**

5. **Settings: change password** – Open change-password dialog, fill new + confirm, submit, expect success and dialog close (and optionally log in again with new password).
6. **Settings: export data** – Click “Export My Data”, expect CSV download and toast (no need to assert CSV content in depth).
7. **Forgot password** – Click “Forgot password?” on login, expect `/reset-password` and form visible.

**Lower priority / later:**

8. Full signup flow (depends on allowlist and test data).
9. Delete account (destructive; use a dedicated test user and optionally tag as `@destructive`).
10. Middleware: unauthenticated access to `/dashboard` redirects to `/login` (can be a short auth.spec addition).

### 3.2 Unit tests

**Recommendation: add a unit test runner and cover pure logic.**

- **Runner:** Vitest is a good fit (fast, ESM-friendly, minimal config).
- **Scope (initial):**
  - `lib/utils/pay-cycle-dates.ts` – `getLastWorkingDay`, `toWorkingDay`, `calculateCycleStartDate`, `calculateCycleEndDate`, `calculateNextCycleDates` with fixed dates.
  - `lib/utils/suggested-amount.ts` – `countPayCyclesUntil`, `suggestedSavingsAmount`, `suggestedRepaymentAmount` for a few scenarios (monthly, every_4_weeks, zero/past).
- **Optional:** `lib/auth/allowlist.ts` with `process.env.ALLOWED_EMAILS` mocked; Zod schemas (e.g. from `settings-actions`) with valid/invalid inputs.

**What not to unit test (for now):**

- React components in isolation (e2e already covers user-facing behavior).
- Server actions that hit Supabase (would require heavier mocking; e2e or integration tests are more practical).

### 3.3 Test IDs

To keep e2e stable and readable:

- **Settings:** Add at least `data-testid="settings-page"` on the settings wrapper and, if you add settings e2e, test IDs for the Profile tab (e.g. display name input, Save button) and optionally for “Change Password” and “Export” buttons.
- **User menu:** Already accessible via `aria-label="User menu"`; “Log out” can be found by role `menuitem` and name.
- **Root page:** Links can be found by role and name; optional `data-testid="cta-signup"` and `data-testid="cta-learn-more"` if you prefer.

---

## 4. Sufficiency summary

| Question | Answer |
|----------|--------|
| Is there sufficient e2e coverage today? | **Improved.** Auth, onboarding, dashboard smoke, settings smoke, logout, root CTAs, blueprint, and ritual are covered. Forgot password and full settings flows (change password, export, delete) remain optional. |
| Do we need unit tests? | **Done for core utils.** Vitest plus tests for `pay-cycle-dates` and `suggested-amount` are in place. Optional: allowlist, Zod schemas. |
| What to do next? | Optional: e2e for change password, export, forgot password; unit tests for allowlist or Zod. |

---

## 5. How to run tests

- **E2E:** `pnpm test:e2e` (from `apps/web`). Requires env (e.g. `.env.test.local`) and, if not using `SKIP_WEBSERVER=1`, a dev server (started automatically by Playwright if not running).
- **Unit:** `pnpm test:unit` or `pnpm test` from `apps/web`.

---

*Last updated: after Phase D polish. Revisit when adding new features (e.g. payments, partner invites).*
