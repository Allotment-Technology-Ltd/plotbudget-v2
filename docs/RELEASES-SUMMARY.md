# Release history and contents

Summary of all releases from repo `CHANGELOG.md`. Use this when updating the **public-facing changelog** at `apps/marketing/src/data/publicChangelog.js` (plotbudget.com/changelog). The repo `CHANGELOG.md` remains the source of truth for developers and semantic-release.

---

## 1.5.4 (2026-02-20)

- **Bug fixes:** CI — pin pnpm/action-setup to 8.15.4 to match packageManager

---

## 1.5.3 (2026-02-20)

- **Bug fixes:** CI — use packageManager from package.json for pnpm version

---

## 1.5.2 (2026-02-20)

- **Bug fixes:** CI — sanity-studio install use npm ci when lockfile present else npm install

---

## 1.5.1 (2026-02-20)

- **Bug fixes:** CI — use npm install for sanity-studio in Release workflow

---

## 1.5.0 (2026-02-18)

- **Features:** Payoff chart month/year labels, dashboard cards, action persistence (#74)

---

## 1.4.0 (2026-02-16)

- **Features:** Phase 2b Native Feel (in development) — bottom sheets, micro-interactions, more native experience for future mobile app (#65)

---

## 1.3.0 (2026-02-15)

- **Features:** Marketing CTAs, first 50 free, founding-spots API (PLOT-86, #58)

---

## 1.2.0 (2026-02-15)

- **Features:** UI — update defaults and casing for PLOT-88, PLOT-89, PLOT-90 (#57)

---

## 1.1.1 (2026-02-15)

- **Bug fixes:** Security — pin 3rd party GitHub Actions; fix file inclusion; update Resend 6.9.1 → 6.9.2 (#52, #53, #54)

---

## 1.1.0 (2026-02-15)

- **Features:** Founding member status moved to household (co-enforcement) (#51)

---

## 1.0.1 (2026-02-15)

- **Bug fixes:** Profile-tab partner name, E2E logout/visual, Linear branch rule

---

## 1.0.0 (2026-02-14)

- **Launch:** Major release — PLOT 1.0.0
- **Breaking:** Major release
- **Features / fixes:** Dashboard, onboarding, blueprint, settings, cookie consent, PostHog; checkout/webhooks, subscription tab, pay cycle and trial utils; founding member messaging and period (12→6 months), currency support (GBP/USD/EUR), partner invite flow, E2E and visual test updates, subscriptions metadata, marketing privacy/terms

---

## 0.6.0 (2026-02-14)

- **Features:** UX quirks, visual test tolerance, subscriptions (#46)

---

## 0.5.0 (2026-02-14)

- **Bug fixes:** E2E CI stability (cookie consent, auth/visual tolerance); web prebuild for Next.js 16
- **Features:** Auth — OAuth profile sync, avatar from OAuth, initials fallback

---

## 0.4.1 (2026-02-13)

- **Bug fixes:** Web — remove middleware.ts, use proxy only for Next.js 16 (#42)

---

## 0.4.0 (2026-02-13)

- **Bug fixes:** CI — repair orphaned migration versions before prod db push
- **Features:** Payment three-state flagging and dev toggle (#33)

---

## 0.3.0 (2026-02-09)

- **Bug fixes:** ESLint, turbo.json globalEnv, sharp for Vercel, Vercel CLI, blueprint/dashboard UX, build/deploy fixes, E2E stability, Settings/Privacy layout, auth form split, Supabase types, partner flow, and many CI/Vercel/E2E fixes
- **Features:** Marketing site in monorepo, Playwright E2E, auth/signup gating and Google login flags, budget cycle + income sources, partner invitation and email, production infrastructure and public signup, subscription pricing and founding member, Zero-Ops pipeline, shared design system and privacy/terms

---

## 0.2.0 and earlier

See root `CHANGELOG.md` for full conventional-changelog detail and commit links.
