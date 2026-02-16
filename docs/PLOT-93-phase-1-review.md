# PLOT-93 Phase 1 review: branch vs exit criteria

**Branch:** `feature/PLOT-93/phase-1-auth-read`  
**Date:** 2026-02-16

This document compares the Phase 1 exit criteria (ADR) and Phase 1 sub-issues against what is **implemented on this branch**, then lists what is left to do.

---

## Phase 1 exit criteria (ADR) — status

| # | Criterion | Status | Evidence in branch |
|---|-----------|--------|---------------------|
| 1 | **Auth:** Sign up, sign in, sign out with email/password; session persists | ✅ Done | `(auth)/login.tsx`, `(auth)/sign-up.tsx`, `AuthContext` + Supabase; session in AsyncStorage |
| 2 | **Password reset:** "Forgot password?" from login; request sends email; user completes via link | ✅ Done | `(auth)/forgot-password.tsx`, link on login; `resetPasswordForEmail` → web `/auth/callback` |
| 3 | **Onboarding:** New users can complete onboarding in-app (household, names, currency, income, pay cycle, joint split); household + first pay cycle created | ✅ Done | `(onboarding)/index.tsx` — full form, creates household + paycycle, updates user `has_completed_onboarding`; `OnboardingStatusContext` + AuthGate redirect |
| 4 | **Read-only core screens:** Dashboard, Blueprint/Pots, Settings implemented and data consistent with web | ✅ Done | `(tabs)/index.tsx` (Dashboard), `(tabs)/two.tsx` (Blueprint), `(tabs)/settings.tsx`; `fetchDashboardData`, `fetchBlueprintData`; same logic/types as web |
| 5 | **Navigation:** Tab navigation (Dashboard, Pots, Settings); state persists across restarts | ✅ Done | `(tabs)/_layout.tsx` — Dashboard, Blueprint, Settings; `navigation-persistence.ts` persists path in AsyncStorage and restores on launch |
| 6 | **Theme:** User theme (light/dark) respected and persists | ✅ Done | `ThemePreferenceContext` (AsyncStorage), `ThemeProvider(resolvedScheme)` in root layout; Settings Appearance segment |
| 7 | **Quality:** Skeleton loading and error boundaries; no Phase 0 regressions (`turbo build`, `turbo lint` pass) | ⚠️ Lint done; build TBD | Skeletons and error boundaries in place. `turbo lint` passes (native lint errors fixed). Confirm `turbo build` from repo root passes including native (PLOT-126). |

**Summary:** Criteria 1–6 are **met** on this branch. Criterion 7 is met for skeletons/error boundaries; the only open item is verifying (and if needed fixing) Turborepo so Phase 0 remains green.

---

## Phase 1 sub-issues (Linear) — implementation status

| Linear ID | Title | Implemented on branch? | Note |
|-----------|--------|-------------------------|------|
| PLOT-99 | 01. ADR | ✅ | ADR + Phase 1 exit criteria in repo |
| PLOT-110 | 02. Audit packages/logic | ✅ | No DOM usage; audit done |
| PLOT-100 | 03. Extract packages/supabase | ✅ | Web uses @repo/supabase |
| PLOT-125 | 04. Scaffold apps/native | ✅ | Expo Router, runs on emulator |
| PLOT-101 | 05. NativeWind + design tokens | ✅ | Themed UI, design tokens |
| PLOT-105 | 08. Supabase email/password auth | ✅ | + forgot-password in-app |
| **PLOT-126** | **06. Configure Turborepo for native** | ⚠️ Unverified | Native has `build` (expo export web) and `lint`; need to confirm root `pnpm build` / `pnpm lint` include native and pass |
| PLOT-108 | 15. Tab navigation (Dashboard, Pots, Settings) | ✅ | Tabs + navigation persistence |
| PLOT-114 | 11. TanStack Query with MMKV persistence | ✅ | `query-client.ts` uses MMKV persister when available; `QueryProvider` in root |
| PLOT-116 | 12. Dashboard screen (read-only) | ✅ | Full dashboard with metrics, health score, seeds/pots; skeletons + error screen |
| PLOT-122 | 13. Pots list screen (read-only) | ✅ | Blueprint screen with seeds/pots; skeletons + error screen (also has write: mark paid) |
| PLOT-107 | 14. Skeleton loading + error boundaries | ✅ | DashboardSkeleton, BlueprintSkeleton, ErrorScreen, AppErrorBoundary |
| PLOT-132 | Mobile onboarding | ✅ | Full onboarding flow; creates household + first pay cycle |

OAuth (PLOT-115, PLOT-119) is out of Phase 1 scope per ADR (blocked / iOS later).

---

## What is left to do to finish Phase 1

### 1. **Native app lint (fixed)**

`turbo lint` includes `@repo/native`. The native app lint errors have been fixed in this branch (unescaped entities, unused vars, exhaustive-deps). **Action:** None — `pnpm run lint` from repo root now passes for native.

### 2. **Confirm Turborepo build (PLOT-126)**

- **Action:** From repo root run `pnpm run build`. Confirm it completes and that `apps/native` build (e.g. `expo export --platform web`) runs if/when in scope.
- **Note:** Lint is already wired; the only blocker observed is the native lint errors above.

### 3. **Optional polish (no new scope)**

- **Smoke test:** Sign up → onboarding → Dashboard / Blueprint / Settings; toggle theme; restart app and confirm tab + theme persist; use “Forgot password?” and complete reset on web then sign in on app.
- **Docs:** If you track “Phase 1 complete” in Linear, move PLOT-108, PLOT-114, PLOT-116, PLOT-122, PLOT-107, PLOT-132 to Done once the above is verified; do the same for PLOT-126 after Turborepo is confirmed.

---

## Conclusion

Phase 1 **feature work** is complete on this branch: auth, password reset, onboarding, Dashboard, Blueprint, Settings, tab navigation with persistence, theme with persistence, TanStack Query with MMKV, and skeletons/error boundaries are all implemented. Native lint errors have been fixed; `turbo lint` passes. To **formally** close Phase 1, **confirm** that `turbo build` passes from repo root (including native). After that, Phase 1 exit criterion 7 (“no Phase 0 regressions”) is satisfied.
