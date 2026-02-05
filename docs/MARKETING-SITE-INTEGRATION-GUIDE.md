# PlotBudget: Marketing Site Integration Guide (Option A)

**Use this doc in your marketing site repo.** It describes how the marketing site (plotbudget.com) connects to the PlotBudget app (app.plotbudget.com) so the journey is seamless and all links stay in sync.

---

## 1. App context

- **Product name:** PLOT / PlotBudget  
- **App domain:** `https://app.plotbudget.com`  
- **App stack:** Next.js (monorepo `apps/web`), Supabase (auth + Postgres).  
- **Marketing domain:** `https://plotbudget.com` (this repo).

**Flow we’re implementing (Option A – two domains):**

1. User is on **plotbudget.com** (marketing).
2. They click Sign Up or Log In → they go to **app.plotbudget.com**.
3. Auth and all product use happen on **app.plotbudget.com** (onboarding, dashboard, blueprint, settings).
4. Optional: from the app, “Pricing” / “Upgrade” can link back to **plotbudget.com/pricing**.

Marketing does **not** handle login/signup; it only links to the app. Auth and cookies are scoped to `app.plotbudget.com`.

---

## 2. Configuration (marketing site)

### 2.1 App base URL

Use a single base URL for all app links so you can change environments (e.g. staging) in one place.

**Recommended: environment variable**

| Name | Example value | When to use |
|------|----------------|-------------|
| `NEXT_PUBLIC_PLOTBUDGET_APP_URL` | `https://app.plotbudget.com` | Next.js / Node |
| `PLOTBUDGET_APP_URL` or `APP_URL` | `https://app.plotbudget.com` | Static/CMS/build-time |

- **Production:** `https://app.plotbudget.com`  
- **Staging (if you have it):** e.g. `https://app-staging.plotbudget.com` or your Vercel preview URL for the app.

Use this variable when building links (see section 4). If you don’t use env vars, hardcode `https://app.plotbudget.com` and keep it in sync when the app URL changes.

### 2.2 No auth or Supabase on marketing

- The **marketing site does not** need Supabase keys, auth, or API calls.
- All signup/login happens on the app; marketing only redirects via normal links.

---

## 3. Canonical app URLs (Option A)

All of these live on **app.plotbudget.com**. Use HTTPS.

| Purpose | Path | Full URL (production) |
|--------|------|------------------------|
| Sign up | `/signup` | `https://app.plotbudget.com/signup` |
| Log in | `/login` | `https://app.plotbudget.com/login` |
| Forgot password | `/reset-password` | `https://app.plotbudget.com/reset-password` |
| Pricing → signup (e.g. Pro) | `/signup?plan=pro` | `https://app.plotbudget.com/signup?plan=pro` |

**After signup/login:** the app redirects users to onboarding or dashboard; you don’t need to link to those from marketing.

**Optional query params for signup (if the app supports them later):**

- `plan=pro` (or similar) for pricing-page CTAs.

---

## 4. Where to use these links on the marketing site

Every CTA that should start signup or login must point at the app using the URLs above.

### 4.1 Checklist

- [ ] **Header / nav “Sign Up” (or “Get Started”)** → app `/signup`
- [ ] **Header / nav “Log In”** → app `/login`
- [ ] **Hero / above-the-fold primary CTA** → app `/signup`
- [ ] **Pricing table “Get started” / “Choose plan”** → app `/signup` or `/signup?plan=pro` (or equivalent)
- [ ] **Footer “Log in”** → app `/login`
- [ ] **Footer “Sign up”** → app `/signup`
- [ ] **Any “Forgot password?”** → app `/reset-password`
- [ ] **Email CTAs (if you send from marketing)** → same app URLs (e.g. `https://app.plotbudget.com/signup`)

### 4.2 What not to link to the app

- Blog, docs, pricing, terms, privacy: keep on **plotbudget.com** unless you explicitly move them to the app.
- “Contact” / “Support”: use your own flow (e.g. plotbudget.com/contact or external tool).

---

## 5. Example snippets (by stack)

Use your app base URL (env or constant) in place of `APP_URL`.

### 5.1 Plain HTML / static

```html
<a href="https://app.plotbudget.com/signup">Sign Up</a>
<a href="https://app.plotbudget.com/login">Log In</a>
<a href="https://app.plotbudget.com/signup?plan=pro">Get Pro</a>
```

### 5.2 Next.js (marketing site)

```tsx
const APP_URL = process.env.NEXT_PUBLIC_PLOTBUDGET_APP_URL ?? 'https://app.plotbudget.com';

<Link href={`${APP_URL}/signup`}>Sign Up</Link>
<Link href={`${APP_URL}/login`}>Log In</Link>
<Link href={`${APP_URL}/signup?plan=pro`}>Get Pro</Link>
```

Use `target="_blank"` and `rel="noopener noreferrer"` only if you intentionally want the app in a new tab (usually same tab is better so the user doesn’t have two tabs).

### 5.3 React (generic)

```tsx
const APP_URL = import.meta.env.VITE_PLOTBUDGET_APP_URL ?? 'https://app.plotbudget.com';

<a href={`${APP_URL}/signup`}>Sign Up</a>
<a href={`${APP_URL}/login`}>Log In</a>
```

### 5.4 CMS / no env (hardcoded)

Use these exact URLs and update them if the app domain ever changes:

- Sign up: `https://app.plotbudget.com/signup`
- Log in: `https://app.plotbudget.com/login`
- Reset password: `https://app.plotbudget.com/reset-password`
- Pricing CTA: `https://app.plotbudget.com/signup?plan=pro`

---

## 6. App → marketing (back links)

The app may link back to marketing for:

- **Pricing / upgrade:** `https://plotbudget.com/pricing`
- **Terms / privacy:** if hosted on marketing, e.g. `https://plotbudget.com/terms`, `https://plotbudget.com/privacy`

No configuration is required on the marketing site for these; just ensure those pages exist and match the URLs the app uses.

---

## 7. DNS and deployment (reference)

- **plotbudget.com** → points to the **marketing** project (this repo).
- **app.plotbudget.com** → points to the **app** project (separate repo, `apps/web`).

Supabase redirect URLs and Site URL are configured in the **app** project and Supabase dashboard for `https://app.plotbudget.com`; the marketing site does not need Supabase config.

---

## 8. Quick reference table

| CTA / link | Target URL |
|------------|------------|
| Sign Up / Get Started | `https://app.plotbudget.com/signup` |
| Log In | `https://app.plotbudget.com/login` |
| Forgot password | `https://app.plotbudget.com/reset-password` |
| Pricing → Sign up (e.g. Pro) | `https://app.plotbudget.com/signup?plan=pro` |

---

*Last updated for Option A (two domains). For the full strategy and Option B, see the app repo: `docs/MARKETING-APP-INTEGRATION.md`.*
