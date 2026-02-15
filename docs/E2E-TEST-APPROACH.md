# E2E test approach (rethought)

This doc describes how we run E2E tests reliably: users, auth state, and patterns that avoid flakiness in CI.

---

## Running tests locally

From the repo root:

1. **Lint and type-check:** `pnpm lint` and `pnpm type-check`
2. **Unit and API tests (Vitest):** `cd apps/web && pnpm test` (or `pnpm test:unit`; includes `tests/api` and emails). No browser required.
3. **E2E (Playwright):** Install Chromium once, then run E2E:
   - `cd apps/web && pnpm exec playwright install chromium`
   - `cd apps/web && pnpm test:e2e`

Ensure `.env.local` and `apps/web/.env.test.local` are set so the app and global setup can reach your dev Supabase project. See [E2E-DEBUGGING-GUIDE.md](./E2E-DEBUGGING-GUIDE.md) if tests fail.

---

## 0. Production guard (critical)

**E2E tests create and clean up test users** (solo@plotbudget.test, blueprint@plotbudget.test, etc.) and their households/paycycles. **Never run E2E against the production database.**

- **Use a separate Supabase project for E2E.** Create a "Development" or "Staging" project in Supabase and use its URL and service_role key for CI.
- **Set `SUPABASE_PROD_PROJECT_REF`** in CI to your production project ref (the subdomain of your prod Supabase URL, e.g. `abcdefghij` for `https://abcdefghij.supabase.co`). This blocks accidental prod usage: if E2E points at prod, tests fail immediately with a clear error.
- **CI secrets for E2E:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` must point to the **test** Supabase project, not production. Vercel production uses different env vars (or a different Supabase project) for the live app.

**Cleaning up accidental prod pollution:** If test users (solo@plotbudget.test, blueprint@plotbudget.test, etc.) were created in production, remove them via Supabase Dashboard (Auth → Users, delete by email) and delete associated `public.users`, `public.households`, and `public.paycycles` rows. Run migrations and ensure `SUPABASE_PROD_PROJECT_REF` is set before the next E2E run.

---

## 1. Test users and projects

| User | Email | Used by | Purpose |
|------|--------|---------|--------|
| **solo** | solo@plotbudget.test | chromium (auth, onboarding, root) | Login, onboarding flow, root page; onboarding spec resets this user so dashboard tests must not use it. |
| **blueprint** | blueprint@plotbudget.test | chromium-blueprint | Blueprint CRUD (seeds, pots, repayments). Has completed onboarding and a household. |
| **ritual** | ritual@plotbudget.test | chromium-ritual | Payment tracking (ritual) specs. Has completed onboarding, household, and seeds. |
| **dashboard** | dashboard@plotbudget.test | chromium-dashboard | Dashboard and settings only. Isolated so blueprint cleanup/serial tests don’t affect it. |

**Why a separate dashboard user?**  
Blueprint specs run in serial and call `ensureBlueprintReady` in `beforeEach` (cleanup + ensure household). If dashboard specs share the same user (blueprint), session or DB state can be inconsistent when opening settings or when running after blueprint tests. A dedicated dashboard user and project avoids that.

---

## 2. Auth state and base URL

- **Auth state files** are created in **global setup** by logging in against the **same base URL** that tests use.
- **CI localhost:** `PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000` → setup and tests use localhost; cookies match.
- **CI Vercel preview:** `PLAYWRIGHT_TEST_BASE_URL=<preview-url>` → setup must run against that URL so saved cookies are for the preview origin. Global setup uses `config.projects[0].use.baseURL`, which comes from env, so as long as CI sets `PLAYWRIGHT_TEST_BASE_URL` before `pnpm test:e2e`, setup and tests share the same origin.

**Rule:** Never commit auth state that was saved for one origin and run tests against another (e.g. localhost state vs Vercel URL). In CI, setup runs first and writes state for the current base URL.

---

## 3. Global setup order

1. **Clean** test data (`cleanupAllTestUsers`).
2. **Create** auth users if missing (`ensureAuthUserExists` for blueprint, ritual, dashboard).
3. **Sync** to `public.users` and **prepare** households (`ensureUserInPublicUsers`, `ensureBlueprintReady` / dashboard equivalent) **before** logging in.
4. **Then** for each project: launch browser, log in at base URL, wait for dashboard/onboarding, **save storage state**.

So when we save state, the user already has `has_completed_onboarding: true` and a household. We’re not saving state and then mutating the DB after; the DB is ready before login, so the first navigation in tests sees the right redirects.

---

## 4. Blueprint “add seed” and list updates

- **Problem:** After creating a seed, the list is updated by `router.refresh()`. In CI, that RSC refetch can be slow or not visible, so the test times out waiting for the new seed card.
- **Approach:** Don’t rely only on `router.refresh()`. After the add-seed dialog closes (create succeeded), **navigate** to `/dashboard/blueprint` with `page.goto('/dashboard/blueprint')` and then assert the seed card is visible. That forces a full server render and avoids depending on client-side refresh timing. We do **not** use `page.reload()` (can trigger redirect loops with auth middleware).

---

## 5. Dashboard / settings

- Dashboard and settings specs run in the **chromium-dashboard** project with the **dashboard** user and its own auth state.
- After opening the user menu and clicking Settings, we **fail fast** if the URL is `/login` (e.g. throw “Session lost: redirected to login when opening settings”) so CI logs are clear.

---

## 6. What to add or change

- **Add dashboard user** in `TEST_USERS` and in global setup (create, sync, ensure household + onboarding done, then log in and save `dashboard.json`).
- **Add chromium-dashboard project** in Playwright config: `storageState: dashboardStatePath`, `testMatch: [/dashboard\.spec\.ts/]`.
- **Global setup:** Run `ensureUserInPublicUsers` and `ensureBlueprintReady` (and dashboard equivalent) **before** the login loop; keep cleanup first.
- **Blueprint page object:** After addSeed dialog closes, `page.goto('/dashboard/blueprint')` then `expect(seedCard).toBeVisible()`.
- **Dashboard spec:** Optional fail-fast if redirected to login after clicking Settings.
