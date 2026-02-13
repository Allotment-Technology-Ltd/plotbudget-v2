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
| **Headers (app)** | ✅ | HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-XSS-Protection. |
| **RLS** | ✅ | RLS enabled on public tables (households, users, paycycles, seeds, pots, repayments, income_sources, subscriptions). |
| **Input (marketing)** | ✅ | Waitlist email validated server-side (format + server-only API key). |
| **Audit logging** | ✅ | `audit_events` table; server-side logging for login, logout, password change, account deletion, data export, partner lifecycle. See [PRIVACY-DATA-GOVERNANCE.md](./PRIVACY-DATA-GOVERNANCE.md). |
| **Rate limiting** | ✅ | Auth paths (`/login`, `/signup`, `/auth/callback`) rate-limited by IP when Upstash Redis is configured (optional env: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`). |
| **Open banking readiness** | ✅ | Standards and implementation notes in [OPEN-BANKING-READINESS.md](./OPEN-BANKING-READINESS.md). |
| **Dependencies** | ⚠️ | Lockfile present; `pnpm audit` in CI. |

### 1.2 Findings and Recommendations

#### High – Checkout API authorization (IDOR risk) — **Resolved**

- **Where:** `GET /api/checkout` accepted `household_id` and `user_id` from query params with no auth.
- **Fix applied:** Auth required; `household_id` and `user_id` are resolved server-side from the session (owner or partner household). Client params are ignored.

#### Medium – Security headers (HSTS & CSP) — **Resolved**

- **Fix applied:**  
  - **App:** `next.config.js` now sets `Strict-Transport-Security` (max-age=31536000; includeSubDomains; preload) and `Content-Security-Policy` (self, Supabase, PostHog, Polar, Vercel; frame-ancestors 'none').  
  - **Marketing:** `apps/marketing/vercel.json` sets the same HSTS and CSP plus X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.

#### Medium – innerHTML in one component — **Resolved**

- **Where:** `apps/web/components/dashboard/checkout-success-toast.tsx` used `toastContainer.innerHTML = ...`.
- **Fix applied:** Replaced with DOM `createElement` / `createElementNS` and `textContent` so the codebase stays “no innerHTML” and the audit passes.

#### Low – Marketing site headers — **Resolved**

- **Fix applied:** Security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) added in `apps/marketing/vercel.json`.

#### Low – Existing audit script not in CI

- **Where:** `scripts/audit.mjs` (run via `pnpm run audit`) scans for secret-like patterns and dangerous code (eval, dangerouslySetInnerHTML, innerHTML, etc.).
- **Fix applied:** Run in CI; job fails when dangerous patterns are found; potential secrets are reported only (no CI fail).

---

## 2. CI Pipeline – Security Checks

The following are integrated so every PR is checked and the app stays bank-grade secure.

### 2.1 Implemented in CI

- **Dependency audit** – `pnpm audit` (or `pnpm audit --audit-level=high` to fail only on high/critical). Surfaces known vulnerable dependencies.
- **Code/secret audit** – `pnpm run audit` (runs `scripts/audit.mjs`). Fails CI on dangerous patterns (eval, innerHTML, etc.); potential secrets are reported only.

Both run on every PR; either can be configured to block merge (recommended: block on high/critical for `pnpm audit`, block on any finding for the code audit unless allowlisted).

### 2.2 Optional / Recommended Additions

- **Secret scanning in commits** – e.g. Gitleaks or TruffleHog in CI (free, open source). Prevents committing API keys or tokens.
- **SAST (static application security testing)** – Semgrep (free tier). Catches common vulnerabilities (injection, XSS, auth bugs). CodeQL is not recommended for private repos (free tier is public-repo only).
- **Header / config checks** – Lightweight script or OWASP ZAP/SecurityHeaders.com to assert HSTS, CSP, and other headers in staging/preview.

### 2.3 Tool status and implementation plans

| Tool | Status | Where / notes |
|------|--------|----------------|
| **pnpm audit** | In place | `security` job in [.github/workflows/ci.yml](.github/workflows/ci.yml); fails on high/critical. |
| **scripts/audit.mjs** (`pnpm run audit`) | In place | Same `security` job; fails on dangerous patterns only. |
| **Gitleaks** | Not in place | See implementation plan below. |
| **TruffleHog** | Not in place | Alternative to Gitleaks; use one or the other. |
| **Semgrep** | Not in place | See implementation plan below. |
| **Snyk** | Not in place | Optional; see implementation plan below. |
| **OWASP ZAP / header checks** | Not in place | Optional; manual or scheduled; see implementation plan below. |

#### Implementation plans (tools not yet in CI)

**Gitleaks (secret scanning)**

- **Where:** Add a step to the existing `security` job in [.github/workflows/ci.yml](.github/workflows/ci.yml), or a dedicated job.
- **How:** Use the [gitleaks/gitleaks-action](https://github.com/gitleaks/gitleaks-action) GitHub Action, or install the Gitleaks binary and run it against the checkout (e.g. `gitleaks detect --no-git --verbose` or `gitleaks detect --source .`).
- **Failure policy:** Fail the job when any secret is detected.
- **Config:** Optionally add `.gitleaks.toml` at repo root to allowlist known false positives or exclude paths.

**TruffleHog (alternative secret scanning)**

- Use **either** Gitleaks **or** TruffleHog to avoid duplicate scanning. TruffleHog: use the official [trufflesecurity/trufflehog](https://github.com/trufflesecurity/trufflehog) GitHub Action or install the CLI and run against the repo; fail the job on secrets. Document in the workflow which tool is in use.

**Semgrep (SAST)**

- **Where:** Add a step to the `security` job (or a separate job) in [.github/workflows/ci.yml](.github/workflows/ci.yml).
- **How:** Use [returntocorp/semgrep-action](https://github.com/returntocorp/semgrep-action), or install with `pip install semgrep` and run `semgrep scan --config auto` (or a curated rule set such as `p/javascript`, `p/typescript`).
- **Failure policy:** Configure the step to fail on findings at or above a chosen severity (e.g. ERROR). Use `--error` to exit 1 on findings.
- **Config:** Add `.semgrepignore` at repo root to exclude test fixtures, generated code, or noisy rules.

**Snyk (optional: deps, license, SAST)**

- **Where:** Optional step in the `security` job or a dedicated job in [.github/workflows/ci.yml](.github/workflows/ci.yml).
- **How:** Install Snyk CLI (e.g. `npm install -g snyk` or use the [snyk/actions](https://github.com/snyk/actions) composite action); run `snyk test` for dependency vulns, optionally `snyk code test` for SAST.
- **Secrets:** Add `SNYK_TOKEN` to the repo’s GitHub Actions secrets (create token at [snyk.io](https://snyk.io)).
- **Note:** Overlaps with `pnpm audit` for dependencies; Snyk adds license checks and optional code analysis. Free tier applies; document token setup in team runbook.

**OWASP ZAP / header checks (optional)**

- **Option A – Lightweight header check:** Add a script in `scripts/` (e.g. `scripts/check-security-headers.sh`) that uses `curl` to request a given URL (e.g. preview URL from `VERCEL_URL` or a fixed staging URL) and checks response headers for `Strict-Transport-Security`, `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`. Run this script in CI only when a preview/staging URL is available (e.g. pass URL as env var from a previous step or workflow dispatch). Fail the job if required headers are missing.
- **Option B – OWASP ZAP:** Document running OWASP ZAP baseline (e.g. `zap-baseline.py`) as a **manual or scheduled** step (e.g. weekly) against the staging or preview URL. No change to PR CI unless you choose to run ZAP in CI when a preview URL exists; if so, use the [zaproxy/action-baseline](https://github.com/zaproxy/action-baseline) or similar and provide the deployment URL.

---

## 3. Recommended Tools (Free Tiers)

| Tool | Purpose | Free tier | CI use |
|------|--------|-----------|--------|
| **pnpm audit** | Dependency vulnerabilities | Built-in | ✅ In CI |
| **scripts/audit.mjs** (`pnpm run audit`) | Secrets + dangerous patterns | In-repo | ✅ In CI |
| **Gitleaks** | Secret scanning in repo/commits | OSS | Optional CI step |
| **TruffleHog** | Secrets in history and branches | Free | Optional CI step |
| **CodeQL** (GitHub) | SAST | Free (public repos only) | Skip for private repos |
| **Semgrep** | SAST, custom rules | Free tier | Optional CI step |
| **Snyk** | Deps + license + limited SAST | Free for OSS | Optional (Snyk CLI in CI) |
| **OWASP ZAP** | DAST (headers, basic vulns) | OSS | Manual or scheduled |
| **Vercel** | HTTPS, optional security headers | N/A | Enable HSTS/CSP in project |

### Suggested order of adoption

1. **Now:** CI runs `pnpm audit` and `pnpm run audit` (audit script); block merge on high/critical deps and on audit failures.
2. **Next:** Add Gitleaks (or TruffleHog) to CI to block commits that introduce secrets.
3. **Then:** Add Semgrep for SAST (CodeQL is for public repos only; skip for private repos); fix findings and keep as required checks.
4. **Ongoing:** HSTS/CSP and marketing headers are in place; optionally run OWASP ZAP or header checks against preview URLs (manual or scheduled).

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
