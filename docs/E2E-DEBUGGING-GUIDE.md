# E2E debugging guide

Use this when CI fails on **Blueprint “add a new recurring need seed”** (seed card never appears) or **Dashboard “settings page loads from user menu”** (redirect to login).

**See also:** `docs/E2E-TEST-APPROACH.md` for the rethought approach (separate dashboard user, goto-after-add-seed, global setup order).

**Prerequisites:** The Supabase project used for E2E (e.g. `NEXT_PUBLIC_SUPABASE_URL`) should have all migrations applied. If onboarding tests fail with "Could not find the 'currency' column of 'households' in the schema cache", apply migrations (e.g. `supabase db push` or run `supabase/migrations/20250209120001_household_currency.sql`). The app will retry the household insert without `currency` when this error occurs so tests can pass even if that migration is missing (household will use default GBP).

---

## Failure 1: Seed card never appears after add (“add a new recurring need seed”)

**Symptom:** Dialog closes, then `seed-card-rent` is not found within 30s.

**Possible causes:** Seed not created (server action / RLS), or list not refreshing after create.

### Step 1: Run the test locally with headed mode and slow motion

```bash
cd apps/web
npx playwright test tests/specs/blueprint.spec.ts --project=chromium-blueprint -g "add a new recurring need seed" --headed --slow-mo=500
```

- Watch whether the dialog shows an error before closing.
- After “Add”, watch the network tab: does a server action POST succeed (200)? Any 4xx/5xx?
- After the dialog closes, does the list ever update (e.g. new request to `/dashboard/blueprint` or RSC)?

### Step 2: Check server logs when the action runs

With the app running locally:

```bash
cd apps/web && pnpm dev
```

In another terminal, run the same test (or repeat the add-seed flow manually). In the dev server stdout, look for:

- Uncaught errors or stack traces when submitting the add-seed form.
- Supabase/RLS errors (e.g. “permission denied”, “row-level security”).

### Step 3: Confirm seed create in the database

After a failing run (or after one add-seed in headed mode), check Supabase:

1. **Supabase Dashboard** → Table Editor → `seeds`.
2. Filter by `household_id` for the blueprint test user’s household (get `household_id` from `users` for `blueprint@plotbudget.test`).
3. See if a “Rent” seed exists for the current pay cycle.

- **If no row:** Create is failing (server action error or RLS blocking insert). Check RLS policies on `seeds` (INSERT with `household.owner_id = auth.uid()`).
- **If row exists:** Create works; the UI isn’t updating (e.g. `router.refresh()` / RSC not refetching in test env).

### Step 4: Verify auth in the server action (CI vs local)

Server action uses `createServerSupabaseClient()` (cookies). In CI:

- Ensure the test uses the **same base URL** as the one used to save the auth state (e.g. `PLAYWRIGHT_TEST_BASE_URL` matches where `blueprint.json` was created).
- If tests hit a different origin, cookies may not be sent and the action may run unauthenticated → RLS can block the insert.

Quick check: add a temporary `console.log` in `createSeed` (e.g. log `(await supabase.auth.getUser()).data.user?.id`) and run the test; inspect server logs to see if the user is set.

---

## Failure 2: Settings redirects to login (“settings page loads from user menu”)

**Symptom:** Click Settings → navigate to `/login?redirect=%2Fdashboard%2Fsettings` → `waitForURL(/\/dashboard\/settings/)` times out.

**Possible causes:** Session not sent with the Settings navigation (e.g. link opens without cookies), or middleware treating the request as unauthenticated.

### Step 1: Run the test in headed mode

```bash
cd apps/web
npx playwright test tests/specs/dashboard.spec.ts --project=chromium-blueprint -g "settings page loads" --headed --slow-mo=500
```

- After opening the user menu and clicking Settings, does the browser go to `/dashboard/settings` first and then redirect to login, or go straight to login?
- In DevTools → Application → Cookies: before clicking Settings, are Supabase auth cookies present for the test origin?

### Step 2: Check middleware and settings page auth

- **Middleware** (`middleware.ts`): Uses `getUser()`. If the request to `/dashboard/settings` has no cookies (or wrong origin), `user` is null → redirect to login.
- **Settings page** (`app/dashboard/settings/page.tsx`): Loads household with `household_id` where `owner_id = user.id`. If that query returns no row, the page redirects to `/onboarding` (not login). So a redirect to **login** usually means middleware didn’t see a session.

Confirm: in the failing run, is the **first** request to `/dashboard/settings` sent with cookies? (Use Playwright trace or “Record trace” and inspect the request headers for that navigation.)

### Step 3: Ensure auth state matches the run URL

- **CI:** `PLAYWRIGHT_TEST_BASE_URL` (e.g. `https://xxx.vercel.app`) must be the same origin the browser uses when running the chromium-blueprint tests. Auth state is saved per-origin; if the state was saved for `localhost` but CI runs against a preview URL, cookies won’t be sent.
- **Global setup:** If auth state is created by a setup that runs against one URL (e.g. localhost) and CI runs against another, re-run the setup against the CI base URL and commit the updated state (or generate it in CI before tests).

### Step 4: Optional – fail fast with a clear message

In the dashboard spec, after opening the menu and clicking Settings, you can assert you didn’t land on login:

```ts
await page.getByTestId('user-menu-settings').click();
await page.waitForURL(/\/(dashboard\/settings|login)/, { timeout: 10_000 });
if (page.url().includes('/login')) {
  throw new Error('Session lost: redirected to login when opening settings. Check baseURL and auth state origin.');
}
await page.waitForURL(/\/dashboard\/settings/);
// ...
```

That won’t fix the redirect but will make the failure message explicit.

---

## Checklist summary

| Failure | Check | Where / how |
|--------|--------|--------------|
| Seed card not found | Server action returns 200? | Network tab, headed run |
| Seed card not found | Any error in dev server stdout? | Terminal running `pnpm dev` |
| Seed card not found | Row in `seeds` after run? | Supabase → `seeds` (+ household from `users`) |
| Seed card not found | RLS allows insert for test user? | `docs/supabase-rls-policies.sql`, Supabase policies |
| Settings → login | Cookies present before click? | DevTools → Application → Cookies |
| Settings → login | Same base URL as auth state? | CI env vs. where `blueprint.json` was saved |
| Both | User id in server action? | Temporary `console.log` in `createSeed` / middleware |

---

## Running a single test with trace (for any failure)

```bash
cd apps/web
npx playwright test tests/specs/blueprint.spec.ts -g "add a new recurring need seed" --project=chromium-blueprint --trace=on
```

Then open the trace (e.g. `npx playwright show-trace test-results/.../trace.zip`) and inspect:

- **Network:** Requests to your app and Supabase; status codes and response bodies.
- **Console:** Client-side errors.
- **Snapshot:** DOM at each step (e.g. right after submit, and when waiting for `seed-card-rent`).

This gives you a reproducible record to see exactly when the redirect or missing card happens.
