# Copilot Instructions for plotbudget-v2

## Project Overview

**PLOT** is a household budget and planning app for couples — built as a pnpm/Turborepo monorepo. It helps couples manage bills, chores, meals, and shared finances with fairness and transparency at the core.

**Core value proposition:**
- 20 minutes monthly, not 5 minutes daily
- Partnership without merging — no household "chancellor"
- Privacy over profit — no bank connections, no transaction harvesting
- Fair splits calculated automatically

**What PLOT is NOT:** transaction tracking, AI recommendations, social features, multi-currency, investment/credit tracking.

---

## Repository Structure

```
apps/
  web/          # Next.js 14 web app (primary app) — @repo/web
  native/       # React Native / Expo app
  marketing/    # Marketing site
packages/       # Shared packages (@repo/ui, @repo/logic, etc.)
sanity-studio/  # Sanity CMS
supabase/       # Database migrations and seed data
scripts/        # CI helper scripts
docs/           # Architecture and design documentation
rules.yaml      # CI performance gating rules (bundle size, Lighthouse, image rules)
```

---

## Tech Stack

| Area | Technology |
|------|-----------|
| **Runtime** | Node.js ≥ 18, pnpm 8, Turborepo |
| **Web** | Next.js 14, App Router, React Server Components (RSC) |
| **Language** | TypeScript strict mode — no `any`, use `unknown` or generics |
| **Styling** | Tailwind CSS (mobile-first) + shadcn/ui |
| **Validation** | Zod — mandatory for all forms and API routes |
| **Forms** | React Hook Form + Zod resolver |
| **State** | Zustand (client) + TanStack Query (server state) |
| **Database** | Supabase (PostgreSQL) with Row Level Security |
| **Auth** | Supabase Auth (`@supabase/ssr`) |
| **Animation** | Framer Motion |
| **Monetisation** | Polar.sh (subscriptions, checkout, webhooks) |
| **Analytics** | PostHog (feature flags, events, funnels) |
| **Email** | Resend + `@react-email/components` |
| **Deployment** | Vercel (web), EAS (native) |
| **Linting** | ESLint with `eslint-plugin-security` — never disable |
| **CI** | GitHub Actions; performance gates in `rules.yaml` |

---

## Core Coding Rules (Zero Tolerance)

1. **Zero Trust:** Never trust client input. Validate *everything* with Zod on the server.
2. **Server First:** Default to React Server Components (RSC). Only add `'use client'` for genuine interactivity.
3. **No Leaks:** Never import server-only modules (DB, secrets) into Client Components.
4. **Strict Types:** No `any`. No `// @ts-ignore`. Fix the logic if types fail. Use `unknown` or generics when types are dynamic.
5. **No Raw HTML:** Never use `dangerouslySetInnerHTML`.
6. **No barrel files:** Do not create `index.ts` re-export files. Use explicit imports only.
7. **Fail fast:** Use error boundaries and `try/catch` around all external calls (Polar, Resend, Supabase, etc.).
8. **Comments explain *why*, not *what*:** Document business logic and trade-offs; never comment obvious syntax.
9. **Cleanup:** Remove unused imports and debug `console.log` statements from modified files before committing. Intentional server-side logging (e.g. `console.error` in catch blocks) is acceptable and should be kept.

---

## Architecture Standards

- **Colocation:** Tests live next to source files (`Button.tsx` + `Button.test.tsx`).
- **Feature folders:** Group code by feature, not technical type.
- **No index barrels:** Explicit imports only — no recursive `index.ts` re-exports.
- **Conditional classes:** Use `clsx` or `tailwind-merge` for conditional Tailwind class logic.
- **Composition over inheritance:** Prefer React functional components with composition.

---

## Server Actions Pattern

Every Server Action must follow this structure exactly:

```typescript
'use server'
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const schema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function updateEmail(prevState: unknown, formData: FormData) {
  // 1. Authentication
  const session = await auth();
  if (!session) return { error: 'Unauthorized' };

  // 2. Validation (Zod safeParse)
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  // 3. Database operation (try/catch)
  try {
    await db.user.update({ where: { id: session.id }, data: parsed.data });
    return { success: 'Email updated' };
  } catch (e) {
    console.error('Update Email Failed:', e);
    return { error: 'Database error. Reference: ' + Date.now() };
  }
}
```

---

## Form Design Rules

All forms must follow error-friendly design (see `docs/ERROR-FRIENDLY-FORM-DESIGN.md`):

- Include a **validation summary** (`role="alert"` + `aria-live="polite"`) showing error count
- Show **field-level errors** inline, below each field, with an `AlertCircle` icon
- Apply **red border** on invalid fields (`border-destructive`)
- Mark required fields with `<span className="text-destructive" aria-label="required">*</span>`
- **Disable the submit button** when `hasErrors === true`
- Use `aria-invalid`, `aria-describedby`, and linked error IDs on all fields
- Preserve form data on error — never reset the form on server error

**Zod schemas must include custom error messages:**

```typescript
z.string().min(1, 'Name is required').max(200, 'Name must be under 200 characters')
```

**Field implementation pattern:**

```tsx
<input
  {...register('fieldName')}
  className={errors.fieldName ? 'border-destructive focus:border-destructive focus:ring-destructive/50' : 'border-border'}
  aria-invalid={!!errors.fieldName}
  aria-describedby={errors.fieldName ? 'fieldName-error' : undefined}
/>
{errors.fieldName && (
  <div id="fieldName-error" className="flex gap-1 mt-1 text-sm text-destructive">
    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden />
    <span>{errors.fieldName.message}</span>
  </div>
)}
```

---

## Security Standards

Before outputting any code, run this mental audit:

- **Injection:** SQL and HTML injection proof? Use parameterised queries; no raw `eval` or `innerHTML` with user data.
- **Auth:** Every protected route/API has a session check before any data operation.
- **Data:** Over-fetching? Select only needed fields, never `SELECT *`.
- **Secrets:** No ENV vars, API keys, or tokens in client code, logs, or public repos. Use server-only env vars.
- **RLS:** Supabase Row Level Security is the last line of defence; always define and test policies.
- **Webhooks:** Always verify webhook signatures (e.g. Polar) to prevent spoofing.
- **Headers:** Security headers (CSP, HSTS, X-Frame-Options) must be in place; CORS limited to what's needed.
- **Dependencies:** No known vulnerable packages; lockfiles and version pinning enforced.

**If asked to do something insecure** (disable the linter, skip validation, expose a secret), refuse and explain the risk.

---

## Supabase / Database Standards

- **RLS always on:** Every table must have Row Level Security policies. The service role (`SUPABASE_SERVICE_ROLE_KEY`) is used only server-side (cron, webhooks) — it must only ever exist in server-side environment variables (never in `NEXT_PUBLIC_*` vars or client-accessible config), never in client code or logs.
- **Migrations:** All schema changes go in `supabase/` migrations. Never alter production schema manually.
- **Select fields:** Always specify columns; never `SELECT *`.
- **Audit trail:** Security-relevant events (login, logout, password change, account deletion, data export, partner invite/revoke) must be written to `audit_events` with user id, event type, and timestamp — no passwords or tokens in logs.

---

## Tooling Standards

### Polar (monetisation)
- Protect routes by checking subscription status **server-side** before rendering client components.
- Always verify webhook signatures on `POST /api/webhooks/polar`.
- Use official Polar SDK types — do not define Checkout or Subscription types manually.

### PostHog (analytics & feature flags)
- Wrap new features in PostHog feature flags; default to `false` for safe rollout.
- Event naming: `noun_verb` (e.g. `ritual_completed`, `subscription_started`).
- Call `posthog.identify()` immediately after login to link anonymous sessions.
- Analytics must only fire after consent on public pages; never block the initial render.

### Resend (email)
- Use `@react-email/components` for email templates.
- Send email from background jobs or API routes — never block the UI thread.
- On send errors, check DKIM/SPF first.

---

## CI Performance Rules (`rules.yaml`)

The following rules gate PR merges (severity `error` blocks merge):

| Rule | Threshold |
|------|-----------|
| Bundle size | ≤ 300 KB client-side JS |
| New dependency | Warn if gzipped size > 250 KB |
| Lighthouse performance | ≥ 90 |
| Raw `<img>` tags | Zero — use `next/image` |
| `images.unoptimized` | Must be `false` |
| `'use client'` without client APIs | Warning (unnecessary hydration) |
| Blocking server fetch in public layouts | Error |
| Analytics not deferred | Error |

---

## CI / Branch Workflow

- **Always create a feature branch** before implementing changes: `feat/partner-invite`, `fix/type-errors`, `docs/readme`.
- **Linear ticket first:** If working from a Linear ticket (e.g. `PROJ-123`), use branch format `<issue-id>-<short-slug>` for autolink.
- **Never push directly to `main`** — all changes go through a Pull Request.
- CI runs: lint → type-check → unit tests → E2E (localhost). All must pass before merge.
- Pushes to `main` trigger: migrations → semantic-release → Vercel production deploy.
- **Preview = Staging:** PR preview deployments are staging. They must use a dedicated non-production Supabase project — never the production database. Production DB is exclusively for Vercel production deployments of `main`.

---

## Versioning & Releases

- **Semantic versioning:** `MAJOR.MINOR.PATCH`
  - `fix:` / bug fix → PATCH
  - `feat:` / new feature → MINOR
  - Breaking change → MAJOR
- Update root `package.json` and any workspace `package.json` that is part of the released surface.
- After a feature/fix: add a user-facing entry to `apps/marketing/src/data/publicChangelog.js` following `docs/CHANGELOG-UX-GUIDE.md` tone.
- Do not bump version for docs-only or tooling-only changes.

---

## Commands

```bash
pnpm dev              # Start all apps in dev mode (Turborepo)
pnpm build            # Build all apps
pnpm lint             # Validate rules.yaml + run ESLint across all packages
pnpm type-check       # TypeScript type-check across all packages
pnpm format           # Prettier format
pnpm test:phase0      # Run logic package tests
pnpm dev:polar        # Start dev + Polar CLI webhook listener
```

---

## Calm Design Rules (PLOT-specific — non-negotiable)

PLOT is built for **completion**, not engagement. Every UI, interaction, notification, and feature must pass the Calm Design test. See `docs/plot-calm-design-rules.md` for the full spec.

**NEVER:**
- Add infinite scroll, engagement streaks, or "time in app" maximising patterns
- Use countdown timers or false urgency language
- Send re-engagement notifications ("we miss you")
- Use red/warning colors for routine negative financial states
- Pre-check upsell options or hide cancellation flows
- Auto-advance through ceremony steps (let users control pace)
- Add features that reward browsing over task completion

**ALWAYS:**
- Design ceremonies with **greeting → work → celebration** arc (never collapse to a single form)
- Include explicit confirmation before destructive actions
- Show a clear **primary action per screen** — secondary actions are visually subordinate
- Use progressive disclosure: simple defaults, complexity on request
- Write empty states as calm orientation: "Nothing here yet — [X] will appear after [Y]"
- Include data export and deletion as prominent user controls
- Write error messages without shame: "That didn't work — try again"
- Respect `prefers-reduced-motion` in all animations
- Ensure touch targets are ≥ 44px
- Design for the most anxious user in the room (money causes anxiety)

**Calm KPIs (measure these, not DAU/session-length):**
- Ritual completion rate (target > 80%)
- Time-to-done for Payday Ritual (target ≤ 15 min)
- Notification opt-out rate (if > 20%, notifications are spam)
- Voluntary return rate

---

## Usability Heuristics (Nielsen's 10)

Apply these to every screen and interaction:

1. **Visibility of system status** — immediate feedback on every action; toast notifications for async ops.
2. **Match system and real world** — use household language, not technical jargon.
3. **User control and freedom** — undo/redo; clear exits; no locked-in workflows.
4. **Error prevention** — confirm destructive actions; disable invalid options.
5. **Error messages** — plain language; identify the problem; suggest a fix.
6. **Recognition over recall** — make actions visible; show context.
7. **Flexibility and efficiency** — shortcuts for power users; progressive disclosure for novices.
8. **Aesthetic and minimalist design** — remove irrelevant info; reduce cognitive load.
9. **Help and documentation** — task-focused; concrete steps.
10. **Error recovery** — undo/redo on destructive actions; graceful degradation.

**For destructive actions specifically:** confirmation dialog with item name + consequence → toast confirming action ("Task deleted") → undo button in toast → disable button for 500ms to prevent double-clicks.

---

## Privacy & Data Governance

- **Data minimisation:** Collect and keep only what is necessary.
- **Purpose limitation:** Use data only for stated purposes (service delivery, security, legal).
- **No bank connections — ever.** This is a core product decision.
- **No sale of data** for advertising or third-party marketing.
- **User rights:** Data export (CSV) ≤ 2 steps; account deletion is a single confirmed action.
- **Transparency:** Privacy settings prominent, plain-language, and default to privacy-protective.
- Comply with UK GDPR as a minimum; exceed it where possible.

---

## Company Principles (The 8 PLOT Beliefs)

These are non-negotiable. Every feature, every line of code, every copy decision must align with all 8. If **no** to any → don't build it.

### 01 — The Sisyphean Condition
Life is repetitive. Bills need paying every month. Chores need doing every week. Meals need planning. The boulder always rolls back down the hill. Most apps promise to eliminate the boulder through automation or optimisation — they can't. The boulder is life.

**PLOT's approach:** Accept the boulder. Make pushing it bearable. Turn repetition into ritual.  
**Code implication:** 20 minutes at payday. 10 minutes on Sunday. The rest of their time? They live their life. Recurring tasks/bills must be explicit and visible, not hidden by automation. Rituals need clear entry/exit points.

### 02 — Household Labour is Real Work
Budgeting, meal planning, chore management, document tracking — this is real work. In most households, one person does most of this work invisibly. They manage the spreadsheet. They chase updates. They hold the mental load. This isn't just inefficient. It's unfair.

**PLOT's approach:** Make household work visible. Distribute it equitably. No one should be the household chancellor. Households are teams, not hierarchies.  
**Code implication:** No "admin" or "owner" roles that concentrate power. Fairness tracking (who does what). Both partners see everything by default. Audit trails for who added/completed what.

### 03 — Tools Should Serve, Not Surveil
Most budgeting apps want to connect to your bank. They harvest your transactions. They analyse your behaviour. Some sell this data. Others use it to shape your spending. This is surveillance capitalism.

**PLOT's approach:** No bank connections. No transaction harvesting. No behavioural extraction. You enter the numbers. You make the decisions. You own the data. We're paid by optional Pay What You Like contributions, not by your data.  
**Code implication:** No bank connections — ever. No third-party data sharing for advertising. Users export and delete data freely. Privacy defaults must be maximally protective.

### 04 — Autonomy Over Optimisation
Your household isn't an algorithm. Your values aren't data points. Software shouldn't decide for you — it should help you decide together.

**PLOT's approach:** The tool helps. You decide. Structure, visibility, and shared control — the judgment is yours. Software is infrastructure, not a parent.  
**Code implication:** No black-box AI recommendations. All calculations shown (formula, not just result). Users override any system suggestion. No dark patterns or nudges.

### 05 — Constraint as Kindness
When you have infinite options, decision-making becomes exhausting. Too much freedom is a burden.

**PLOT's approach:** Make the hard decisions so users don't have to. One or two great ways to do each thing. Opinionated workflows. Simple systems beat complex ones.  
**Code implication:** Resist feature bloat (each feature must solve real pain). Default settings work for 80% of users. Advanced options hidden behind a toggle. If adding configuration, question whether the feature is needed at all.

### 06 — Respect for Time
Most apps optimise for engagement. More notifications. More daily check-ins. More screen time. Your time is the product being sold.

**PLOT's approach:** We want 20 minutes of your month. Not your life. Get in, handle it, get out. Good tools disappear when you're not using them. **The goal is to spend LESS time in PLOT, not more.**  
**Code implication:** No gamification (streaks, badges, points). No pushy notifications. Fast load times. Every screen has a clear "done" exit. If you can't answer "what does the user do when they're done here?" — the screen is broken.

### 07 — Reality Over Aspiration
Most productivity apps sell transformation. But household admin isn't aspirational — it's mundane. Bills, chores, groceries are life's unglamorous scaffolding.

**PLOT's approach:** Honesty. Not here to transform anyone. Here to make the boring parts of life less painful so there's more time for what matters: love, connection, presence, meaning.  
**Code implication:** Copy must be straightforward, not motivational. No "achievement unlocked" language. Error messages honest, not cutesy. Onboarding sets realistic expectations.

### 08 — Built With, Not For
Products built in isolation from their users serve the builder, not the user.

**PLOT's approach:** Founding members vote on what gets built next. Listen. Adapt. Build with users. The best tools emerge from conversation, not command.  
**Code implication:** Feature flags for beta testing with founding members. In-app feedback mechanism. Changelogs visible and honest. Decision rationale documented.

---

**Decision test:** Would this feature make a household's life concretely better? If no → don't build it.

**Anti-patterns to avoid:**
❌ Engagement optimization (streaks, badges, DAU goals)  
❌ Dark patterns (hidden costs, confusing cancellation)  
❌ Surveillance features (bank connections, transaction scraping)  
❌ AI black boxes (unexplained recommendations)  
❌ Complexity creep (too many configuration options)  
❌ Hierarchy enforcement (admin roles that concentrate power)  
❌ Aspiration marketing ("transform your life!")  
❌ Feature cloning (copying competitors without purpose)  

---

## Design Philosophy: Designed to Get You Out of It

> "The goal is to spend LESS time in PLOT, not more."

Every coding decision must be evaluated against this principle: does this change help the user complete their task and leave, or does it invite them to stay longer?

**PLOT is successful when users spend the minimum time needed.** A user who completes the Payday Ritual in 15 minutes and doesn't open the app for a month is a perfect user — not a churning user.

**Implications for every feature and UI decision:**

- **Every screen needs a clear exit.** If you can't immediately answer "what does the user do when they're done here?" — the screen is broken.
- **Completion > discovery.** Features exist to complete tasks, not to be discovered. Don't add dashboards, feeds, or lists that reward passive browsing.
- **Speed is care.** Fast load times, optimistic UI updates, and instant feedback respect the user's time. A spinner where there could be an optimistic update is a failure.
- **Default to done.** Pre-fill, sensible defaults, and remembering previous choices all reduce the time it takes to get out.
- **No re-engagement.** Never add notifications, prompts, or UI patterns whose purpose is to bring the user back into the app. The only acceptable notification is the payday reminder.
- **Measure time-to-done, not time-in-app.** Payday Ritual target: ≤ 15 minutes. Weekly Reset target: ≤ 10 minutes. If a flow takes longer, it's broken.

This is not minimalism for its own sake — it's respect encoded in software.

---

## User Needs: Managing Money as a Couple

PLOT exists to solve specific, real pain points that couples face when managing shared finances. Every feature must map to one of these needs.

### The Core Problem
Money is the #1 cause of relationship stress — and the stress is usually about the *conversation*, not the money itself. Couples need:

1. **A fair split, calculated automatically** — "How do we divide joint bills when we earn different amounts?" PLOT calculates income-proportional splits (e.g. 37.5%/62.5% if incomes are £3k/£5k) and applies them to every joint bill. No manual negotiation every month.

2. **Shared visibility without a household chancellor** — One partner shouldn't be the spreadsheet keeper. Both partners should see the same picture. Neither should have admin powers the other lacks.

3. **A structure that replaces awkward conversations** — The Payday Ritual replaces ad-hoc, uncomfortable money conversations with a structured monthly ritual. The ritual is the product.

4. **Privacy by design** — Many couples are not comfortable connecting bank accounts to third-party apps. Manual entry is a feature, not a limitation. You enter the numbers. You own the data.

5. **Independence within a shared system** — PLOT is not a joint bank account. Partners maintain separate finances. PLOT shows how to split the shared parts fairly.

6. **Solo → couple flexibility** — Users can start solo and invite a partner later. PLOT works for one person or two. Never make solo users feel like they're waiting for a partner.

### What This Means for Code

- Never build features that require one partner to be "admin" or have special access.
- Fair split calculation is first-class logic — keep it transparent and overridable.
- The Payday Ritual is the product's core ceremony — protect its greeting → work → celebration arc.
- Onboarding must ask "solo or with a partner?" and both paths must feel equally valid.
- Copy uses "household" where possible, not "couple", to be inclusive of solo users.
- Never build transaction tracking, spending analytics, or bank-linking — these solve different problems and compromise privacy.
