# Marketing Site → App: Seamless User Journey

This doc describes how users get from **plotbudget.com** (marketing) to the app, and how to make that journey seamless with the marketing site as the front door.

---

## Recommendation: Yes, Make Marketing the Front Door

**Goal:** A visitor on plotbudget.com can sign up or log in without confusion. They should feel they’re moving from “learning about PLOT” to “using PLOT,” not jumping to a different product.

That means:

1. **One clear path in:** Marketing CTAs (Sign Up, Get Started, Log In) send users to the app’s auth pages.
2. **Pricing on marketing, payment in app:** Visitors see pricing (Trial / Free / Premium) on the marketing site. Payment is only taken inside the app after signup when they choose to upgrade (industry best practice).
3. **No dead ends:** Every app link from marketing works (signup, login, pricing section CTAs → signup).
4. **Consistent branding:** Same product name, look, and tone on both sides.
5. **Auth that works across the handoff:** Supabase redirect URLs and cookies are correct for the app domain (or same domain).

---

## Two Ways to Run Marketing + App

### Option A: Two Domains (Marketing + App Subdomain)

| Role        | Domain              | What it is                          |
|------------|---------------------|-------------------------------------|
| Marketing  | **plotbudget.com**  | Marketing site (separate repo/site) |
| App        | **app.plotbudget.com** | This repo (`apps/web`)          |

**User flow:**

1. User visits **plotbudget.com** (blog, pricing, features, etc.).
2. Clicks “Sign Up” or “Get Started” → **app.plotbudget.com/signup**.
3. Signs up → redirect to **app.plotbudget.com/onboarding** (or dashboard).
4. All product use happens on **app.plotbudget.com**.

**To make it seamless:**

- **On the marketing site:** Every primary CTA points to the app:
  - “Sign Up” / “Get Started” → `https://app.plotbudget.com/signup`
  - “Log In” → `https://app.plotbudget.com/login`
  - Pricing “Choose plan” → `https://app.plotbudget.com/signup?plan=pro` (or similar)
- **Supabase:** In **Authentication → URL Configuration** add:
  - Redirect URLs: `https://app.plotbudget.com/**`, `https://app.plotbudget.com/auth/callback`
  - Site URL: `https://app.plotbudget.com` (so auth redirects back to the app).
- **Cookies:** Auth lives on `app.plotbudget.com`; no cross-domain cookie sharing needed. User is “on the app” once they’re on the subdomain.
- **App → marketing (optional):** From the app, “Pricing” or “Upgrade” can link back to `https://plotbudget.com/pricing`. Logout stays on the app: `https://app.plotbudget.com/login`.

**Pros:** Clear split (marketing vs product), SEO and marketing can iterate independently.  
**Cons:** User sees a domain change (plotbudget.com → app.plotbudget.com); you must keep marketing links and Supabase URLs in sync.

---

### Option B: Single Domain (Marketing and App Together)

| Role        | Domain              | What it is                                      |
|------------|---------------------|-------------------------------------------------|
| Marketing + App | **plotbudget.com** | One Next.js app: `/` = marketing, `/signup`, `/dashboard` = app |

**User flow:**

1. User visits **plotbudget.com** (your current root page or a dedicated marketing layout).
2. Clicks “Sign Up” → **plotbudget.com/signup** (same domain).
3. Signs up → redirect to **plotbudget.com/onboarding** then **plotbudget.com/dashboard**.
4. Everything stays on **plotbudget.com**.

**To make it seamless:**

- **This repo already supports it:** Root `/` is a landing page; `/signup`, `/login`, `/dashboard`, etc. are the app. Deploy this single app to **plotbudget.com** (no subdomain).
- **Supabase:** Redirect URLs and Site URL use **plotbudget.com** (e.g. `https://plotbudget.com/**`, `https://plotbudget.com/auth/callback`, Site URL `https://plotbudget.com`).
- **No cross-domain at all:** One domain, one cookie scope, one place to maintain.

**Pros:** Truly seamless (no visible handoff), simpler auth and redirects, one codebase.  
**Cons:** Marketing and app live in the same codebase and deploy; you may want route or layout separation (e.g. `/` vs `/dashboard`) and middleware to protect app routes.

---

## Recommended Choice

- **If you have (or plan) a separate marketing site** (different repo, CMS, or static site): use **Option A** (plotbudget.com = marketing, app.plotbudget.com = app). Keep marketing as the front door by making every CTA point to `app.plotbudget.com/signup` or `/login`.
- **If marketing is “the root of this app”** (current setup: one Next.js app with `/` as landing): use **Option B** and deploy that single app to **plotbudget.com**. Marketing is the front door by definition; no second domain to configure.

Both can be seamless; Option B is simpler operationally, Option A is better if marketing and product are built and deployed separately.

---

## Implementation Checklist (Either Option)

### If Option A (Two Domains)

**Marketing site (plotbudget.com):**

- [ ] **Pricing section or page** with same tiers as app (Trial, Free, Premium); nav “Pricing” and footer “Pricing” link to it.
- [ ] “Sign Up” / “Get Started” → `https://app.plotbudget.com/signup`
- [ ] “Log In” → `https://app.plotbudget.com/login`
- [ ] Pricing section “Start free trial” / “Get started” → `https://app.plotbudget.com/signup` (payment happens in app after signup).
- [ ] No auth or payment on marketing; it only shows pricing and links to the app.

**App (app.plotbudget.com, this repo):**

- [ ] Root `/` can stay as a lightweight landing (or redirect to marketing) per product choice.
- [ ] `NEXT_PUBLIC_APP_URL` = `https://app.plotbudget.com` (for any redirects or emails).
- [ ] Supabase Redirect URLs and Site URL use `https://app.plotbudget.com`.
- [ ] In-app “Pricing” / “Upgrade” links → `https://plotbudget.com/pricing` (optional).

**Vercel/DNS:**

- [ ] plotbudget.com → marketing project (or main domain).
- [ ] app.plotbudget.com → app project (this repo, `apps/web`).

### If Option B (Single Domain)

**This repo (plotbudget.com):**

- [ ] Deploy this app as the only site on **plotbudget.com** (no app subdomain).
- [ ] `NEXT_PUBLIC_APP_URL` = `https://plotbudget.com`.
- [ ] Supabase Redirect URLs and Site URL use `https://plotbudget.com`.
- [ ] Middleware already protects `/dashboard`, `/onboarding`; `/` and `/login`, `/signup` stay public.
- [ ] Root `/` is the marketing front door; “GET EARLY ACCESS” → `/signup` (already done).

**Vercel/DNS:**

- [ ] plotbudget.com → this project (root directory `apps/web`).

---

## Summary

- **Yes:** The experience should be seamless, with the marketing site as the front door.
- **How:** Either marketing and app on the same domain (Option B, simplest) or marketing on plotbudget.com and app on app.plotbudget.com (Option A), with every CTA pointing to the app’s signup/login and Supabase configured for the app’s domain.
- **Next step:** Choose Option A or B, then apply the checklist above and ensure Supabase redirect URLs and `NEXT_PUBLIC_APP_URL` match the chosen domain(s).
