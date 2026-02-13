# Production Infrastructure Setup

PlotBudget V2 production launch: separate dev/staging and production environments, database isolation, custom domain, and safe deployment.

## Environment Summary

| Environment | Database        | App URL                          | Use case        |
|-------------|-----------------|-----------------------------------|-----------------|
| Local       | Dev Supabase    | http://localhost:3000            | Development     |
| Preview     | Dev Supabase    | `[branch]-plotbudget.vercel.app`  | PR testing      |
| Production  | Prod Supabase   | https://app.plotbudget.com        | Live users      |

---

## Vercel projects (App + Marketing)

Both the main app and the marketing site deploy from the same repo (`plotbudget`). Use two Vercel projects so each has its own URL and build.

| Project     | Purpose        | Root Directory   | Build / config                                                                 | Typical URL              |
|-------------|----------------|------------------|---------------------------------------------------------------------------------|--------------------------|
| **App**     | Next.js app    | `plotbudget`     | From `apps/web/vercel.json`: `pnpm turbo build --filter=@repo/web`, install from repo root. | https://app.plotbudget.com |
| **Marketing** | Vite marketing site | `plotbudget` → app root `apps/marketing` | From `apps/marketing/vercel.json`: framework Vite, output `dist`, install `cd ../.. && pnpm install`. | https://plotbudget.com   |

- **App:** Set Vercel project Root Directory to `plotbudget` (or repo root if the repo is already `plotbudget`). The build runs from monorepo root and targets `@repo/web`. Env vars: Supabase, Resend, Polar, PostHog, `NEXT_PUBLIC_*`, `CRON_SECRET`, etc. (see Step 2).
- **Marketing:** Same repo; set Root Directory so the application root is `apps/marketing` (e.g. Root Directory = `plotbudget/apps/marketing` if repo root is the parent of `plotbudget`). Env vars: `VITE_*` only (e.g. `VITE_GA_MEASUREMENT_ID`, `VITE_PRICING_ENABLED`); no Supabase or server secrets. Uses MailerLite (or similar) for waitlist; configure in the marketing app’s env in Vercel.

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

All local env for the Next.js app lives in **`apps/web/.env.local`** only (no root `.env.local`). Copy `apps/web/.env.example` to `apps/web/.env.local` and fill in values.

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

### Polar (production payments)

For live Polar payments, set these in Vercel Production (see [POLAR-SETUP.md](./POLAR-SETUP.md)):

| Variable | Required |
|----------|----------|
| `POLAR_ACCESS_TOKEN` | Yes (production token from polar.sh) |
| `POLAR_WEBHOOK_SECRET` | Yes (from production webhook) |
| `POLAR_SUCCESS_URL` | Yes (`https://app.plotbudget.com/dashboard?checkout_id={CHECKOUT_ID}`) |
| `POLAR_PWYL_GBP_PRODUCT_ID` | Yes |
| `POLAR_PWYL_USD_PRODUCT_ID` | Yes (can reuse PWYL product ID) |
| `POLAR_PWYL_EUR_PRODUCT_ID` | Yes (can reuse PWYL product ID) |
| `POLAR_PREMIUM_PRODUCT_ID` | Yes |
| `POLAR_PREMIUM_ANNUAL_PRODUCT_ID` | Optional |
| `POLAR_SANDBOX` | **Omit or `false`** for production — never `true` |

### Partner invite email (Resend)

Partner invite emails are sent from the Next.js app via [Resend](https://resend.com). Set these in **every environment** where you want invites to send (local, Preview, production):

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Resend API key (create in Resend dashboard). Required for sending. |
| `RESEND_FROM_EMAIL` | Sender string, e.g. `PLOT <hello@plotbudget.com>`. Defaults to Resend onboarding address if unset. |

- **App URL for invite links:** The app uses `NEXT_PUBLIC_APP_URL` when set; on Vercel Preview it falls back to `VERCEL_URL` (set automatically), and locally to `http://localhost:3000`. Set `NEXT_PUBLIC_APP_URL` in production and optionally in Preview if you want a specific base URL.
- **Supabase:** Partner invites do not use Supabase Auth email; they are sent by the app. No Supabase email/SMTP config is required for this feature.

**Optional:** `ALLOWED_EMAILS` (comma-separated). If set, only those emails can sign up; if unset, signups are public.

### Auth feature flags (signup gating / beta)

Use these to keep production live but gate public signup until ICO/privacy/terms are ready:

| Variable | Values | Effect |
|----------|--------|--------|
| `NEXT_PUBLIC_SIGNUP_GATED` | `true` / unset | When `true`, `/signup` shows a waitlist CTA instead of the form; login shows beta message and hides Forgot password + Google login. **Also:** when `true`, all payment/pricing UI is hidden (no `/pricing`, no Pricing link in user menu, no Subscription tab in settings). |
| `NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED` | `true` / unset | When `true`, the Google login option is shown on auth forms. |
| `NEXT_PUBLIC_WAITLIST_URL` | URL | Link for "Register for the waitlist" when signup is gated (e.g. MailerLite form or `https://plotbudget.com`). Defaults to `https://plotbudget.com` if unset. |
| `NEXT_PUBLIC_PRICING_ENABLED` | `true` / unset | When `true` (and signup not gated), full premium pricing (fixed tiers) is shown on the pricing page. PostHog flag `pricing-enabled` overrides when set. **Marketing site:** set `VITE_PRICING_ENABLED=true` in the marketing app so the pricing section and Pricing nav/footer links appear there too; keep in sync with the app flag. |

**Payment/pricing three states:**

1. **signup-gated ON** — No pricing or payment: `/pricing` redirects, no Pricing link in user menu (avatar), no Subscription tab in settings.
2. **signup-gated OFF** — PWYL pricing page, Pricing link in user menu, Subscription tab in settings visible.
3. **pricing-enabled ON** (and signup-gated OFF) — Full premium pricing configuration visible on the pricing page in addition to PWYL.

**PostHog (optional):** If `NEXT_PUBLIC_POSTHOG_KEY` is set, feature flags `signup-gated`, `google-login-enabled`, `avatar-enabled`, and `pricing-enabled` from PostHog override the corresponding env vars. Create these flags in PostHog → Feature Flags. **Server-side evaluation:** Proxy, the pricing page, settings page, dashboard layout, and avatar actions all fetch flags from PostHog's `/flags` API when the key is set, so PostHog flags apply on both client and server. Env vars are used only when PostHog is not configured.

**Local development – payment toggle:** On develop (e.g. `NODE_ENV=development` or `NEXT_PUBLIC_APP_URL` contains `localhost`), you can set `NEXT_PUBLIC_DEV_PAYMENTS` in `.env.local` to quickly switch payment state without changing other flags: `off` (state 1), `pwyl` (state 2), or `full` (state 3). Only applied in development context.

| `NEXT_PUBLIC_PRICING_ENABLED` | `true` / unset | When `true`, in-app pricing page and subscription/pricing functionality are shown. PostHog flag `pricing-enabled` overrides when set. **Marketing site:** set `VITE_PRICING_ENABLED=true` in the marketing app so the pricing section and Pricing nav/footer links appear there too; keep in sync with the app flag. |

**PostHog (optional):** If `NEXT_PUBLIC_POSTHOG_KEY` is set, feature flags `signup-gated`, `google-login-enabled`, `avatar-enabled`, and `pricing-enabled` from PostHog override the corresponding env vars. Create these flags in PostHog → Feature Flags.

**Region restriction:** Signup is only allowed from the UK, EU, USA, and Canada. Country is set from Vercel geo (`request.geo.country`) in middleware; if the country is not in the allowed list, the signup page shows a region-restricted message and waitlist CTA. Partner-invite flows bypass this check.

**Founding Members (first 50):** Marketing and FAQ state that the first 50 users get one year of Premium free. This is enforced in the database: trigger `on_user_created_set_founding_member` runs after each insert into `public.users`; if total user count is ≤ 50, it sets `founding_member_until = NOW() + 1 year` for that user. No manual script required.

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
- [ ] **Full security review and CI checks:** see [SECURITY-REVIEW.md](./SECURITY-REVIEW.md) (assessment, findings, and pipeline).

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
