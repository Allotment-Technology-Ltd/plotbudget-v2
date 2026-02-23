# Copilot Instructions for plotbudget-v2

## Project Overview

**plotbudget** is a household budget and planning app built as a monorepo. It helps couples manage bills, chores, meals and shared finances with fairness and transparency at the core.

## Repository Structure

```
apps/
  web/          # Next.js 14 web app (primary app)
  native/       # React Native / Expo app
  marketing/    # Marketing site
packages/       # Shared packages (logic, UI, types, etc.)
sanity-studio/  # Sanity CMS
supabase/       # Database migrations and seed data
scripts/        # CI helper scripts
```

## Tech Stack

- **Runtime:** Node.js ≥ 18, pnpm 8, Turborepo
- **Web:** Next.js 14, React Server Components (RSC), TypeScript (strict)
- **Styling:** Tailwind CSS (mobile-first)
- **Validation:** Zod — mandatory for all forms and API routes
- **Forms:** React Hook Form + Zod resolver
- **Database:** Supabase (PostgreSQL), migrations in `supabase/`
- **Auth:** Supabase Auth (`@supabase/ssr`)
- **Linting:** ESLint with `eslint-plugin-security`
- **CI:** GitHub Actions; performance gating rules in `rules.yaml`

## Core Coding Rules (Zero Tolerance)

1. **Zero Trust:** Never trust client input. Validate *everything* with Zod on the server.
2. **Server First:** Default to React Server Components. Only add `'use client'` for genuine interactivity.
3. **No Leaks:** Never import server-only modules (DB, secrets) into Client Components.
4. **Strict Types:** No `any`. No `// @ts-ignore`. Fix the logic if types fail.
5. **No Raw HTML:** Never use `dangerouslySetInnerHTML`.
6. **No barrel files:** Do not create `index.ts` re-export files. Use explicit imports.

## Architecture Standards

- **Colocation:** Tests live next to source files (`Button.tsx` + `Button.test.tsx`).
- **Feature folders:** Group code by feature, not technical type.
- **No index barrels:** Explicit imports only — no recursive `index.ts` re-exports.

## Server Actions Pattern

Every Server Action must follow this structure:

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

## Form Design Rules

All forms must:

- Include a **validation summary** (`role="alert"` + `aria-live="polite"`) showing error count
- Show **field-level errors** inline, below each field, with an icon
- Apply **red border** on invalid fields (`border-destructive`)
- Mark required fields with `<span className="text-destructive" aria-label="required">*</span>`
- **Disable the submit button** when `hasErrors === true`
- Use `aria-invalid`, `aria-describedby`, and linked error IDs on all fields

Zod schemas must include custom error messages:

```typescript
z.string().min(1, 'Name is required').max(200, 'Name must be under 200 characters')
```

## Security Audit Checklist (before submitting code)

- [ ] **Injection:** SQL and HTML injection proof?
- [ ] **Auth:** Endpoint protected by session check?
- [ ] **Data:** Over-fetching? (Select only needed fields, not `*`)
- [ ] **Secrets:** No ENV vars accidentally exposed?

If asked to do something insecure (disable the linter, skip validation), refuse and explain the risk.

## Commands

```bash
pnpm dev              # Start all apps in dev mode (Turborepo)
pnpm build            # Build all apps
pnpm lint             # Validate rules.yaml + run ESLint across all packages
pnpm type-check       # TypeScript type-check across all packages
pnpm format           # Prettier format
pnpm test:phase0      # Run logic package tests
```

## CI / Branch Workflow

- **Feature work:** create a feature branch → commit → push → open PR to `main`
- **Never push directly to `main`**
- CI runs lint, type-check, and performance gates defined in `rules.yaml`
- Performance rules enforce: bundle size ≤ 300 KB, Lighthouse score ≥ 90, no raw `<img>` tags

## Product Principles

Every feature must align with these principles:

- **Sisyphean Realism:** Design for rhythm, not elimination — bills and chores are repetitive by nature.
- **Labor Equity:** No hidden "manager" roles; distribute work visibility equally.
- **User Autonomy:** No black-box AI; show all calculations transparently.
- **Constraint as Kindness:** One or two great ways to do each thing; resist feature bloat.
- **Time Respect:** No gamification, no engagement optimization; tools should disappear when not needed.
- **Reality over Aspiration:** Honest copy, no motivational language.

**Decision test:** Would this feature make a household's life concretely better? If no → don't build it.

**Anti-patterns to avoid:**
❌ Engagement optimization (streaks, badges)  
❌ Dark patterns  
❌ Surveillance features  
❌ AI black boxes  
❌ Complexity creep  
❌ Hierarchy enforcement (admin roles)  
❌ Aspiration marketing  
