# PlotBudget V2 App Stage Gate Audit Results
*Scope: app.plotbudget.com only (marketing site excluded)*

---

## 1. CODEBASE SCAN

### Routes (app/)
| Path | File | Purpose |
|------|------|---------|
| `/` | `app/page.tsx` | Marketing/landing (hero, feature cards, no auth) |
| `/login` | `app/(auth)/login/page.tsx` | Login form |
| `/signup` | `app/(auth)/signup/page.tsx` | Signup form |
| `/reset-password` | `app/(auth)/reset-password/page.tsx` | Reset password request + set new password |
| `/onboarding` | `app/onboarding/page.tsx` | Solo/couple mode, income, pay cycle, household creation |
| `/dashboard` | `app/dashboard/page.tsx` | Dashboard (metrics, quick actions, charts) |
| `/dashboard/blueprint` | `app/dashboard/blueprint/page.tsx` | Blueprint (seeds, ritual mode, create next cycle) |
| `/auth/callback` | `app/auth/callback/route.ts` | Supabase auth callback |

**Missing routes:**
- `/settings` or `/dashboard/settings` — not present.
- Route group `(dashboard)` is not used; app uses `dashboard/` as path segment.

### Layouts
- `app/layout.tsx` — Root: fonts (Inter, JetBrains Mono, Space Mono), ThemeProvider, Toaster, skip link.
- `app/(auth)/layout.tsx` — Wraps login/signup/reset-password.
- `app/dashboard/layout.tsx` — Protected; header with PLOT logo + `DashboardNav` (Dashboard, Blueprint links only).
- `app/onboarding/layout.tsx` — Wraps onboarding page.

### Components (selected)
- **Auth:** `auth-form.tsx` (login/signup with Zod, Supabase, allowlist).
- **Dashboard:** `dashboard-nav.tsx`, `dashboard-client.tsx`, `hero-metrics.tsx`, `quick-actions.tsx`, `financial-health-card.tsx`, `category-donut-chart.tsx`, `savings-debt-progress.tsx`, `couple-contributions.tsx`, `upcoming-bills.tsx`, `recent-activity.tsx`, `spending-trends.tsx`.
- **Blueprint:** `blueprint-client.tsx`, `blueprint-header.tsx`, `category-summary-grid.tsx`, `total-allocated-summary.tsx`, `seeds-list.tsx`, `seed-card.tsx`, `seed-dialog.tsx`, `delete-seed-confirm-dialog.tsx`, `category-ratio-dialog.tsx`, `joint-account-summary.tsx`, `ritual-transfer-summary.tsx`, `ritual-completion-celebration.tsx`.
- **Onboarding:** `celebration-sequence.tsx`.
- **UI (shadcn-style):** `button`, `input`, `label`, `dialog`, `alert-dialog`, `dropdown-menu`, `select`, `radio-group`, `slider`, `switch`. **No `tabs` component.**
- **Providers:** `theme-provider.tsx`.
- **Misc:** `theme-toggle.tsx` (used only on root marketing page).

**Missing components:**
- `user-menu.tsx` (or equivalent) — no dropdown with user avatar, Settings, Logout in header.
- `settings/profile-tab.tsx` — no settings UI.
- No `components/settings/` directory.

### Server / shared actions
- `app/actions/auth.ts` — `checkEmailAllowed` (allowlist).
- `lib/actions/household-actions.ts` — household CRUD.
- `lib/actions/seed-actions.ts` — seeds, create next paycycle, resync draft.
- `lib/actions/pot-actions.ts` — pots.
- `lib/actions/repayment-actions.ts` — repayments.
- `lib/actions/ritual-actions.ts` — markSeedPaid, unmarkSeedPaid.

**Missing:** `lib/actions/account-actions.ts` (profile update, password change, export data, delete account).

### Middleware
- `middleware.ts` — Supabase session; protects `/dashboard/:path*` and `/onboarding/:path*`; redirects unauthenticated to `/login`; redirects completed onboarding away from `/onboarding`; redirects logged-in users from `/login` and `/signup` to `/dashboard`. **Does not protect `/`** (root is public). **No `/settings`** route to protect.

### RLS (docs/supabase-rls-policies.sql)
- Policies exist for: `households`, `paycycles`, `users`, `seeds`, `pots`, `repayments`.
- Users: read/update/insert own profile. No dedicated “account” or “profile” table beyond `public.users`.

### Design tokens (globals.css)
- **Light:** `--primary: 14 131 69` (rgb(14,131,69)). Spec calls for forest green `#10b981` (rgb(16,185,129)) — **mismatch**.
- **Dark:** `--primary: 105 240 174` (rgb(105,240,174)) — matches mint `#69f0ae`.
- Cards: `rounded-lg`, `card-plot` uses `p-6` / `p-8` (responsive). Buttons/inputs: `rounded-md`. Radius vars: `--radius-DEFAULT: 6px`, `--radius-md: 8px`.
- Fonts: `--font-inter`, `--font-jetbrains`, `--font-space`. Tailwind: `font-heading` → Space Mono, `font-display` → JetBrains Mono, `font-body` → Inter.

---

## 2. GAP ANALYSIS

### ✅ VERIFIED EXISTS
- Auth: sign up, log in, forgot password (link to `/reset-password`), reset-password page; allowlist; Zod validation on auth forms.
- Middleware: protects `/dashboard/*` and `/onboarding`; redirects by onboarding completion.
- Onboarding: Solo/couple, income validation (> 0), pay cycle type + pay day / anchor, joint ratio, household + first paycycle creation, celebration, redirect to Blueprint.
- Blueprint: category summaries, seed CRUD, joint ratio dialog, pots/repayments inline, “Create Next Cycle”, draft cycle, recurring clone; ritual mode (active cycle = ritual), transfer summary, checkboxes on seeds, progress bar, completion celebration.
- Dashboard: hero metrics (allocated, remaining, days left), quick actions (Blueprint, Create Next Cycle), financial health card, category donut, savings/debt progress, couple contributions, upcoming bills, recent activity, spending trends; empty state when no paycycle.
- RLS: households, paycycles, users, seeds, pots, repayments.
- Design: semantic colors, focus-visible rings, skip link, card/button radius usage; JetBrains Mono (display), Space Mono (heading), Inter (body).
- Theme: ThemeProvider; ThemeToggle component exists but is only on root marketing page.

### ❌ CONFIRMED MISSING
- **Settings:** No `/settings` or `/dashboard/settings` route; no settings page, no profile/account/security tabs.
- **User menu:** No header user menu (avatar, Settings link, Logout). Dashboard header has only logo + `DashboardNav` (Dashboard, Blueprint).
- **Logout:** No sign-out action or UI anywhere in the app.
- **Account actions:** No `lib/actions/account-actions.ts` (update profile, change password, export data, delete account).
- **Profile tab / settings components:** No `profile-tab.tsx` or other settings tabs.
- **shadcn Tabs:** No `tabs` component in `components/ui/` (needed for settings tabs).
- **Theme in dashboard:** Theme toggle not in dashboard/settings; only on root page.
- **Marketing CTAs:** Root page “GET EARLY ACCESS” and “LEARN MORE” are `<button>` with no `href` or navigation (no link to `/signup` or app flow).

### ❓ NEEDS VERIFICATION
- Root `/`: Audit checklist says “Unauthenticated users cannot access `/`”. Currently `/` is public (marketing). If app subdomain should treat `/` as “redirect to login when unauthenticated,” that behavior is not implemented.
- Email verification: “Receives email verification (if enabled)” — depends on Supabase config; not visible in code.
- Cross-domain: “Marketing site CTAs link to app.plotbudget.com/signup” — applies to marketing repo; app’s own root page CTAs do not link to `/signup`.
- CORS: No CORS logic in app code; assume same-origin or Vercel default.

---

## 3. PRIORITIZED TO-DO LIST

### 🔴 P0: BLOCKERS
1. **Settings feature** — Add settings page (e.g. `app/dashboard/settings/page.tsx`) with at least Profile tab (display name, avatar), plus Security (change password), Data export, and Delete account; use server actions in `lib/actions/account-actions.ts` with Zod; ensure RLS covers any new operations.
2. **User menu + Logout** — Add a user menu in the dashboard header (e.g. `components/navigation/user-menu.tsx` or extend header): avatar/email, link to Settings, and Logout that calls `supabase.auth.signOut()` and redirects to `/login`.
3. **Protect/redirect root (if required)** — If product requirement is “unauthenticated users cannot access `/`,” add middleware to redirect `/` to `/login` when no session; optionally redirect `/` to `/dashboard` when authenticated.
4. **Marketing CTAs on app root** — If app’s root page is the only “marketing” surface on app subdomain, wire “GET EARLY ACCESS” to `/signup` and “LEARN MORE” to an anchor or page so the journey is clear.

### 🟡 P1: IMPORTANT
5. **shadcn Tabs** — Add `components/ui/tabs.tsx` (or install from shadcn) for settings tabs and future tabbed UIs.
6. **Theme toggle in app** — Add ThemeToggle to dashboard header or to Settings so users can switch light/dark without visiting root.
7. **Primary color (light)** — Align light-mode primary with spec: change `--primary` from `14 131 69` to `16 185 129` (#10b981) in `globals.css` if design sign-off expects forest green.
8. **Middleware for `/settings`** — When settings route is added (e.g. `/dashboard/settings`), it is already under `dashboard/:path*`; if you add a top-level `/settings`, add it to middleware matcher and protect it like dashboard.

### 🟢 P2: NICE-TO-HAVE
9. **Route group (dashboard)** — Optionally rename to `app/(dashboard)/dashboard/...` and `app/(dashboard)/settings/...` for clarity; not required for functionality.
10. **Consistent card padding** — Normalize category summary cards and seed card wrapper to `p-6` where appropriate (see Design Consistency).
11. **Duration on transitions** — Standardize hover/transition to `transition-colors duration-200` where only `transition-colors` is used.

---

## 4. IMPLEMENTATION PROMPTS

### P0–1: Settings feature + User menu + account actions

Use the following as a single implementation prompt (or split by feature).

**Context:**  
The app has dashboard and blueprint under `app/dashboard/`, with layout that shows PLOT logo and `DashboardNav` (Dashboard, Blueprint). There is no settings page, no user menu, and no logout. `public.users` has `display_name`, `avatar_url`; Supabase Auth handles password. RLS already allows users to read/update their own `users` row.

**Goal:**  
1. Add a **Settings** page at `app/dashboard/settings/page.tsx` with tabs: Profile (display name, avatar upload), Security (change password), Data export (CSV download), Danger zone (delete account with “DELETE” confirmation).  
2. Add **User menu** in the dashboard header: trigger (avatar or email), dropdown with “Settings” link and “Log out” that calls `supabase.auth.signOut()` and redirects to `/login`.  
3. Implement **account server actions** in `lib/actions/account-actions.ts`: updateProfile (display name, avatar URL), changePassword, exportUserData, deleteAccount; all with Zod schemas and RLS-safe usage.

**Files to create**  
- `apps/web/app/dashboard/settings/page.tsx`  
- `apps/web/components/settings/profile-tab.tsx` (and optionally security-tab, export-tab, danger-tab or one settings client with tabs)  
- `apps/web/lib/actions/account-actions.ts`  
- If not present: `apps/web/components/ui/tabs.tsx` (shadcn Tabs)

**Files to update**  
- `apps/web/app/dashboard/layout.tsx` — In header, add user menu (and optionally ThemeToggle).  
- If user menu is a new component: `apps/web/components/navigation/user-menu.tsx` (create) and use it in layout.

**Requirements**  
- Use existing design tokens: primary green, `rounded-lg` cards, `rounded-md` buttons/inputs, font-heading/font-display/font-body.  
- Use shadcn-style components: Tabs, Card, Button, Input, Dialog (and AlertDialog for delete).  
- Validate all inputs with Zod. Use server actions for mutations.  
- Accessibility: focus indicators, ARIA for icon buttons, keyboard navigation.  
- Delete account: require user to type “DELETE”; then sign out and redirect to `/login` or marketing (e.g. `?deleted=true`).

**Security**  
- No new tables required; RLS on `users` already allows update by `auth.uid()`.  
- In deleteAccount, delete or anonymize user data per product rules, then call Supabase Auth admin or client sign-out.

**Testing checklist**  
- Settings page loads at `/dashboard/settings`.  
- All tabs render; forms validate; server actions work.  
- User menu opens; Settings navigates to settings; Log out signs out and redirects to login.  
- Mobile responsive; dark mode works.

---

### P0–2: Root redirect (if required)

**Context:**  
Middleware currently protects only `/dashboard/:path*` and `/onboarding/:path*`. Root `/` is always public (marketing page).

**Goal:**  
If the requirement is “unauthenticated users cannot access `/`,” then in middleware: when pathname is `/` and there is no session, redirect to `/login`; when pathname is `/` and there is a session, redirect to `/dashboard`.

**Files to update**  
- `apps/web/middleware.ts`: add branch for `request.nextUrl.pathname === '/'` and redirect as above.  
- Ensure matcher includes `'/'`.

---

### P0–3: Marketing CTAs on app root

**Context:**  
`app/page.tsx` has two buttons: “GET EARLY ACCESS” and “LEARN MORE” with no links.

**Goal:**  
“GET EARLY ACCESS” should navigate to `/signup` (e.g. `<Link href="/signup">` or `<Button asChild>`). “LEARN MORE” should scroll to a section or link to a path (e.g. `#why-plot` or `/learn`).

**Files to update**  
- `apps/web/app/page.tsx`: replace buttons with links or `Button asChild` + `Link`.

---

## 5. DESIGN CONSISTENCY AUDIT

### Typography
- **Headings:** Consistent use of `font-heading` (Space Mono) and sizes (`text-headline-sm`, `text-headline`, `text-xl`, etc.). Minor variance in `tracking-wider` vs `tracking-widest` — acceptable.
- **Body:** `font-body` and `text-muted-foreground` used consistently. Line height not explicitly set everywhere; prose areas could use a shared class.
- **Monospace:** JetBrains Mono via `font-display` for numbers/display; Space Mono via `font-heading`. Spec says “JetBrains Mono for monospace” — satisfied for display; headings use Space Mono by design.
- **Labels:** Mix of “UPPERCASE” and “Sentence case” in labels; form labels use Title Case in places. Consider standardizing (e.g. form labels Sentence case, section labels UPPERCASE).

### Colors
- **Primary green:** Light mode uses `14 131 69` instead of spec `#10b981` (16 185 129). Dark mode `105 240 174` matches `#69f0ae`.
- **Muted/borders:** `border-border`, `bg-muted`, `text-muted-foreground` used consistently.
- **Semantic:** `text-foreground`, `text-destructive`, `text-primary` used appropriately.

### Spacing
- **Cards:** Most use `p-6` and `rounded-lg` (e.g. hero-metrics, seeds-list, ritual-transfer-summary, financial-health-card, upcoming-bills, etc.).
- **Inconsistencies:**
  - **category-summary-grid.tsx** — Category cards use `p-4` instead of `p-6`.
  - **total-allocated-summary.tsx** — Uses `p-4`.
  - **seed-card.tsx** — Outer wrapper uses `p-4` (compact list item; could be intentional).
  - **ritual-completion-celebration.tsx** — Modal content uses `p-8`; inner boxes `p-4`.
- **Section gaps:** `space-y-4`, `space-y-6`, `space-y-8` used; no strict standard (e.g. section vs form spacing).

### Border radius
- **Cards:** `rounded-lg` used consistently (8px via `--radius-md` or Tailwind `lg`).
- **Buttons/inputs:** `rounded-md` (6px) in button, input, select, dialogs — consistent.
- **Modals/dialogs:** `rounded-lg` in dialog and alert-dialog — consistent.

### Animations
- **Hover:** Many components use `transition-colors`; few add `duration-200` explicitly (e.g. hero-metrics has `transition-colors`, theme-toggle has `transition-colors`). Buttons use `transition-colors` in shadcn variants.
- **Dialogs:** Radix-based; `duration-200` on content — fine.
- **Recommendation:** Add `duration-200` where only `transition-colors` is used for consistency.

### Summary of inconsistencies (with file locations)

- **Light primary not spec green** — `globals.css` uses `--primary: 14 131 69`; spec is `#10b981` (16 185 129).  
  → `apps/web/app/globals.css`

- **Category summary cards use p-4; most other cards use p-6**  
  → `apps/web/components/blueprint/category-summary-grid.tsx`

- **Total allocated summary uses p-4**  
  → `apps/web/components/blueprint/total-allocated-summary.tsx`

- **Seed card wrapper uses p-4** (list item; optional to keep for density)  
  → `apps/web/components/blueprint/seed-card.tsx`

- **Theme toggle only on root page; not in dashboard or settings**  
  → `apps/web/app/page.tsx` (only usage); dashboard layout has no ThemeToggle

- **No explicit transition duration** on some hover states (e.g. hero-metrics, theme-toggle)  
  → `apps/web/components/dashboard/hero-metrics.tsx`, `apps/web/components/theme-toggle.tsx`

---

## 6. TESTING CHECKLIST

### Cross-domain integration
- [ ] If marketing is separate repo: marketing CTAs link to `app.plotbudget.com/signup`.
- [ ] Signup flow works when coming from marketing (or from app root once CTAs are wired).
- [ ] Login redirects to dashboard (or intended redirect).
- [ ] Logout clears session and redirects to login (after user menu is added).
- [ ] No CORS errors between app and auth/callback.

### Authentication
- [ ] Sign up with email + password.
- [ ] Email verification (if enabled in Supabase).
- [ ] Log in with valid credentials.
- [ ] Log in rejected with invalid credentials.
- [ ] “Forgot password” from login goes to `/reset-password`; flow works.
- [ ] Log out (after user menu exists).
- [ ] Unauthenticated users cannot access `/dashboard`, `/dashboard/blueprint`, `/onboarding` (redirect to login).
- [ ] Root `/`: clarify requirement — currently public; add redirect checks if changed.

### Onboarding
- [ ] Solo vs Couple mode; partner fields show/hide correctly.
- [ ] Income validation (e.g. > 0).
- [ ] Pay cycle type and pay day / anchor; validation messages.
- [ ] Joint ratio slider and preview.
- [ ] Submit creates household + first paycycle; celebration; redirect to Blueprint.
- [ ] After completion, cannot access `/onboarding` again (redirect to dashboard/blueprint).

### Blueprint
- [ ] Empty state and CTAs.
- [ ] Add seed per category; split ratio for joint.
- [ ] Create pot/repayment inline.
- [ ] Seed cards display; edit/delete with confirmation.
- [ ] Category summaries and total allocated update.
- [ ] “Create Next Cycle” creates draft with correct dates; recurring seeds cloned.
- [ ] Ritual mode: toggle/active cycle shows transfer summary and checkboxes; progress bar; completion celebration; unmark paid.

### Ritual mode
- [ ] Active cycle shows ritual UI (transfer summary, checkboxes on seeds).
- [ ] Progress bar updates; completion triggers celebration.
- [ ] Can uncheck to mark unpaid.

### Dashboard
- [ ] Metrics (allocated, remaining, days left) correct.
- [ ] Burn rate / health score (if shown) correct.
- [ ] Donut and other charts render; responsive.
- [ ] Savings/debt progress; quick actions work.
- [ ] No paycycle: empty state and “Go to Blueprint”.

### Settings (after implementation)
- [ ] Update display name.
- [ ] Upload avatar (if implemented).
- [ ] Change password.
- [ ] Export data (CSV).
- [ ] Delete account: “DELETE” confirmation; redirect after delete.
- [ ] Theme toggle (if added to settings or header).

### Navigation
- [ ] Logo links to dashboard (not marketing).
- [ ] Active nav item highlighted (Dashboard, Blueprint).
- [ ] User menu opens; Settings and Log out work (after implementation).
- [ ] Mobile: nav and layout usable.

### Security (RLS)
- [ ] Cannot read/update other users’ profiles (e.g. via API or actions).
- [ ] Cannot modify other households’ seeds/pots/repayments.
- [ ] Middleware blocks unauthenticated access to protected routes.

---

## 7. CROSS-DOMAIN INTEGRATION

### Marketing → App
- `plotbudget.com/pricing` → `app.plotbudget.com/signup?plan=pro` (when pricing exists).
- `plotbudget.com` CTA → `app.plotbudget.com/signup`.
- `plotbudget.com/login` or “Sign in” → `app.plotbudget.com/login`.

### App → Marketing
- Logout → `app.plotbudget.com/login` (stay on app subdomain) — recommended.
- Delete account → redirect to `app.plotbudget.com/login?deleted=true` or `plotbudget.com?deleted=true` per product choice.
- Settings “Upgrade” / pricing CTA → `plotbudget.com/pricing` (if marketing hosts pricing).

### Vercel / DNS
- Marketing: e.g. `plotbudget.com` (if separate repo/project).
- App: `app.plotbudget.com` with root directory `apps/web`, env vars, and Supabase redirect URLs including `https://app.plotbudget.com/**` and `https://app.plotbudget.com/auth/callback`.

---

## 8. RECOMMENDATIONS

1. **Ship Settings + User menu + Logout first (P0).** Without them, users cannot change profile or sign out, which blocks a complete “Stage Gate” and support.
2. **Implement account-actions with Zod and existing RLS.** Reuse `public.users`; no new tables. For delete, define policy (anonymize vs hard delete) and use Supabase Auth admin if needed.
3. **Add Tabs component** before or with Settings so the page is tabbed and extensible (Security, Export, Danger zone).
4. **Fix root CTAs** so “GET EARLY ACCESS” goes to `/signup`; optionally implement root redirect in middleware only after product confirms desired behavior for `/` on app subdomain.
5. **Align light primary to #10b981** in `globals.css` if design spec is final; then run a quick visual pass.
6. **Put ThemeToggle in dashboard header or Settings** so authenticated users can switch theme without visiting the marketing root.
7. **Normalize card padding** (e.g. category summary and total allocated to `p-6`) in a small design pass after P0.
8. **Before Phase 6:** Run the full testing checklist against staging (app subdomain + Supabase staging); confirm RLS and middleware with a second test user; document redirect and cross-domain decisions in DEPLOYMENT.md or a short “App vs marketing” doc.
