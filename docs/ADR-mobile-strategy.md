# ADR: Mobile architecture decision (Expo + shared logic)

Date: 2026-02-15

Status: Proposed

Context
-------
- PLOT is a Next.js 16 + Supabase web app in a Turborepo monorepo. The product team has identified mobile as critical for growth but there is no existing native app.
- The web app uses shadcn/ui (Radix), Tailwind, Framer Motion, and server-first patterns (RSC, Server Actions). Shared logic lives in `packages/logic` and design tokens in `packages/design-tokens`.

Decision
--------
Adopt an Expo-native mobile app that shares business logic, types, and API clients via new/existing shared packages (e.g. `packages/supabase`, `packages/logic`, `packages/design-tokens`). Build platform-specific UI for native (React Native components + NativeWind). Keep the existing Next.js web app unchanged.

Rationale
---------
- Minimise risk and disruption to the working web product; preserve Next.js server components, server actions, and Vercel-hosted API routes.
- Maximise developer velocity: Expo + NativeWind leverages current TypeScript and Tailwind knowledge.
- Share what is safe to share: Zod schemas, Zustand stores, Supabase client factory, generated types, date logic. Do not attempt one-to-one UI reuse (avoid Solito/React Native Web for this repo).
- Start small and iterative: scaffold `apps/native` and progressively implement core read flows, then write flows, then polish and app-store release.

Alternatives Considered
-----------------------
- Solito + React Native Web: rejected. Solito promises UI unification but current web UI relies on Radix + Framer Motion which do not map to RN primitives. Migration cost is high and would create hidden complexity and duplicated effort.
- Local-first (PowerSync / ElectricSQL): rejected for initial delivery. PLOT's usage patterns (monthly payday ritual, collaborative household data) favour server-centric consistency; local-first introduces schema duplication and complex conflict resolution. Re-evaluate if extended offline-first requirements emerge.
- Capacitor (webview wrapper): viable as a short-term MVP but not \"best in class\"; retains web limitations and will likely deliver inferior UX.

Consequences
------------
- Will require additional platform-specific UI work for native screens (no direct UI re-use).
- Shared packages must be audited for DOM/browser-only globals and adapted for React Native when necessary.
- CI and Turborepo configuration will need updates to build and lint the native workspace.
- Subscriptions remain handled via Polar.sh on the web; native app reads subscription status from Supabase to avoid Play billing complications.

Exit Criteria for Phase 0 (Foundation)
--------------------------------------
1. ADR merged and reviewed.
2. `packages/logic` contains no direct DOM/browser globals or has platform-safe abstractions.
3. `packages/supabase` extracted and consumed by web app without regressions.
4. `apps/native` scaffolded (Expo Router) and boots to a placeholder screen on emulator.
5. `turbo build` and `turbo lint` succeed across workspaces including `apps/native`.

Exit Criteria for Phase 1 (Auth & Read)
---------------------------------------
1. **Auth:** Users can sign up, sign in, and sign out with email/password in the native app. Session persists across app restarts.
2. **Password reset:** "Forgot password?" is available from the login screen; requesting a reset sends an email; the user completes the reset via the link (web or in-app) and can then sign in with the new password.
3. **Onboarding:** New users can complete onboarding in the app (household mode, names, currency, income, pay cycle, joint split for couples) so that household and first pay cycle exist without using the web app.
4. **Read-only core screens:** Dashboard (pay cycle summary, totals, days remaining), Blueprint/Pots list, and Settings are implemented and show data consistent with the web app for the same user.
5. **Navigation:** Tab navigation (e.g. Dashboard, Pots, Settings) is in place and state persists across restarts.
6. **Theme:** User theme (light/dark) is respected and persists.
7. **Quality:** Skeleton loading and error boundaries are in place for data loads; no Phase 0 regressions (`turbo build`, `turbo lint` pass).

Owners
------
- Product/Engineering: Adam Boon
- Mobile lead: (assign later)

Go-live scope (Android first)
------------------------------
- **Initial mobile release:** Android only. iOS development and App Store admin are treated as separate, follow-on work.
- **OAuth:** Step 09 (OAuth in Expo) is blocked until Google verification is complete. Apple OAuth is not yet implemented on web; do not gate Android work on it.
- **When implementing Android:** Keep iOS in mind (e.g. avoid Android-only APIs where a cross-platform approach is trivial; document iOS follow-up where relevant). Do not prioritise iOS-specific features, store config, or Apple Sign-In for current go-live.

Notes
-----
This ADR recommends an iterative, low-risk migration path: phase-based work (Foundation → Auth & Read → Write & Notify → Polish & Store). Revisit local-first or Solito only if product requirements change to justify their complexity.

