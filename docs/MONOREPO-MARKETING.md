# Monorepo: Marketing Site Integration

The marketing site (plotbudget.com) lives in `apps/marketing` as part of the PlotBudget monorepo. This doc is the single reference for structure, commands, deployment, and how marketing links to the app. (The former **Marketing Site Integration Guide** was merged here and removed.)

---

## Structure

```
plotbudget/
├── apps/
│   ├── web/          # Next.js app — app.plotbudget.com
│   └── marketing/    # Vite + React — plotbudget.com
├── packages/
│   └── ...
└── turbo.json
```

---

## User flow (Option A: two domains)

1. User is on **plotbudget.com** (marketing).
2. They click Sign Up or Log In → they go to **app.plotbudget.com**.
3. Auth and all product use happen on **app.plotbudget.com** (onboarding, dashboard, blueprint, settings).
4. Optional: from the app, "Pricing" / "Upgrade" can link back to **plotbudget.com/pricing**.

Marketing does **not** handle login/signup; it only links to the app. Auth and cookies are scoped to `app.plotbudget.com`.

**Pricing and payment:** Visitors see pricing (Trial, Free, Premium) on the marketing site. Payment is only taken inside the app after signup (Polar). CTAs on marketing (e.g. "Start free trial") send users to **app.plotbudget.com/signup**.

---

## Commands

```bash
# Install (from root)
pnpm install

# Run both apps
pnpm dev
# → Web: http://localhost:3000
# → Marketing: http://localhost:3001

# Run marketing only
pnpm dev --filter=@repo/marketing

# Build all
pnpm turbo run build

# Build marketing only
pnpm turbo run build --filter=@repo/marketing
```

---

## Configuration (marketing app)

### App base URL

Use a single base URL for all app links so you can change environments in one place.

| Env var (marketing is Vite) | Example | Use |
|-----------------------------|---------|-----|
| `VITE_PLOTBUDGET_APP_URL`   | `https://app.plotbudget.com` | Production |
| (unset → fallback below)    | `https://app.plotbudget.com` | Default |

Use this when building links (see snippets and checklist below). For staging, set the env to your app preview URL.

### Pricing visibility

Set `VITE_PRICING_ENABLED=true` in the marketing app when you want the pricing section and Pricing nav/footer links to show. Keep in sync with the app’s pricing flag (`NEXT_PUBLIC_PRICING_ENABLED` / PostHog) so marketing and app go live together.

### No auth or Supabase on marketing

The marketing site does **not** need Supabase keys, auth, or API calls. All signup/login happens on the app; marketing only redirects via normal links.

---

## Canonical app URLs

All of these live on **app.plotbudget.com**. Use HTTPS.

| Purpose | Path | Full URL (production) |
|--------|------|------------------------|
| Sign up | `/signup` | `https://app.plotbudget.com/signup` |
| Log in | `/login` | `https://app.plotbudget.com/login` |
| Forgot password | `/reset-password` | `https://app.plotbudget.com/reset-password` |
| Pricing → signup (e.g. Pro) | `/signup?plan=pro` | `https://app.plotbudget.com/signup?plan=pro` |

---

## Link checklist (marketing site)

Every CTA that should start signup or login must point at the app.

- [ ] **Pricing section or page** on marketing with same tiers as app (Trial, Free, Premium); nav and footer link to it (e.g. "Pricing" → `#pricing` or `/pricing`).
- [ ] **Header / nav "Sign Up" (or "Get Started")** → app `/signup`
- [ ] **Header / nav "Log In"** → app `/login`
- [ ] **Hero / above-the-fold primary CTA** → app `/signup`
- [ ] **Pricing section "Start free trial" / "Get started"** → app `/signup`
- [ ] **Footer "Pricing"** → in-page `#pricing` or marketing `/pricing`; **Footer "Log in"** → app `/login`; **Footer "Sign up"** → app `/signup`
- [ ] **Any "Forgot password?"** → app `/reset-password`
- [ ] **Email CTAs (if sent from marketing)** → same app URLs

**Keep on marketing (plotbudget.com):** Blog, docs, terms, privacy, contact/support unless you explicitly move them to the app.

---

## Example snippets (marketing is Vite + React)

Use your app base URL (env or constant) in place of `APP_URL`.

```tsx
const APP_URL = import.meta.env.VITE_PLOTBUDGET_APP_URL ?? 'https://app.plotbudget.com';

<a href={`${APP_URL}/signup`}>Sign Up</a>
<a href={`${APP_URL}/login`}>Log In</a>
<a href={`${APP_URL}/signup?plan=pro`}>Get Pro</a>
```

Use `target="_blank"` and `rel="noopener noreferrer"` only if you want the app in a new tab (usually same tab is better).

---

## App → marketing (back links)

The app may link back to marketing for:

- **Pricing / upgrade:** `https://plotbudget.com/pricing`
- **Terms / privacy:** if hosted on marketing, e.g. `https://plotbudget.com/terms`, `https://plotbudget.com/privacy`

Ensure those pages exist on the marketing site and match the URLs the app uses.

---

## Vercel deployment

**Separate Vercel projects** for each app (same repo). See [PRODUCTION-INFRASTRUCTURE.md](PRODUCTION-INFRASTRUCTURE.md) for the full table.

| Project   | Root Directory     | Domain              |
|-----------|--------------------|---------------------|
| App       | `plotbudget`       | app.plotbudget.com  |
| Marketing | `plotbudget/apps/marketing` (or Root = `plotbudget`, app root = `apps/marketing`) | plotbudget.com      |

**Marketing Vercel project:**

1. Root Directory: `apps/marketing` (or equivalent so the app root is that folder).
2. Build: from `apps/marketing/vercel.json` — framework Vite, output `dist`, install from monorepo root (`cd ../.. && pnpm install`).
3. Environment variables: `VITE_PLOTBUDGET_APP_URL`, `VITE_PRICING_ENABLED`; MailerLite if used: `MAILERLITE_API_KEY`, `MAILERLITE_GROUP_ID`.

See `apps/marketing/README.md` for app-specific deployment details.

---

## DNS and deployment (reference)

- **plotbudget.com** → marketing Vercel project (this repo, `apps/marketing`).
- **app.plotbudget.com** → app Vercel project (this repo, `apps/web`).

Supabase redirect URLs and Site URL are configured in the **app** project and Supabase dashboard for `https://app.plotbudget.com`. The marketing site does not need Supabase config.

---

## Quick reference

| CTA / link | Target URL |
|------------|------------|
| Sign Up / Get Started | `https://app.plotbudget.com/signup` |
| Log In | `https://app.plotbudget.com/login` |
| Forgot password | `https://app.plotbudget.com/reset-password` |
| Pricing → Sign up (e.g. Pro) | `https://app.plotbudget.com/signup?plan=pro` |

---

For **strategy** (Option A vs B, seamless journey, checklists), see [MARKETING-APP-INTEGRATION.md](MARKETING-APP-INTEGRATION.md).
