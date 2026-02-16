# PLOT-93 Phase 2 plan: Write & Notify

**Parent:** [PLOT-93](https://linear.app/plot-app/issue/PLOT-93/build-the-mobile-app-version-for-android) — Build the mobile app version for Android  
**Date:** 2026-02-16

Phase 1 (Auth & Read) is complete; all Phase 0 and Phase 1 sub-issues are closed in Linear. This document defines Phase 2 scope. **Store activity is deferred to Phase 3.** Google-dependent work (e.g. Google OAuth) is also Phase 3.

---

## Phase 2 scope (Write, Notify, Polish only)

Phase 2 covers **writes** (mark seed/pot paid — already implemented), **notifications** (push, payday, partner activity), and **polish** (deep links, biometrics, PostHog). **Store** (icon, splash, EAS, listing, internal test, beta, production) is **Phase 3** so Phase 2 can proceed without waiting on store/Google verification.

### In scope for Phase 2

| Linear ID | Title | Theme | Status |
|-----------|--------|--------|--------|
| PLOT-124 | 16. Mark seed as paid (native) — mutation with optimistic update | Write | **Done** — implemented; uses web API, optimistic update + rollback. |
| PLOT-102 | 17. Mark pot as paid (native) — mutation with optimistic update | Write | **Done** — implemented; uses web API, optimistic update + rollback. |
| PLOT-113 | 18. Register push tokens and store in Supabase | Notify | Backlog |
| PLOT-112 | 19. Implement payday reminder push notifications | Notify | Backlog |
| PLOT-123 | 20. Implement partner activity notifications | Notify | Backlog |
| PLOT-117 | 21. Add deep linking for notifications and app routes | Polish | Backlog |
| PLOT-127 | 23. Add biometric authentication (fingerprint/face) | Polish | Backlog |
| PLOT-128 | 22. Integrate PostHog React Native SDK and match web events | Analytics | Backlog |

### Out of Phase 2 (optional / later)

| Linear ID | Title | Note |
|-----------|--------|------|
| PLOT-119 | 10. Add Apple Sign-In via Expo AuthSession | iOS; not in Android-first scope. Can be Phase 2+ or follow-on. |
| PLOT-103 | 07. Register Google Play Developer Account and create draft app | Administrative; in progress. Phase 3. |

---

## Phase 2b: Native Feel (Animations & Gestures)

**Deliverable:** The app feels "native" and tactile, not like a web wrapper.
**Exit criteria:** Gestures feel natural (1:1 tracking), transitions are seamless, complex graphics run at 60fps.

| Linear ID | Title | Theme | Status |
|-----------|-------|-------|--------|
| PLOT-131 | Implement **Physics-Based Gestures**: Swipe-to-action rows for transactions (Reanimated) | Animation | *Skipped — inline actions used* |
| PLOT-132 | Add **Draggable Bottom Sheets** for transaction details/editing | Animation | **Done** |
| PLOT-133 | Implement **Shared Element Transitions**: Budget cards expand into detail screens | Animation | **Done** (detail routes; transitions disabled for Expo Go) |
| PLOT-134 | Build **Interactive Skia Charts**: Donut chart with spin-to-select and haptics | Animation | **Phase 4** |
| PLOT-135 | Add **Micro-interactions**: Success confetti, tab bar morphs, liquid loaders | Animation | **Done** |

---

## Phase 4: Interactive Reporting (Charts)

| Linear ID | Title | Note |
|-----------|-------|------|
| PLOT-134 | Build **Interactive Skia Charts**: Donut chart with spin-to-select and haptics | Moved from Phase 2b. Reporting APIs, filterable charts, cycle comparison. |

---

## Phase 3 (Store + Google verification)

**Store activity** and work that **depends on Google verification** are Phase 3. Do not block Phase 2 on these.

| Linear ID | Title | Note |
|-----------|--------|------|
| PLOT-115 | 09. Add Google OAuth via Expo AuthSession | Blocked until Google verification. |
| PLOT-118 | 24. Design and add app icon and splash screen | Store |
| PLOT-129 | 25. Prepare Play Store listing assets | Store |
| PLOT-130 | 26. Complete Data Safety and Content Rating forms | Store |
| PLOT-120 | 27. Configure EAS production build profile and service account | Store |
| PLOT-109 | 28. Add CI job: EAS build on release/native branch | Store |
| PLOT-104 | 29. Submit to internal testing track with reviewer credentials | Store |
| PLOT-121 | 30. Host privacy policy on marketing site | Store |
| PLOT-106 | 31. Run closed beta and gather feedback from 5–10 couples | Store |
| PLOT-111 | 32. Address beta feedback and submit to production track | Store |

When Google verification and store readiness are needed, schedule Phase 3.

---

## Phase 0 & Phase 1 — closed in Linear

All of the following sub-issues are **Done** in Linear as of Phase 1 wrap-up:

**Phase 0 (Foundation):** PLOT-99 (ADR), PLOT-110 (audit logic), PLOT-100 (extract supabase), PLOT-125 (scaffold native), PLOT-101 (NativeWind + tokens), PLOT-126 (Turborepo).

**Phase 1 (Auth & Read):** PLOT-105 (email/password auth + in-app forgot-password), PLOT-108 (tab navigation), PLOT-114 (TanStack Query + MMKV), PLOT-116 (Dashboard), PLOT-122 (Pots/Blueprint), PLOT-107 (skeletons + error boundaries), PLOT-132 (mobile onboarding).

---

## Suggested Phase 2 ordering

1. **Write flows:** PLOT-124 and PLOT-102 are **done** (native uses web API; optimistic update + rollback).
2. **Notify:** PLOT-113 (push tokens), PLOT-112 (payday reminder), PLOT-123 (partner activity).
3. **Polish:** PLOT-117 (deep links), PLOT-127 (biometric), PLOT-128 (PostHog).
4. **Native Feel (Phase 2b):** PLOT-132 (sheets), PLOT-133 (transitions), PLOT-135 (micro-interactions). PLOT-131 (swipe) skipped; PLOT-134 (charts) moved to Phase 4.

**Phase 3 (Store):** When ready, do PLOT-103 (Play Developer Account), then PLOT-118, PLOT-129, PLOT-130, PLOT-120, PLOT-109, PLOT-104, PLOT-121, PLOT-106, PLOT-111.
