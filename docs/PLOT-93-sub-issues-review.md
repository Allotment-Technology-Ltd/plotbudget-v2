# PLOT-93 sub-issues review

**Parent:** [PLOT-93](https://linear.app/plot-app/issue/PLOT-93/build-the-mobile-app-version-for-android) — Build the mobile app version for Android  
**Branch:** `feature/PLOT-93/phase-1-auth-read`  
**Date:** 2026-02-16

## Summary

| Status   | Count |
|----------|-------|
| Done     | 6     |
| In Progress | 1  |
| Backlog  | 29    |

---

## Done (6)

| ID        | Title | Note |
|-----------|--------|------|
| PLOT-99   | 01. ADR: Mobile architecture decision (Expo + shared logic) | ADR at `docs/ADR-mobile-strategy.md`; Phase 0 & Phase 1 exit criteria defined. |
| PLOT-110  | 02. Audit packages/logic for web-only imports | No DOM/browser usage found; no refactors required. |
| PLOT-100  | 03. Extract packages/supabase from apps/web | Web consumes `@repo/supabase`; web build and E2E pass. |
| PLOT-125  | 04. Scaffold apps/native (Expo Router template) | Expo Router; placeholder "Hello PLOT"; runs on emulator. |
| PLOT-101  | 05. Add NativeWind and import design tokens | PLOT colours and spacing available in native. |
| PLOT-105  | 08. Implement Supabase email/password auth in Expo | Sign up, sign in, sign out; session persistence. In-app password reset added separately (forgot-password screen). |

---

## In progress (1)

| ID        | Title | Note |
|-----------|--------|------|
| PLOT-103  | 07. Register Google Play Developer Account and create draft app | Administrative; Play Console draft app. |

---

## Remaining (29) — by phase / theme

### Phase 1 (Auth & Read) — still to do

| ID        | Title | Note |
|-----------|--------|------|
| PLOT-126  | 06. Configure Turborepo for native workspace | `turbo build` / `turbo lint` including `apps/native`. |
| PLOT-115  | 09. Add Google OAuth via Expo AuthSession | Blocked until Google verification; not required for Phase 1 exit. |
| PLOT-119  | 10. Add Apple Sign-In via Expo AuthSession | iOS; not in Phase 1 Android scope. |
| PLOT-114  | 11. Setup TanStack Query with MMKV persistence | Caching and persistence for read screens. |
| PLOT-116  | 12. Build Dashboard screen (read-only) | Pay cycle summary, totals, days remaining. |
| PLOT-122  | 13. Build Pots list screen (read-only) | Pots list with status, amounts, progress. |
| PLOT-107  | 14. Add skeleton loading states and error boundaries | Skeletons on fetch; error screen on failure. |
| PLOT-108  | 15. Add tab navigation (Dashboard, Pots, Settings) | Bottom tabs; state persists. |
| PLOT-132  | Mobile onboarding: allow users to onboard via the app | Household mode, names, currency, income, pay cycle, joint split; create household + first pay cycle. |

### Phase 2 (Write & Notify) and later

| ID        | Title | Note |
|-----------|--------|------|
| PLOT-124  | 16. Mark seed as paid (native) — mutation with optimistic update | Write flow. |
| PLOT-102  | 17. Mark pot as paid (native) — mutation with optimistic update | Write flow. |
| PLOT-113  | 18. Register push tokens and store in Supabase | Notifications. |
| PLOT-112  | 19. Implement payday reminder push notifications | Notifications. |
| PLOT-123  | 20. Implement partner activity notifications | Notifications. |
| PLOT-117  | 21. Add deep linking for notifications and app routes | Polish. |
| PLOT-118  | 24. Design and add app icon and splash screen | Store. |
| PLOT-127  | 23. Add biometric authentication (fingerprint/face) | Polish. |
| PLOT-128  | 22. Integrate PostHog React Native SDK and match web events | Analytics. |
| PLOT-129  | 25. Prepare Play Store listing assets | Store. |
| PLOT-130  | 26. Complete Data Safety and Content Rating forms | Store. |
| PLOT-120  | 27. Configure EAS production build profile and service account | CI/Store. |
| PLOT-109  | 28. Add CI job: EAS build on release/native branch | CI. |
| PLOT-104  | 29. Submit to internal testing track with reviewer credentials | Store. |
| PLOT-121  | 30. Host privacy policy on marketing site | Store. |
| PLOT-106  | 31. Run closed beta and gather feedback from 5–10 couples | Beta. |
| PLOT-111  | 32. Address beta feedback and submit to production track | Store. |

---

## Phase 1 exit criteria vs sub-issues

Phase 1 exit criteria (see `docs/ADR-mobile-strategy.md`) map roughly as follows:

- **Auth:** PLOT-105 ✅ (+ in-app forgot-password implemented).
- **Password reset:** Implemented in-app (forgot-password screen; link from login).
- **Onboarding:** PLOT-132 (remaining).
- **Read-only screens:** PLOT-116 (Dashboard), PLOT-122 (Pots), Settings (implemented in branch); Blueprint/Dashboard alignment to be confirmed.
- **Navigation:** PLOT-108 (tabs) — remaining.
- **Theme:** Implemented in branch (theme persist).
- **Quality:** PLOT-107 (skeletons/error boundaries), PLOT-126 (Turbo) — remaining.

To fully meet Phase 1 exit criteria, complete: **PLOT-126**, **PLOT-108**, **PLOT-114**, **PLOT-116**, **PLOT-122**, **PLOT-107**, and **PLOT-132**.
