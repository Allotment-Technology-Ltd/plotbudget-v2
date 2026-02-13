# Security Review & CI Security Checks

Bank-grade security posture for PlotBudget (app + marketing site). This document covers the security assessment, findings, and CI-integrated checks so “is the app secure?” is answered continuously.

---

## 1. Security Assessment Summary

### 1.1 What’s Already Strong

| Area | Status | Notes |
|------|--------|------|
| **Secrets** | ✅ | Env vars for keys; no secrets in client bundle. Marketing MailerLite key server-side only (`api/subscribe.js`). |
| **Auth** | ✅ | Supabase Auth; middleware + `getUser()` on protected routes; session via httpOnly cookies. |
| **Webhooks** | ✅ | Polar webhook verified with `validateEvent(..., POLAR_WEBHOOK_SECRET)`. |
| **Cron** | ✅ | `/api/cron/trial-emails` protected with `CRON_SECRET` Bearer. |
| **Dev routes** | ✅ | `/dev/*` gated by `isTrialTestingDashboardAllowed()` + auth; dev APIs same gate. |
| **Headers (app)** | ✅ | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-XSS-Protection. |
| **RLS** | ✅ | RLS enabled on public tables (households, users, paycycles, seeds, pots, repayments, income_sources, subscriptions). |
| **Input (marketing)** | ✅ | Waitlist email validated server-side (format + server-only API key). |
| **Dependencies** | ⚠️ | Lockfile present; `pnpm audit` not yet in CI. |

### 1.2 Findings and Recommendations

#### High – Checkout API authorization (IDOR risk)

- **Where:** `GET /api/checkout` accepts `household_id` and `user_id` from query params with no auth.
- **Risk:** Anyone can trigger a Polar checkout with an arbitrary `household_id`/`user_id`. Webhook then associates the subscription with that household. Could confuse billing or be abused.
- **Fix:** Require authentication (e.g. session) for `GET /api/checkout`. Resolve the current user’s `household_id` (and `user_id`) server-side and pass those to Polar; ignore or reject client-supplied ids for metadata. Optionally allow query params only when they match the authenticated user’s household.

#### Medium – Security headers (HSTS & CSP)

- **Missing:** Strict-Transport-Security (HSTS), Content-Security-Policy (CSP).
- **Fix:**  
  - Add HSTS (e.g. `max-age=31536000; includeSubDomains; preload`) in production (Vercel can add it; or via `next.config.js` headers).  
  - Add a CSP that allows your app + Supabase/PostHog/Polar/Resend origins; start with `default-src 'self'` and relax only where needed (scripts, styles, connect, img, frame-ancestors). Use report-only first if you prefer.

#### Medium – innerHTML in one component

- **Where:** `apps/web/components/dashboard/checkout-success-toast.tsx` uses `toastContainer.innerHTML = ...` with a static template string.
- **Risk:** Low (no user input); but it’s a pattern the repo’s own audit script flags and could be copied elsewhere with dynamic content.
- **Fix:** Prefer React (e.g. a small toast component) or `textContent`/DOM APIs for static content so the codebase stays “no innerHTML” and audit stays clean.

#### Low – Marketing site headers

- **Where:** Marketing site (Vite) is a separate deploy; headers are controlled by Vercel.
- **Fix:** In Vercel project for marketing, set same security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS, CSP) via Vercel config or `vercel.json` headers.

#### Low – Existing audit script not in CI

- **Where:** `scripts/audit.ts` scans for secret-like patterns and dangerous code (eval, dangerouslySetInnerHTML, innerHTML, etc.) but isn’t run in CI.
- **Fix:** Run it in CI and fail the job if it finds issues (or allowlist known safe cases and fail on new ones).

---

## 2. CI Pipeline – Security Checks

The following are integrated so every PR is checked and the app stays bank-grade secure.

### 2.1 Implemented in CI

- **Dependency audit** – `pnpm audit` (or `pnpm audit --audit-level=high` to fail only on high/critical). Surfaces known vulnerable dependencies.
- **Code/secret audit** – `pnpm audit` (root script that runs `scripts/audit.ts`). Catches potential secrets and dangerous patterns; keep allowlist minimal.

Both run on every PR; either can be configured to block merge (recommended: block on high/critical for `pnpm audit`, block on any finding for the code audit unless allowlisted).

### 2.2 Optional / Recommended Additions

- **Secret scanning in commits** – e.g. Gitleaks or TruffleHog in CI (free, open source). Prevents committing API keys or tokens.
- **SAST (static application security testing)** – e.g. CodeQL (free for public repos) or Semgrep (free tier). Catches common vulnerabilities (injection, XSS, auth bugs).
- **Header / config checks** – Lightweight script or OWASP ZAP/SecurityHeaders.com to assert HSTS, CSP, and other headers in staging/preview.

---

## 3. Recommended Tools (Free Tiers)

| Tool | Purpose | Free tier | CI use |
|------|--------|-----------|--------|
| **pnpm audit** | Dependency vulnerabilities | Built-in | ✅ In CI |
| **scripts/audit.ts** | Secrets + dangerous patterns | In-repo | ✅ In CI |
| **Gitleaks** | Secret scanning in repo/commits | OSS | Optional CI step |
| **TruffleHog** | Secrets in history and branches | Free | Optional CI step |
| **CodeQL** (GitHub) | SAST | Free (public repos) | Optional workflow |
| **Semgrep** | SAST, custom rules | Free tier | Optional CI step |
| **Snyk** | Deps + license + limited SAST | Free for OSS | Optional (Snyk CLI in CI) |
| **OWASP ZAP** | DAST (headers, basic vulns) | OSS | Manual or scheduled |
| **Vercel** | HTTPS, optional security headers | N/A | Enable HSTS/CSP in project |

### Suggested order of adoption

1. **Now:** CI runs `pnpm audit` and `pnpm audit` (audit script); block merge on high/critical deps and on audit failures.
2. **Next:** Add Gitleaks (or TruffleHog) to CI to block commits that introduce secrets.
3. **Then:** Add CodeQL or Semgrep for SAST; fix findings and keep as required checks.
4. **Ongoing:** Add HSTS/CSP (and marketing headers); optionally run OWASP ZAP or header checks against preview URLs.

---

## 4. Checklist – Bank-Grade Posture

- [ ] No secrets in client code, logs, or repo (env vars + server-only).
- [ ] All user/external input validated and sanitized; DB via parameterized queries/Supabase client; no raw eval or user-controlled innerHTML.
- [ ] Auth on every protected route/API; session/httpOnly/secure; no privilege escalation (checkout API fixed as above).
- [ ] Dependencies: `pnpm audit` in CI; lockfile and version pinning.
- [ ] Headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy; CORS/API exposure minimal.
- [ ] RLS on all public tables; cron and webhooks protected (CRON_SECRET, Polar signature).
- [ ] CI: dependency audit + code/secret audit; optional secret scanner + SAST.

---

## 5. References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [Vercel Security](https://vercel.com/docs/security)
