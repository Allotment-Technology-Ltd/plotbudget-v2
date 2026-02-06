# Production Infrastructure Setup

PlotBudget V2 production launch: separate dev/staging and production environments, database isolation, custom domain, and safe deployment.

## Environment Summary

| Environment | Database        | App URL                          | Use case        |
|-------------|-----------------|-----------------------------------|-----------------|
| Local       | Dev Supabase    | http://localhost:3000            | Development     |
| Preview     | Dev Supabase    | `[branch]-plotbudget.vercel.app`  | PR testing      |
| Production  | Prod Supabase   | https://app.plotbudget.com        | Live users      |

---

## Step 1: Supabase Project Structure

### 1.1 Development/Staging (`plotbudget-dev`)

- **Purpose:** Testing, CI/CD previews, development.
- **Region:** London (eu-west-2).
- Create at [supabase.com/dashboard](https://supabase.com/dashboard).
- Run migrations: `supabase db push --db-url postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres`
- Seed test data (dev only): `psql $DATABASE_URL -f apps/web/scripts/seed-test-data.sql`

### 1.2 Production (`plotbudget-prod`)

- **Purpose:** Live user data only.
- Same region (London).
- Enable: Connection pooling, RLS on all tables.
- Run migrations only (no test data). Use `apps/web/scripts/migrate-prod.sh` with care.

---

## Step 2: Environment Variables

### Local (`apps/web/.env.local`)

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` → dev project.
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- Resend/Polar/PostHog: use test keys. `CRON_SECRET`: any random string.

### Vercel Preview

- Same Supabase (and other) keys as dev. Scope: **Preview**.
- `NEXT_PUBLIC_APP_URL` can use `VERCEL_URL` (Vercel sets preview URL automatically).

### Vercel Production

- **Production** scope only: prod Supabase URL/anon/service_role, prod Resend/Polar/PostHog.
- `NEXT_PUBLIC_APP_URL=https://app.plotbudget.com`
- Strong, unique `CRON_SECRET`.

**Optional:** `ALLOWED_EMAILS` (comma-separated). If set, only those emails can sign up; if unset, signups are public.

---

## Step 3: Custom Domain (app.plotbudget.com)

1. Vercel → Project → Settings → Domains → Add `app.plotbudget.com`.
2. At your DNS (Squarespace, Cloudflare, etc.): add CNAME `app` → `cname.vercel-dns.com`.
3. Wait for SSL; optionally set as primary domain in Vercel.

---

## Step 4: Marketing Site → App Login

- **Log In:** `https://app.plotbudget.com/login`
- **Sign up:** `https://app.plotbudget.com/signup`
- Optional: add `?ref=homepage` (or similar) for analytics.

---

## Step 5: Database Migration Strategy

- **Dev/staging:** `supabase db push` (or link + push) as needed.
- **Production:** Use `apps/web/scripts/migrate-prod.sh`; run only after testing on dev and backing up prod.
- Checklist: test on dev first, backup prod, review SQL for destructive ops, run in low-traffic window.

---

## Step 6: Seed Data (Dev Only)

- Script: `apps/web/scripts/seed-test-data.sql`
- Run only against dev DB: `psql $DEV_DATABASE_URL -f apps/web/scripts/seed-test-data.sql`
- **Never run on production.**

---

## Step 7: Deployment Pipeline

- **Production branch:** `main`. Deploys to production (prod env vars).
- **Preview:** All other branches (or e.g. `develop`) use Preview env vars.
- Vercel → Settings → Git: Production branch = `main`.

---

## Step 8: Security Checklist

- [ ] No `.env*` secrets in Git.
- [ ] Production secrets only in Vercel (Production scope).
- [ ] Supabase Auth: Site URL = `https://app.plotbudget.com`, Redirect URLs = `https://app.plotbudget.com/**`
- [ ] RLS enabled on all public tables; cron routes protected with `CRON_SECRET`.

---

## Step 9: Go-Live Checklist

- [ ] Prod Supabase created; migrations run; no test data.
- [ ] All production env vars set in Vercel.
- [ ] app.plotbudget.com added and SSL verified.
- [ ] Marketing site links to app login/signup.
- [ ] Full flow tested: signup → onboarding → dashboard.
- [ ] Terms/Privacy and cookie banner if required.

---

## Step 10: Rollback

- **Vercel:** Deployments → select last good deployment → Promote to Production.
- **Code:** `git revert HEAD && git push origin main`.
- **Database:** Restore from Supabase backup (last resort).
