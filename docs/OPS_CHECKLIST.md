# Zero-Ops pipeline — one-time setup checklist

Use this list to make the CI/CD pipeline and deployments work. Complete each section once.

## GitHub

### Repository secrets

Add these in **Settings → Secrets and variables → Actions** (repository secrets):

| Secret | Used by | Notes |
|--------|---------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | CI (E2E), optional in release | Supabase project URL (use non-production for CI if Preview uses it) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | CI (E2E) | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | CI (E2E) | Supabase service_role key (for test setup/teardown) |
| `VERCEL_TOKEN` | CI (E2E smoke on Vercel Preview) | Vercel → Settings → Tokens. Used to deploy from CI so smoke tests don't depend on vercel[bot]. |
| `VERCEL_ORG_ID` | CI (E2E smoke on Vercel Preview) | From `vercel link` or Vercel project → Settings → General. |
| `VERCEL_PROJECT_ID` | CI (E2E smoke on Vercel Preview) | From `vercel link` or Vercel project → Settings → General. |
| `SUPABASE_PROD_DATABASE_URL` | Release workflow only | Full Postgres URI. Use **Session pooler** (IPv4-friendly): `postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres` from Supabase → Settings → Database → Connection pooling. |

Get the production DB URL from Supabase Dashboard → **Settings → Database** → Connection string / Connection pooling (Session). Replace the password placeholder with your database password.

### Branch protection (main)

In **Settings → Branches** → Add/Edit rule for `main`:

- [ ] **Require a pull request** before merging (at least 1 approval if you want).
- [ ] **Require status checks to pass** before merging. Add these required checks (names must match the CI workflow job names):
  - `lint`
  - `type-check`
  - `Unit tests (Vitest)` (or the exact job name from the workflow)
  - `E2E on localhost`
  - `E2E smoke on Vercel Preview`
- [ ] Optionally: **Do not allow bypassing** the above, and disable force push / deletion of `main`.

---

## Vercel

- [ ] **Environment variables** — Set for **Production** and **Preview** as in [DEPLOYMENT.md](./DEPLOYMENT.md). Preview should use the non-production Supabase project so production data is never used in previews.
- [ ] **CI smoke tests** — The workflow deploys to Vercel from GitHub Actions (using `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) and runs smoke tests against that preview. Add those three secrets to GitHub so the "E2E smoke on Vercel Preview" job can run.

---

## Supabase

- [ ] **Production project** — Used only by the production app. In **Authentication → URL Configuration**, add your production app URL to Redirect URLs and set Site URL.
- [ ] **Preview / non-production project** — Create a second project for Preview (and local dev if desired). Add the Vercel preview URL pattern to Redirect URLs (e.g. `https://*.vercel.app/**` or list specific preview URLs). Do not use the production DB for Preview.
- [ ] **Migrations** — Production migrations are applied automatically by the release workflow on push to `main`. Manual `supabase db push` (or running `apps/web/scripts/migrate-prod.sh`) is only for emergencies or one-off fixes.

---

## Local (developer experience)

- [ ] After cloning the repo, run **`pnpm install`** so Husky installs the git hooks. The pre-commit hook runs lint-staged (lint + type-check) and will block commits that fail.
- [ ] To bypass the hook in rare cases: `git commit --no-verify` (use sparingly).
