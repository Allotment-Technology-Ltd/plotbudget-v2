# PLOT Platform Expansion — Implementation Spec & Cursor Prompts

> **Version:** 1.0 — February 2026
> **Codebase Baseline:** plotbudget-v2 monorepo (TurboRepo)
> **Reference Documents:** `plot-expansion-roadmap-v2.md`, `plot-ux-ui-guide.md`, `design.md`, `spec.md`, `codebase-audit.md`

---

## How To Use This Document

This document contains implementation-ready Cursor Composer prompts for each phase of the PLOT platform expansion. Each phase follows this structure:

1. **Context Block** — paste this into Cursor first to set the scene
2. **Prompt Sequence** — numbered prompts to execute in order. Each prompt produces working code.
3. **Verification Steps** — how to check it worked before moving to the next prompt

**Rules for using these prompts:**
- Execute prompts in order within each phase
- Verify each prompt's output before moving to the next
- If Cursor produces errors, paste the error back and ask it to fix
- Don't skip phases — each builds on the previous
- Each prompt includes the full file paths based on your actual monorepo structure

---

## Phase 0: Platform Foundation

### Phase 0 Context Block

Paste this into Cursor at the start of a new Composer session for Phase 0 work:

```
# CONTEXT: PLOT Platform Expansion — Phase 0 (Platform Foundation)

## What we're building
We're expanding PLOT from a couples budgeting app into a household operating system with multiple modules (Money, Tasks, Calendar, Meals, Holidays, Vault, Home, Kids). Phase 0 creates the shared infrastructure all future modules depend on.

## Current codebase state
- Monorepo: TurboRepo with pnpm
- Apps: `apps/web` (Next.js 16, App Router), `apps/native` (Expo/React Native), `apps/marketing` (Vite)
- Packages: `packages/logic` (Zod, Zustand, date-fns), `packages/ui` (Radix + Tailwind + shadcn), `packages/native-ui` (RN components), `packages/supabase` (types), `packages/design-tokens`
- Auth: Supabase Auth with PKCE, AuthProvider in native, createServerSupabaseClient in web
- DB: Supabase PostgreSQL with RLS on all tables. Existing tables: users, households, paycycles, seeds, pots, repayments, income_sources, subscriptions, audit_events, push_tokens
- Routing: Web uses route groups — `(auth)/`, `dashboard/`, `onboarding/`, `partner/`, `dev/`. Native uses Expo Router with `(auth)/`, `(onboarding)/`, `(tabs)/`
- State: TanStack Query for server state. Zustand available in packages/logic.
- Design: PLOT Design System v2 — warm cream light mode (#F5F0EA), dark terminal aesthetic (#111111), Space Mono/JetBrains Mono for headings, Inter for body, Forest Green #0E8345 / Mint #69F0AE accents
- Existing migrations in `supabase/migrations/`
- Package aliases: `@repo/logic`, `@repo/ui`, `@repo/native-ui`, `@repo/supabase`, `@repo/design-tokens`

## Architecture rules
- All business logic, Zod schemas, and calculations go in `packages/logic/src/`
- UI components shared across web go in `packages/ui/src/`
- Native components go in `packages/native-ui/src/`
- Web pages are "dumb" — they fetch data and render. No math in components.
- Every new DB table needs RLS policies using the `household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())` pattern
- TypeScript strict mode, no `any` types
- Full file contents always — never use "// ... rest of code" placeholders

## Phase 0 deliverables
1. Notifications table + engine (in-app + push)
2. Activity Feed table + engine
3. Module navigation system (bottom tab bar for native, sidebar for web)
4. Global search infrastructure
5. Module colour tokens in design system
6. Shared cross-module linking types and patterns
```

---

### Prompt 0.1 — Database Migration: Notifications & Activity Feed

```
Create a new Supabase migration file for the notifications and activity feed tables.

File: `supabase/migrations/20260301000000_notifications_activity_feed.sql`

Requirements:
- `notifications` table: id (UUID PK), household_id (FK → households), user_id (FK → auth.users), title (TEXT NOT NULL), body (TEXT), source_module (TEXT NOT NULL), source_entity_id (UUID nullable), action_url (TEXT nullable), is_read (BOOLEAN DEFAULT FALSE), push_sent (BOOLEAN DEFAULT FALSE), created_at (TIMESTAMPTZ DEFAULT NOW())
- `activity_feed` table: id (UUID PK), household_id (FK → households), actor_user_id (UUID FK → auth.users, nullable for system), actor_type (TEXT NOT NULL — 'user' | 'partner' | 'system'), action (TEXT NOT NULL), object_name (TEXT NOT NULL), object_detail (TEXT), source_module (TEXT NOT NULL), source_entity_id (UUID nullable), action_url (TEXT nullable), metadata (JSONB DEFAULT '{}'), created_at (TIMESTAMPTZ DEFAULT NOW())
- Enable RLS on both tables
- RLS policies: users can only read/write notifications and feed items where `household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())`
- Separate SELECT and INSERT policies
- Indexes on: notifications(user_id, is_read), notifications(household_id, created_at DESC), activity_feed(household_id, created_at DESC)
- Add updated_at triggers to notifications table

Also update `packages/supabase/src/database.types.ts` to add the TypeScript types for both new tables, following the exact same pattern used for existing tables (Row, Insert, Update types). Add to the Enums section if needed.

Output the complete migration SQL file and the complete updated database.types.ts file.
```

### Prompt 0.2 — Shared Logic: Module Registry & Cross-Module Types

```
Create the module registry and cross-module types in packages/logic.

## File 1: `packages/logic/src/modules/registry.ts`

Create a module registry that defines all PLOT modules with their metadata. This is the single source of truth for module information used by both web and native.

```typescript
export type ModuleId = 'money' | 'tasks' | 'calendar' | 'meals' | 'holidays' | 'vault' | 'home' | 'kids';

export interface ModuleDefinition {
  id: ModuleId;
  name: string;
  description: string;
  icon: string; // lucide-react icon name for web, expo vector icon name for native
  colorLight: string;
  colorDark: string;
  isPro: boolean;
  isEnabled: boolean; // false = not yet built, hidden from nav
  navOrder: number; // determines position in navigation
  tabBar: boolean; // true = shown in bottom tab bar (max 4 + more)
}
```

Define all 8 modules with these colours:
- money: #0E8345 / #69F0AE (already the app accent)
- tasks: #2563EB / #60A5FA
- calendar: #7C3AED / #A78BFA
- meals: #EA580C / #FB923C
- holidays: #0D9488 / #5EEAD4
- vault: #475569 / #94A3B8
- home: #D97706 / #FCD34D
- kids: #DB2777 / #F472B6

Set `isEnabled: true` only for `money`. All others `false` (we'll enable as we build them). Set `tabBar: true` for money, tasks, calendar (these plus "home" feed and "more" make up the 5 bottom tabs).

Export a `getModule(id: ModuleId)` function, a `getEnabledModules()` function, a `getTabBarModules()` function, and a `getOverflowModules()` function.

## File 2: `packages/logic/src/modules/cross-module.ts`

Define types for cross-module linking:

```typescript
export interface CrossModuleLink {
  sourceModule: ModuleId;
  sourceEntityId: string;
  targetModule: ModuleId;
  targetEntityId: string;
  linkType: string; // e.g., 'pot_funding', 'auto_task', 'calendar_event', 'vault_document'
}
```

## File 3: `packages/logic/src/modules/index.ts`

Re-export everything from registry and cross-module.

## File 4: Update `packages/logic/src/index.ts`

Add the modules export: `export * from './modules';`

Output all 4 complete files.
```

### Prompt 0.3 — Shared Logic: Notification & Activity Feed Schemas + Actions

```
Create Zod schemas and server-side action helpers for notifications and activity feed.

## File 1: `packages/logic/src/notifications/schemas.ts`

Zod schemas for:
- `createNotificationSchema` — validates title, body (optional), source_module (must be a valid ModuleId), source_entity_id (optional UUID), action_url (optional string)
- `markNotificationReadSchema` — validates notification id
- `notificationPreferencesSchema` — validates per-module push notification toggles

Infer and export TypeScript types from each schema.

## File 2: `packages/logic/src/notifications/index.ts`

Re-export schemas.

## File 3: `packages/logic/src/activity-feed/schemas.ts`

Zod schemas for:
- `createActivitySchema` — validates actor_type ('user' | 'partner' | 'system'), action (string), object_name (string), object_detail (optional), source_module (ModuleId), source_entity_id (optional UUID), action_url (optional), metadata (optional record)

Infer and export types.

## File 4: `packages/logic/src/activity-feed/index.ts`

Re-export schemas.

## File 5: Update `packages/logic/src/index.ts`

Add exports for notifications and activity-feed.

Output all 5 complete files.
```

### Prompt 0.4 — Web API Routes: Notifications & Activity Feed

```
Create API routes in the web app for notifications and activity feed CRUD.

## File 1: `apps/web/app/api/notifications/route.ts`

GET handler:
- Authenticate user via createServerSupabaseClient
- Fetch notifications for the user's household, ordered by created_at DESC
- Support query param `?unread=true` to filter unread only
- Support query param `?limit=20` for pagination
- Return JSON array

POST handler:
- Authenticate user
- Validate body with createNotificationSchema from @repo/logic
- Get user's household_id from the users table
- Insert notification
- Return created notification

## File 2: `apps/web/app/api/notifications/[id]/read/route.ts`

PATCH handler:
- Authenticate user
- Mark notification as read (is_read = true)
- Return updated notification

## File 3: `apps/web/app/api/notifications/mark-all-read/route.ts`

PATCH handler:
- Authenticate user
- Get household_id
- Update all unread notifications for this user to is_read = true
- Return { count: number }

## File 4: `apps/web/app/api/activity-feed/route.ts`

GET handler:
- Authenticate user
- Fetch activity feed for the user's household, ordered by created_at DESC
- Support `?limit=20` and `?before=ISO_DATE` for cursor pagination
- Return JSON array

POST handler:
- Authenticate user
- Validate body with createActivitySchema from @repo/logic
- Get household_id, insert with actor_user_id = current user id
- Return created activity

Follow the same patterns used in existing routes like `apps/web/app/api/seeds/route.ts` for auth, error handling, and response format. Use createServerSupabaseClient from `@/lib/supabase/server`.

Output all 4 complete route files.
```

### Prompt 0.5 — Web: Activity Feed Home Screen

```
Create a new Home screen that replaces the current dashboard as the default landing page. This is an activity feed with smart cards.

## Architecture decision
We're NOT replacing the existing dashboard page. We're adding a new home route that becomes the main entry point. The existing dashboard/blueprint/settings stay as-is under the Money module.

## File 1: `apps/web/app/dashboard/home/page.tsx`

Server component that:
- Fetches current user, household, notifications (unread), recent activity feed items (last 20)
- Passes data to a client component
- Uses the same auth pattern as the existing `apps/web/app/dashboard/page.tsx`

## File 2: `apps/web/components/home/home-feed-client.tsx`

Client component ('use client') that renders:
1. Smart card carousel (horizontal scroll) — only shows when there are actionable items
2. Activity feed grouped by day (Today, Yesterday, Earlier)

Smart card logic (check conditions from props data):
- "X unpaid bills" — count seeds where is_paid = false in active paycycle
- "Payday Ritual ready" — active paycycle exists but ritual_closed = false and it's within 3 days of pay_cycle_end_date
- Others will be added as modules are built

Each smart card: left border using module colour from @repo/logic registry, title, description, right chevron, clickable (Link to relevant page).

Each feed item: Avatar (32px circle with initial, green bg for current user, terracotta #C78D75 bg for partner, neutral for system), actor name + action + object (tappable), timestamp (relative using date-fns formatDistanceToNow), module label only for system items.

Use the PLOT design system: bg-background for page, Card components from @repo/ui, Space Mono for section headers and timestamps, Inter for body text. Support dark mode using existing CSS custom properties.

## File 3: `apps/web/components/home/smart-card.tsx`

Reusable smart card component with props: title, description, moduleId (for colour), href, icon.

## File 4: `apps/web/components/home/feed-item.tsx`

Reusable feed item component with props matching the activity_feed row type.

Style all components using Tailwind classes that reference the existing design token CSS custom properties (bg-background, text-foreground, etc). Use the module colours from the registry for left borders and accent touches.

Output all 4 complete files.
```

### Prompt 0.6 — Web: Module Navigation Sidebar

```
Update the dashboard layout to include a module-aware sidebar navigation that replaces the current simple header/footer navigation.

## File 1: Update `apps/web/app/dashboard/layout.tsx`

Modify the existing dashboard layout to:
- Keep all existing auth checks and data fetching
- Add a left sidebar (hidden on mobile, visible on md+ screens)
- On mobile, keep a bottom navigation bar
- Import module definitions from @repo/logic modules registry
- Pass enabled modules to the nav component

The layout structure should be:
```
<div className="flex min-h-screen">
  <Sidebar /> {/* hidden on mobile, w-64 on desktop */}
  <main className="flex-1">
    <MobileTopBar /> {/* visible on mobile only */}
    {children}
  </main>
  <MobileBottomNav /> {/* visible on mobile only, fixed bottom */}
</div>
```

## File 2: `apps/web/components/dashboard/sidebar.tsx`

Desktop sidebar component:
- PLOT logo at top
- Navigation links for: Home (house icon), then each enabled module from the registry
- Settings link at bottom
- Active state: accent background, bold text
- Collapsed state (just icons) available via toggle
- Uses lucide-react icons
- Each link shows the module colour as a subtle left indicator when active

## File 3: `apps/web/components/dashboard/mobile-bottom-nav.tsx`

Mobile bottom navigation (visible below md breakpoint):
- 5 slots: Home, Money, Tasks, Calendar, More
- "More" opens a modal/sheet showing remaining modules
- Uses the same module colours for active states
- Fixed to bottom, safe area padding
- Icons from lucide-react: Home, PoundSterling, CheckSquare, Calendar, MoreHorizontal

## File 4: `apps/web/components/dashboard/mobile-top-bar.tsx`

Mobile header:
- PLOT logo left
- Notification bell (with unread count badge) + avatar right

Preserve ALL existing functionality in the dashboard layout (auth check, redirect to /onboarding, partner detection, display name, avatar URL). Add the new navigation around the existing children rendering.

Output all 4 complete files.
```

### Prompt 0.7 — Native: Bottom Tab Bar Update

```
Update the native app's tab navigation to match the new module navigation system.

## File: Update `apps/native/app/(tabs)/_layout.tsx`

Modify the existing tabs layout to:
- Have 5 tabs: Home (activity feed), Money (existing budget screens), Tasks (placeholder), Calendar (placeholder), More (placeholder)
- Import module definitions from @repo/logic
- Use the module colour system for active tab icons
- Tab bar styling: bg matches native-ui theme (dark: #1A1A1A, light: #FFFFFF), active tab has accent colour + pill indicator above icon
- Labels: Space Mono font, 10px, uppercase
- Icons: @expo/vector-icons FontAwesome or Ionicons

For tabs that don't exist yet (Tasks, Calendar, More), create placeholder screen files:

## File 2: `apps/native/app/(tabs)/home.tsx`

Placeholder home/feed screen with a "Coming soon — Activity Feed" message styled with the PLOT design system.

## File 3: `apps/native/app/(tabs)/tasks.tsx`

Placeholder: "Tasks module coming soon" with module colour accent.

## File 4: `apps/native/app/(tabs)/calendar.tsx`

Placeholder: "Calendar module coming soon" with module colour accent.

Rename the existing `index.tsx` (budget dashboard) to remain accessible but update the tab order so Home is first.

Follow the existing patterns in `apps/native/app/(tabs)/_layout.tsx` for screen options, header configuration, and theme usage. Use @repo/native-ui components where applicable.

Output all complete files.
```

### Prompt 0.8 — Design Tokens: Module Colours

```
Add module colour tokens to the design token system.

## File 1: Update `packages/design-tokens/src/tokens.config.ts`

Add module colour definitions to the existing token config. Each module needs a light and dark variant:

```typescript
modules: {
  money: { light: '#0E8345', dark: '#69F0AE' },
  tasks: { light: '#2563EB', dark: '#60A5FA' },
  calendar: { light: '#7C3AED', dark: '#A78BFA' },
  meals: { light: '#EA580C', dark: '#FB923C' },
  holidays: { light: '#0D9488', dark: '#5EEAD4' },
  vault: { light: '#475569', dark: '#94A3B8' },
  home: { light: '#D97706', dark: '#FCD34D' },
  kids: { light: '#DB2777', dark: '#F472B6' },
}
```

## File 2: Update `packages/design-tokens/src/tokens.css`

Add CSS custom properties for each module colour in both :root (light) and .dark blocks:

```css
:root {
  --module-money: 14 131 69;
  --module-tasks: 37 99 235;
  /* etc... RGB triplets for alpha support */
}
.dark {
  --module-money: 105 240 174;
  --module-tasks: 96 165 250;
  /* etc... */
}
```

## File 3: Update `packages/design-tokens/src/native.ts`

Add the module colours to the native theme export so React Native can use them.

## File 4: Update `packages/ui/tailwind.config.ts`

Add module colours to the Tailwind config extending the colors object:

```typescript
module: {
  money: 'rgb(var(--module-money) / <alpha-value>)',
  tasks: 'rgb(var(--module-tasks) / <alpha-value>)',
  // etc...
}
```

This enables classes like `text-module-money`, `bg-module-tasks/10`, `border-module-calendar` throughout the web app.

Output all 4 complete updated files. Preserve ALL existing content in each file — only add the new module colour sections.
```

### Phase 0 Verification Checklist

Before moving to Phase 1, verify:

- [ ] `pnpm build` succeeds in root (no TypeScript errors)
- [ ] Supabase migration applies: `supabase db push` or apply locally
- [ ] New tables visible in Supabase dashboard with RLS enabled
- [ ] Web app: `/dashboard/home` loads with empty feed and no smart cards
- [ ] Web app: sidebar shows on desktop, bottom nav on mobile
- [ ] Native app: 5 tabs visible, Home tab is active on launch
- [ ] Module colours appear correctly in both light and dark mode
- [ ] `packages/logic` exports module registry, notification schemas, activity feed schemas

---

## Phase 1: Tasks, Chores & Projects Module

### Phase 1 Context Block

```
# CONTEXT: PLOT Platform Expansion — Phase 1 (Tasks, Chores & Projects Module)

## What we're building
The Tasks module adds three capabilities: standalone tasks (to-dos), recurring routines (chores with alternating assignment), and multi-phase projects (for large household undertakings like renovations). It includes a kanban board, a Weekly Reset ceremony, and fairness tracking.

## What exists from Phase 0
- notifications and activity_feed tables with RLS
- Module registry in packages/logic/src/modules/ with all 8 modules defined
- Cross-module linking types
- Notification and activity feed Zod schemas
- API routes for notifications and activity feed
- Home screen with activity feed and smart cards
- Module navigation (sidebar on web, bottom tabs on native)
- Module colour tokens in design system

## Current codebase structure
(Same as Phase 0 context block — copy the full codebase state section)

## Architecture rules
(Same as Phase 0 — copy the architecture rules section)

## Tasks module data model

### Tables to create:
- `projects` — household projects with phases, linked to pots/repayments
- `project_phases` — ordered phases within a project
- `tasks` — individual work items, can belong to routines or project phases
- `routines` — recurring chore templates that auto-generate tasks

### Key relationships:
- Task → Project (optional): `project_id` FK
- Task → Phase (optional): `phase_id` FK
- Task → Routine (optional): `routine_id` FK
- Project → Pot (optional): `linked_pot_id` FK to existing pots table
- Project → Repayment (optional): `linked_repayment_id` FK to existing repayments table
- All tables: `household_id` FK with RLS

### Enums to add:
- project_status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
- task_status: 'backlog' | 'todo' | 'in_progress' | 'done' | 'skipped'
- task_priority: 'low' | 'medium' | 'high' | 'urgent'
- effort_level: 'quick' | 'medium' | 'involved'
- assignment_mode: 'fixed_me' | 'fixed_partner' | 'alternating' | 'unassigned'
- routine_frequency: 'daily' | 'weekly' | 'fortnightly' | 'monthly'

### Cross-module links:
- Seeds can auto-create tasks (via linked_module + linked_entity_id on task)
- Meal plan confirmation creates a "Do the weekly shop" task
- Projects link to pots and repayments for budget tracking
```

---

### Prompt 1.1 — Database Migration: Tasks Module Tables

```
Create the Supabase migration for the Tasks module.

File: `supabase/migrations/20260310000000_tasks_module.sql`

Create these tables with full RLS:

1. `projects` table:
   - id UUID PK, household_id FK → households ON DELETE CASCADE
   - name TEXT NOT NULL, description TEXT
   - status (enum project_status: planning, active, on_hold, completed, cancelled) DEFAULT 'planning'
   - start_date DATE, target_end_date DATE
   - linked_pot_id UUID FK → pots ON DELETE SET NULL
   - linked_repayment_id UUID FK → repayments ON DELETE SET NULL
   - estimated_budget DECIMAL(12,2), actual_spend DECIMAL(12,2) DEFAULT 0
   - cover_image_url TEXT
   - sort_order INTEGER DEFAULT 0
   - created_at, updated_at TIMESTAMPTZ

2. `project_phases` table:
   - id UUID PK, project_id FK → projects ON DELETE CASCADE, household_id FK → households ON DELETE CASCADE
   - name TEXT NOT NULL, description TEXT
   - status (TEXT CHECK): 'pending' | 'active' | 'completed' DEFAULT 'pending'
   - sort_order INTEGER NOT NULL DEFAULT 0
   - start_date DATE, end_date DATE
   - created_at TIMESTAMPTZ

3. `tasks` table:
   - id UUID PK, household_id FK → households ON DELETE CASCADE
   - name TEXT NOT NULL, description TEXT
   - assigned_to (TEXT CHECK): 'me' | 'partner' | 'unassigned' DEFAULT 'unassigned'
   - status (enum task_status) DEFAULT 'todo'
   - priority (TEXT CHECK): 'low' | 'medium' | 'high' | 'urgent' DEFAULT 'medium'
   - due_date DATE, completed_at TIMESTAMPTZ
   - project_id UUID FK → projects ON DELETE CASCADE (nullable)
   - phase_id UUID FK → project_phases ON DELETE SET NULL (nullable)
   - routine_id UUID FK → routines ON DELETE SET NULL (nullable)
   - effort_level (TEXT CHECK): 'quick' | 'medium' | 'involved' DEFAULT 'medium'
   - kanban_order INTEGER DEFAULT 0
   - linked_module TEXT (nullable)
   - linked_entity_id UUID (nullable)
   - created_by UUID FK → auth.users (nullable)
   - created_at, updated_at TIMESTAMPTZ

4. `routines` table:
   - id UUID PK, household_id FK → households ON DELETE CASCADE
   - name TEXT NOT NULL, description TEXT
   - frequency (TEXT CHECK): 'daily' | 'weekly' | 'fortnightly' | 'monthly' DEFAULT 'weekly'
   - day_of_week INTEGER (0=Sunday, nullable)
   - assignment_mode (TEXT CHECK): 'fixed_me' | 'fixed_partner' | 'alternating' | 'unassigned' DEFAULT 'unassigned'
   - effort_level (TEXT CHECK): 'quick' | 'medium' | 'involved' DEFAULT 'medium'
   - category TEXT
   - is_active BOOLEAN DEFAULT TRUE
   - last_generated_for DATE (nullable — tracks when tasks were last auto-generated)
   - created_at, updated_at TIMESTAMPTZ

RLS policies for ALL tables using the household_id subquery pattern. Separate SELECT, INSERT, UPDATE, DELETE policies.

Indexes:
- tasks(household_id, status), tasks(household_id, due_date), tasks(project_id), tasks(routine_id), tasks(phase_id)
- projects(household_id, status)
- project_phases(project_id, sort_order)
- routines(household_id, is_active)

updated_at triggers on all tables.

Also update `packages/supabase/src/database.types.ts` to add types for all 4 new tables.

Output the complete migration file and complete updated types file.
```

### Prompt 1.2 — Shared Logic: Tasks Module Schemas & Business Logic

```
Create the Zod schemas and business logic for the Tasks module in packages/logic.

## File 1: `packages/logic/src/tasks/schemas.ts`

Zod schemas for:
- `createTaskSchema` — name (string min 1, max 200), description (optional), assigned_to, status, priority, due_date (optional date string), project_id (optional UUID), phase_id (optional UUID), routine_id (optional UUID), effort_level, linked_module (optional ModuleId), linked_entity_id (optional UUID)
- `updateTaskSchema` — same fields but all optional, plus id (required UUID)
- `createProjectSchema` — name, description (optional), start_date, target_end_date (optional), linked_pot_id (optional), linked_repayment_id (optional), estimated_budget (optional positive number)
- `updateProjectSchema` — same but optional + id required
- `createPhaseSchema` — project_id (UUID), name, description (optional), sort_order (integer)
- `createRoutineSchema` — name, description (optional), frequency, day_of_week (optional 0-6), assignment_mode, effort_level, category (optional)
- `updateRoutineSchema` — same but optional + id required

Infer and export TypeScript types from all schemas.

## File 2: `packages/logic/src/tasks/fairness.ts`

Fairness calculation logic:

```typescript
interface FairnessInput {
  tasks: Array<{
    assigned_to: 'me' | 'partner' | 'unassigned';
    status: string;
    effort_level: 'quick' | 'medium' | 'involved';
    completed_at: string | null;
  }>;
  periodDays: number; // e.g., 30 for rolling month
}

interface FairnessResult {
  myPercentage: number;
  partnerPercentage: number;
  myCount: number;
  partnerCount: number;
  myWeightedScore: number;
  partnerWeightedScore: number;
  isBalanced: boolean; // within 60/40 threshold
}
```

Effort weights: quick = 1, medium = 2, involved = 4. Only count completed tasks (status = 'done'). isBalanced = true if neither person exceeds 60%.

## File 3: `packages/logic/src/tasks/routine-generator.ts`

Function to generate tasks from active routines:

```typescript
function generateTasksFromRoutines(
  routines: Routine[],
  existingTasks: Task[], // to check what's already generated
  targetDate: Date // generate tasks for this date/week
): TaskInsert[]
```

Logic:
- For weekly routines: generate task if none exists for this week with matching routine_id
- For daily: generate if none exists for today
- For fortnightly/monthly: generate based on last_generated_for date
- Alternating assignment: check last completed task for this routine, assign to opposite person

## File 4: `packages/logic/src/tasks/index.ts`

Re-export all.

## File 5: Update `packages/logic/src/index.ts`

Add tasks export.

Output all 5 complete files.
```

### Prompt 1.3 — Web API Routes: Tasks CRUD

```
Create API routes for full Tasks module CRUD operations.

Follow the exact same patterns used in `apps/web/app/api/seeds/route.ts` and `apps/web/app/api/seeds/[id]/route.ts` for authentication, error handling, and response format.

## File 1: `apps/web/app/api/tasks/route.ts`

GET: Fetch tasks for household. Support query params: ?status=todo,in_progress (comma-separated), ?assigned_to=me, ?project_id=uuid, ?due_before=ISO_DATE, ?due_after=ISO_DATE, ?limit=50
POST: Create task. Validate with createTaskSchema. Get household_id from user. Set created_by to current user id. Also create an activity feed entry: "[User] created [task name]".

## File 2: `apps/web/app/api/tasks/[id]/route.ts`

GET: Fetch single task by ID (with household RLS check).
PATCH: Update task. Validate with updateTaskSchema. If status changes to 'done', set completed_at to NOW(). Create activity feed entry: "[User] completed [task name]".
DELETE: Soft consideration — for now, hard delete. Create activity feed entry.

## File 3: `apps/web/app/api/tasks/[id]/complete/route.ts`

PATCH: Shortcut to mark task as done. Sets status = 'done', completed_at = NOW(). Creates activity feed entry and notification for partner if task was shared.

## File 4: `apps/web/app/api/projects/route.ts`

GET: Fetch projects for household. Support ?status filter.
POST: Create project. Validate with createProjectSchema. Create activity feed entry.

## File 5: `apps/web/app/api/projects/[id]/route.ts`

GET: Fetch project with phases and tasks included (joined query).
PATCH: Update project.
DELETE: Hard delete (cascades to phases and tasks).

## File 6: `apps/web/app/api/projects/[id]/phases/route.ts`

GET: Fetch phases for project.
POST: Create phase. Validate with createPhaseSchema.

## File 7: `apps/web/app/api/routines/route.ts`

GET: Fetch routines for household. Support ?active=true filter.
POST: Create routine. Validate with createRoutineSchema.

## File 8: `apps/web/app/api/routines/[id]/route.ts`

PATCH: Update routine.
DELETE: Deactivate (set is_active = false) rather than delete, to preserve history.

## File 9: `apps/web/app/api/routines/generate/route.ts`

POST: Trigger routine-to-task generation. Import generateTasksFromRoutines from @repo/logic. Fetch active routines and existing tasks for the week. Insert generated tasks. Return count of tasks created.

Output all 9 complete route files.
```

### Prompt 1.4 — Web: TanStack Query Hooks for Tasks

```
Create TanStack Query hooks for all Tasks module data fetching and mutations.

## File: `apps/web/hooks/use-tasks.ts`

Create hooks following the exact same pattern used in the existing codebase for seeds/paycycles (check apps/web/hooks/ for reference):

```typescript
// Query hooks
export function useTasks(filters?: TaskFilters)
export function useTask(id: string)
export function useProjects(filters?: { status?: string })
export function useProject(id: string) // includes phases and tasks
export function useRoutines(filters?: { active?: boolean })
export function useFairness(periodDays?: number)

// Mutation hooks
export function useCreateTask()
export function useUpdateTask()
export function useCompleteTask() // optimistic update
export function useDeleteTask()
export function useCreateProject()
export function useUpdateProject()
export function useCreatePhase()
export function useCreateRoutine()
export function useUpdateRoutine()
export function useGenerateRoutineTasks()
```

Key requirements:
- All queries use `useQuery` from @tanstack/react-query
- All mutations use `useMutation` with appropriate `onSuccess` invalidation
- useCompleteTask should be OPTIMISTIC: update the cache immediately, revert on error
- Query keys follow a namespace pattern: ['tasks', filters], ['project', id], ['routines']
- Type everything using the Zod-inferred types from @repo/logic/tasks
- Fetch from the API routes created in Prompt 1.3

Output the complete file.
```

### Prompt 1.5 — Web: Tasks List & Kanban Board Pages

```
Create the Tasks module web pages.

## File 1: `apps/web/app/dashboard/tasks/page.tsx`

Server component that renders the tasks page. Fetches initial data server-side for SEO/performance, then hydrates client component.

## File 2: `apps/web/app/dashboard/tasks/layout.tsx`

Layout with a header: "Tasks" title (Space Mono), view toggle (list/kanban), filter controls, and "+ Add Task" button.

## File 3: `apps/web/components/tasks/task-list-view.tsx`

Client component. Groups tasks: Overdue (red accent) → Today → This Week → Later → Done (collapsed by default). Each task row shows: checkbox, name, source indicator (routine badge, project badge), assignee avatar chip, due date. Clicking the checkbox triggers useCompleteTask with optimistic update. Clicking the row opens task detail.

## File 4: `apps/web/components/tasks/task-kanban-view.tsx`

Client component. Columns: Backlog, To Do, In Progress, Done. Uses @dnd-kit for drag-and-drop (it's already compatible with the existing stack). Each card shows: task name, assignee avatar, due date, priority dot (colour matches priority: low=grey, medium=blue, high=amber, urgent=red). Dragging between columns updates task status.

Install @dnd-kit/core and @dnd-kit/sortable if not already in apps/web/package.json.

## File 5: `apps/web/components/tasks/task-card.tsx`

Reusable task card component used in both list and kanban views. Shows task name, metadata, assignee chip (32px circle with initial, green bg for 'me', terracotta for 'partner', grey for unassigned).

## File 6: `apps/web/components/tasks/create-task-dialog.tsx`

Dialog (using Radix Dialog from @repo/ui) for creating a new task. Form fields: name (input), description (textarea), assigned_to (segmented: Me/Partner/Unassigned), priority (segmented), due_date (date picker), project_id (optional select, populated from useProjects), effort_level (segmented). Uses react-hook-form with Zod resolver using createTaskSchema from @repo/logic.

Style everything with PLOT design system: Space Mono for headers, Inter for body, module-tasks colour (#2563EB/#60A5FA) for accent touches, bg-background, existing card/border patterns.

Output all 6 complete files.
```

### Prompt 1.6 — Web: Projects Detail Page

```
Create the Projects list and detail pages.

## File 1: `apps/web/app/dashboard/tasks/projects/page.tsx`

Projects list page. Grid of project cards showing: name, status badge, progress (phase X of Y), budget summary if linked pot/repayment exists.

## File 2: `apps/web/app/dashboard/tasks/projects/[id]/page.tsx`

Server component that fetches project with phases and tasks. Renders ProjectDetailClient.

## File 3: `apps/web/components/tasks/project-detail-client.tsx`

Client component showing:
1. Cover image header (or gradient placeholder) with project title overlay
2. Status badge + progress bar (percentage of phases completed)
3. Budget section (if linked_pot_id or linked_repayment_id):
   - Linked pot: show pot name, current balance / target, progress bar
   - Linked repayment: show name, remaining balance
   - These use data fetched via existing pot/repayment queries
4. Phase timeline: vertical list of phases
   - Completed phases: collapsed with checkmark, grey
   - Active phase: expanded with task list, highlighted with module-tasks colour
   - Future phases: collapsed, muted
5. Each task in the active phase: checkbox, name, assignee, status
6. "Add Phase" and "Add Task" buttons in appropriate positions

Link format for pots: `/dashboard/blueprint` (existing route). Link format for viewing a specific task: opens task detail dialog.

Output all 3 complete files.
```

### Prompt 1.7 — Web: Weekly Reset Ceremony

```
Create the Weekly Reset ceremony flow.

## File 1: `apps/web/app/dashboard/tasks/weekly-reset/page.tsx`

Full-screen ceremony page (no sidebar visible — add `[data-ceremony="true"]` attribute that CSS can use to hide nav).

## File 2: `apps/web/components/tasks/weekly-reset/reset-flow.tsx`

Client component implementing the ceremony state machine:

Step 1 — Greeting: "Hey [display_name] 👋 / It's time for your Weekly Reset. Let's sort out the week ahead." Shows this week's task count and routine-generated tasks. "Let's go" CTA.

Step 2 — Review Auto-Generated Tasks: List of tasks generated from routines for this week. Each shows: name, suggested assignee (from routine's assignment_mode), effort level. User can: accept, reassign (tap avatar to toggle me/partner), skip. Swipeable on mobile width.

Step 3 — Claim & Swap: All unassigned tasks (including manual ones). Two columns: "Mine" and "Partner's". Drag tasks between columns to assign. Or tap to toggle.

Step 4 — Upcoming Deadlines: Calendar-style preview of this week's due dates from tasks, plus any project milestones. Informational — not editable here.

Step 5 — Completion: "All sorted ✨" + summary stats (X tasks for you, Y for partner, fairness score for the month). Confetti animation (use existing framer-motion patterns). "Back to Home" CTA.

UX requirements from the UX guide:
- Progress dots at top (● ○ ○ ○ ○)
- Full-screen, no sidebar/bottom nav
- X button top-right to exit (saves progress)
- Swipe between steps (framer-motion AnimatePresence)
- Conversational tone in greeting step
- Large breathing room between elements

Style with PLOT design system. Space Mono for step titles, Inter for body. Module-tasks colour for accents.

Output all 2 complete files.
```

### Prompt 1.8 — Native: Tasks Screens

```
Create the native Tasks module screens for the Expo app.

## File 1: `apps/native/app/(tabs)/tasks.tsx`

Main tasks screen (replaces placeholder). Shows:
- Header: "Tasks" in Space Mono, filter chip row (All, Today, Overdue), + FAB button
- Task list: FlatList of tasks grouped by section (Overdue, Today, This Week)
- Each task row: checkbox (Pressable), name, assignee chip, due date badge
- Swipe right to complete (using react-native-gesture-handler, which is already installed)
- Pull to refresh

Use @repo/native-ui components (Card, Text, Button, Container) and @repo/design-tokens for colours.

## File 2: `apps/native/app/task-detail/[id].tsx`

Task detail screen (Stack.Screen, not tab). Shows full task info with edit capability:
- Name (editable inline)
- Description
- Status (segmented control)
- Assigned to (avatar toggle)
- Due date (DateTimePicker)
- Project/Phase info if linked
- Delete button

## File 3: `apps/native/app/create-task.tsx`

Modal screen for creating a task. Form with: name input, assigned_to toggle, priority pills, due date picker, project selector (if any projects exist). Uses @repo/logic createTaskSchema for validation.

## File 4: `apps/native/components/tasks/TaskRow.tsx`

Reusable task row component used in the FlatList. Handles swipe-to-complete gesture.

## File 5: Update `apps/native/app/_layout.tsx`

Add new Stack.Screen entries for task-detail/[id] and create-task.

Fetch data from the same API routes using TanStack Query (which is already configured in the native app via QueryProvider). Use the same query key patterns as web.

Output all 5 complete files.
```

### Phase 1 Verification Checklist

- [ ] `pnpm build` succeeds
- [ ] Migration applies cleanly
- [ ] Web: `/dashboard/tasks` loads with list and kanban views
- [ ] Web: Can create a task via dialog
- [ ] Web: Can drag tasks between kanban columns
- [ ] Web: `/dashboard/tasks/projects` shows project list
- [ ] Web: Project detail page shows phases and tasks
- [ ] Web: Weekly Reset ceremony flows through all 5 steps
- [ ] Native: Tasks tab shows task list
- [ ] Native: Can create and complete tasks
- [ ] Activity feed entries appear when tasks are created/completed
- [ ] Tasks module enabled in module registry (`isEnabled: true`)

---

## Phases 2–7: Prompt Structure Guide

The remaining phases follow the same prompt pattern. For each phase:

### Prompt Sequence Template

| # | Prompt | What it creates |
|---|--------|----------------|
| X.1 | Database migration | New tables, enums, RLS, indexes |
| X.2 | Shared logic (packages/logic) | Zod schemas, business rules, calculations |
| X.3 | Web API routes | CRUD endpoints following existing patterns |
| X.4 | TanStack Query hooks | Data fetching and mutations |
| X.5 | Web pages & components | Main module screens |
| X.6 | Web ceremony/special flows | Guided experiences (if applicable) |
| X.7 | Native screens | Expo screens and components |
| X.8 | Cross-module integration | Auto-task generation, calendar events, etc. |
| X.9 | Smart cards & feed | Home screen integration for this module |

### Phase 2: Shared Calendar

Key prompts:
- 2.1: `events` table migration with recurrence_rule (TEXT for iCal RRULE), source_module, source_entity_id
- 2.2: Logic — RRULE parsing (use `rrule` npm package), auto-event generation from money (payday dates) and tasks (due dates)
- 2.5: Calendar views — month (grid), week (timeline), day (list). Use existing date-fns for date math.
- 2.8: Cross-module — seeds create payment-due calendar events, tasks create due-date events

### Phase 3: Meals & Groceries

Key prompts:
- 3.1: `recipes`, `meal_plan_entries`, `grocery_items` tables
- 3.2: Logic — ingredient aggregation (combine "200g chicken" + "150g chicken" = "350g chicken"), grocery list generation from meal plan
- 3.4: Real-time grocery list sync — enable Supabase Realtime on grocery_items channel scoped to household_id
- 3.6: Meal Ritual ceremony — plan → generate list → assign shopping task (creates task via cross-module)

### Phase 4: Holidays & Trip Planning

Key prompts:
- 4.1: `trips`, `itinerary_entries`, `trip_budget_items`, `packing_items` tables. Trip links to project (for tasks) and pot (for savings)
- 4.2: Logic — trip budget calculator, packing list templates (beach, city, skiing, etc.)
- 4.5: Trip detail page — itinerary timeline, budget breakdown with category pie chart (use existing recharts dependency), packing checklists per person
- 4.8: Cross-module — trip creation auto-creates pot + project, payment due dates create calendar events + tasks, packing items available offline (AsyncStorage in native)

### Phase 5: Vault

Key prompts:
- 5.1: `vault_items`, `emergency_contacts` tables. Supabase Storage bucket for file uploads.
- 5.2: Logic — category system with pre-defined categories and suggested items, expiry date tracking
- 5.5: Vault screens — category grid with completion indicators, item detail with file preview, emergency card view
- 5.7: Native — camera capture for document scanning (expo-camera + expo-image-picker)

### Phase 6: Home Maintenance

Key prompts:
- 6.1: `property_profiles`, `maintenance_items`, `contractors` tables
- 6.2: Logic — seasonal checklist generator based on property type, maintenance escalation (task → project)
- 6.6: Quarterly Health Check ceremony
- 6.8: Cross-module — maintenance costs link to seeds, due dates to calendar, contractors to vault

### Phase 7: Kids

Key prompts:
- 7.1: `child_profiles`, `child_activities`, `school_events`, `growth_entries` tables
- 7.2: Logic — childcare rota generator, activity cost calculator
- 7.5: Kid dashboard, school calendar with iCal import, activity timetable
- 7.8: Cross-module — activity costs to seeds, school events to calendar, transport to tasks, documents to vault

---

## Cross-Module Integration Prompts

After each module is built, run these integration prompts:

### Integration Prompt: Smart Cards

```
Update the home screen smart card logic to include triggers from the [MODULE_NAME] module.

File to update: `apps/web/components/home/home-feed-client.tsx`

Add a new smart card condition:
- [Describe the trigger condition and what the card should say]
- Card uses module colour from @repo/logic registry for [module_id]
- Card links to [destination route]

Also update the server component `apps/web/app/dashboard/home/page.tsx` to fetch the data needed for this smart card condition.

Output both complete updated files.
```

### Integration Prompt: Activity Feed

```
Update the [MODULE_NAME] API routes to create activity feed entries when key actions occur.

Actions to log:
- [List specific actions: "task created", "task completed", etc.]

For each action, call the activity feed POST endpoint or insert directly in the same transaction. Use these fields:
- actor_type: 'user' (for user actions) or 'system' (for auto-generated)
- action: past tense verb ("created", "completed", "added")
- object_name: the entity name
- source_module: '[module_id]'
- source_entity_id: the entity UUID
- action_url: deep link to the entity detail page

Update the relevant route files to include these activity feed insertions.
```

---

## Appendix: File Path Reference

Quick reference for where things live, based on the codebase audit:

```
# Shared logic (both web and native use this)
packages/logic/src/index.ts              # main exports
packages/logic/src/modules/              # module registry, cross-module types
packages/logic/src/tasks/                # tasks schemas, fairness, routine generator
packages/logic/src/notifications/        # notification schemas
packages/logic/src/activity-feed/        # activity feed schemas
packages/logic/src/currency.ts           # existing — currency formatting
packages/logic/src/dashboard-metrics.ts  # existing — budget calculations
packages/logic/src/pay-cycle-dates.ts    # existing — pay cycle date logic

# Web app
apps/web/app/dashboard/home/             # activity feed home page
apps/web/app/dashboard/tasks/            # tasks module pages
apps/web/app/dashboard/tasks/projects/   # projects pages
apps/web/app/dashboard/tasks/weekly-reset/ # ceremony
apps/web/app/api/tasks/                  # task CRUD routes
apps/web/app/api/projects/               # project CRUD routes
apps/web/app/api/routines/               # routine CRUD routes
apps/web/app/api/notifications/          # notification routes
apps/web/app/api/activity-feed/          # feed routes
apps/web/components/home/                # home screen components
apps/web/components/tasks/               # tasks module components
apps/web/components/dashboard/           # sidebar, bottom nav
apps/web/hooks/use-tasks.ts              # TanStack Query hooks

# Native app
apps/native/app/(tabs)/                  # tab screens
apps/native/app/task-detail/[id].tsx     # task detail (stack screen)
apps/native/app/create-task.tsx          # create task modal
apps/native/components/tasks/            # native task components

# Database
supabase/migrations/                     # SQL migrations
packages/supabase/src/database.types.ts  # generated types

# Design tokens
packages/design-tokens/src/tokens.css    # CSS custom properties
packages/design-tokens/src/native.ts     # native theme
packages/ui/tailwind.config.ts           # Tailwind config with module colours
```

---

*End of Implementation Spec — Version 1.0*
