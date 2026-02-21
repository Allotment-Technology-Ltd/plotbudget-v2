# PLOT Platform — Module Launcher & Onboarding Addendum

> **Version:** 1.0 — February 2026
> **Applies to:** `plot-implementation-spec.md`, `plot-ux-ui-guide.md`
> **Purpose:** This document supersedes the "Activity Feed as Home Screen" approach from the UX guide. The Module Launcher is now the permanent home screen.

---

## Web implementation status (February 2026)

- **Launcher** is implemented at `/dashboard`. Users with a household (owner or partner) see the module grid; no sidebar or bottom nav on this route.
- **Essential setup:** Middleware redirects to `/onboarding` only when the user has no household (and is not a partner). The launcher is shown as soon as they have a household.
- **Money module:** Routes live at `/dashboard/money` (overview) and `/dashboard/money/blueprint`. Account owners must complete Money onboarding (`has_completed_onboarding`) to access these; partners can access when in a household. Legacy `/dashboard/blueprint` redirects to `/dashboard/money/blueprint`.
- **Post-onboarding:** Completing onboarding redirects to `/dashboard/money/blueprint`. PLOT logo / "Dashboard" in nav goes to launcher (`/dashboard`); Money and Blueprint links go to `/dashboard/money` and `/dashboard/money/blueprint`.

---

## Architectural Change Summary

**Before (UX Guide v1):** User logs in → Activity Feed home screen with smart cards → navigates to modules via sidebar/tabs.

**After (this addendum):** User logs in → Module Launcher home screen → taps a module tile to enter it → each module has its own onboarding on first entry. Activity feed is demoted to a component within the launcher, not the primary screen.

This changes the following from the implementation spec:
- Phase 0, Prompt 0.5 (Activity Feed Home Screen) — **replaced** by the Module Launcher prompts below
- Phase 0, Prompt 0.6 (Module Navigation Sidebar) — **modified** to remove Home as a destination and make the PLOT logo / home icon return to the launcher
- Bottom tab bar concept — **replaced**. The launcher IS the top-level navigation. Modules have their own internal navigation.

---

## Part 1: The Module Launcher (Home Screen)

### Concept

The Module Launcher is a grid of module tiles that the user sees every time they open the app. Think of it like a phone's home screen or a gaming console's dashboard — it shows you everything available, what needs attention, and lets you jump into any module with one tap.

Each tile shows:
- Module icon and name
- Status indicator (active, needs attention, coming soon)
- A single-line summary of the most relevant current state ("3 unpaid bills", "5 tasks due today", "Meal plan empty")
- Module accent colour as a subtle visual identifier

The activity feed sits below the module grid as a scrollable "recent activity" section — still useful, but no longer the hero.

### Module States

Each module tile has one of these states:

| State | Visual Treatment | Behaviour on Tap |
|-------|-----------------|------------------|
| **Recommended** | Full colour, pulsing subtle glow, "Get Started" badge | Opens module onboarding ceremony |
| **Active** | Full colour, status summary line visible | Opens module main screen |
| **Available** | Full colour but no summary, "Set Up" badge | Opens module onboarding ceremony |
| **Coming Soon** | 50% opacity, greyed out, "Coming Soon" label | Shows a bottom sheet: module description, "Notify me when available" toggle, illustration |
| **Locked (Pro)** | 50% opacity, lock icon, "Pro" badge | Shows upgrade prompt |

### State Logic

```
for each module:
  if module.isEnabled === false → "Coming Soon"
  if module.isEnabled && module.requiresPro && !user.isPro → "Locked (Pro)"
  if module.isEnabled && !user.hasCompletedModuleOnboarding(module.id) → "Available" (or "Recommended" if it's the suggested next module)
  if module.isEnabled && user.hasCompletedModuleOnboarding(module.id) → "Active"
```

The "Recommended" state is special — only one module at a time can be recommended. Logic:
- If no modules onboarded → Money is recommended
- If Money onboarded but no others → Tasks is recommended
- If Money + Tasks onboarded → Calendar is recommended
- Once 3+ modules active, stop recommending — user knows how it works

### Database Change

Add a `module_activations` table to track which modules each household has onboarded:

```sql
CREATE TABLE public.module_activations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL, -- 'money', 'tasks', 'calendar', etc.
  activated_by UUID REFERENCES auth.users(id),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_data JSONB DEFAULT '{}', -- stores answers from quick setup
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, module_id)
);

ALTER TABLE public.module_activations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own household activations" ON public.module_activations
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can manage own household activations" ON public.module_activations
  FOR ALL USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE INDEX idx_module_activations_household ON public.module_activations(household_id);
```

---

## Part 2: Module Onboarding Ceremonies

Each module has a lightweight "Set 3 Things Up" onboarding that runs once when a user first taps an available module. These follow the ceremony pattern from the UX guide (full-screen, progress dots, interruptible) but are short — 3 steps max, under 2 minutes.

### Onboarding Ceremony Pattern

```
Step 1 — Welcome + Context (10 seconds)
  "Hey [name] 👋 Let's get [module] set up for your household."
  Brief description of what this module does (2 sentences max).
  "This takes about 2 minutes."
  CTA: "Let's do it →"

Step 2 — Set Up 3 Things (60–90 seconds)
  Three quick input actions specific to the module.
  Each is a simple form field or selection — NOT a multi-page wizard.
  Smart defaults pre-filled where possible.
  "Skip" option on each item (nothing is mandatory).
  
Step 3 — Done (5 seconds)
  "All set ✨ [Module] is ready."
  One-line summary of what was set up.
  CTA: "Open [Module] →"
```

**Critical rule:** The onboarding must be skippable entirely. If the user taps "Skip setup" on step 1, mark the module as activated with `onboarding_completed = true` and `onboarding_data = {}`, then drop them into the module with empty states. Never block access to a module behind mandatory onboarding.

### Module-Specific "3 Things" Steps

#### Money (existing — no change)
The current 6-step onboarding remains as-is for Money since it's the foundational module and requires income/pay cycle configuration to function. This is the one exception to the "3 things" pattern. The existing onboarding at `apps/web/app/onboarding/page.tsx` continues to handle this.

When Money onboarding completes, insert a `module_activations` row for `money` with `onboarding_completed = true`.

#### Tasks
```
Step 2 items:
1. "What are 3 chores you do regularly?" — 3 text inputs pre-labelled "e.g., Bins, Hoovering, Weekly shop". Creates routines with weekly frequency and alternating assignment.
2. "Who does more chores currently?" — Slider: "Mostly me ← → Mostly partner". Sets initial fairness baseline context (stored in onboarding_data, not used for calculations).
3. "Do you have any big projects on?" — Optional text input: "e.g., Kitchen renovation, Garden landscaping". Creates a project in planning status if filled.
```

#### Calendar
```
Step 2 items:
1. "What's your typical work pattern?" — Two rows (Me / Partner), each with toggles for Mon–Fri showing "Working" or "Free". Pre-fills weekly availability. Defaults to Mon–Fri working.
2. "Any regular commitments?" — 3 text inputs: "e.g., Football Tuesdays, Yoga Fridays". Creates recurring calendar events.
3. "When's your next holiday or trip?" — Optional date range picker + destination text. Creates a calendar event (and optionally a trip if Holidays module is active).
```

#### Meals
```
Step 2 items:
1. "How many dinners do you cook at home per week?" — Number stepper (default: 5). Sets the meal plan template.
2. "Name 3 meals your household loves." — 3 text inputs: "e.g., Spag bol, Stir fry, Sunday roast". Creates 3 recipe stubs with these names.
3. "Any dietary requirements?" — Multi-select chips: "Vegetarian", "Vegan", "Gluten-free", "Dairy-free", "Halal", "Kosher", "None". Stored as household preference for recipe filtering.
```

#### Holidays
```
Step 2 items:
1. "Got any trips planned?" — Text input for destination + date range picker. Creates a trip in "Planning" status.
2. "What's your holiday budget approach?" — Single select: "Save in advance" (creates a pot link), "Pay as we go" (no pot), "Already saved". 
3. "What kind of holidays do you prefer?" — Multi-select chips: "Beach", "City break", "Adventure", "Road trip", "Staycation", "Ski". Stored as preferences for future template suggestions.
```

#### Vault
```
Step 2 items:
1. "Do you own or rent?" — Single select: "Own (mortgage)", "Own (outright)", "Rent", "Other". Determines which suggested vault categories to show.
2. "Who's your home insurance with?" — Text input + optional renewal date picker. Creates a vault item.
3. "Do you have a will?" — Yes/No toggle. If no, adds "Create a will" as a suggested vault item with gentle prompt.
```

#### Home Maintenance
```
Step 2 items:
1. "What type of home do you have?" — Single select: "Detached house", "Semi-detached", "Terraced", "Flat/apartment", "Bungalow". Determines seasonal checklist items.
2. "What heating do you have?" — Single select: "Gas boiler", "Electric", "Heat pump", "Oil", "Other". Adds relevant maintenance items.
3. "Do you have outdoor space?" — Multi-select: "Front garden", "Back garden", "Garage", "Driveway", "None". Adds relevant maintenance items.
```

#### Kids
```
Step 2 items:
1. "Add your first child" — Name input + date of birth + school name (optional). Creates a child profile.
2. "Any regular activities?" — 3 text inputs with day pickers: "e.g., Football — Tuesdays". Creates recurring activity entries.
3. "Who does school pickup most days?" — Toggle per day Mon–Fri: "Me" / "Partner" / "Alternating" / "N/A". Sets initial childcare rota.
```

---

## Part 3: Updated Navigation Architecture

### How Navigation Now Works

```
PLOT App
│
├── Module Launcher (/ dashboard or / — the home screen, always)
│   ├── Module tiles grid
│   ├── Recent activity feed (collapsed, below grid)
│   └── Notification bell + profile avatar in header
│
├── Money Module (/dashboard/money/...)
│   ├── Overview (current paycycle summary)
│   ├── Blueprint (seed management)
│   ├── Pots & Repayments
│   ├── Payday Ritual (ceremony)
│   └── Settings (percentages, income, pay cycle)
│
├── Tasks Module (/dashboard/tasks/...)
│   ├── My Tasks (list / kanban)
│   ├── Projects
│   ├── Routines
│   ├── Fairness
│   └── Weekly Reset (ceremony)
│
├── Calendar Module (/dashboard/calendar/...)
│   ├── Month / Week / Day views
│   └── Event detail
│
├── (Future modules follow same pattern)
│
└── Settings (/dashboard/settings — global, not per-module)
```

### Within-Module Navigation

Once inside a module, the user sees:
- **Mobile:** A top header with back-to-launcher button (PLOT logo or ← arrow), module title, and module-specific actions. NO bottom tab bar within modules. Navigation between module screens uses standard back/forward stack.
- **Desktop:** A slim left sidebar showing the launcher grid in icon-only mode (for quick module switching) + a module-specific sub-navigation. The main content area shows the current module screen.

### Returning to the Launcher

- **Mobile:** Back button or PLOT logo in the header always returns to the launcher. Swipe-back gesture returns to launcher from any module's root screen.
- **Desktop:** Click PLOT logo in sidebar, or click any module icon in the sidebar's icon strip.

---

## Part 4: Cursor Prompt Addendum

### Replace Phase 0, Prompt 0.5 with this:

```
Create the Module Launcher home screen that replaces the activity feed as the primary dashboard view.

## Database Migration

Create file: `supabase/migrations/20260301100000_module_activations.sql`

Create the `module_activations` table:
- id UUID PK
- household_id UUID FK → households ON DELETE CASCADE
- module_id TEXT NOT NULL
- activated_by UUID FK → auth.users (nullable)
- onboarding_completed BOOLEAN DEFAULT FALSE
- onboarding_data JSONB DEFAULT '{}'
- activated_at TIMESTAMPTZ DEFAULT NOW()
- UNIQUE(household_id, module_id)

Enable RLS with household_id subquery pattern (SELECT, INSERT, UPDATE policies). Add index on household_id.

Update `packages/supabase/src/database.types.ts` to add the ModuleActivation type.

## API Route

Create file: `apps/web/app/api/module-activations/route.ts`

GET: Fetch all module activations for the user's household. Returns array of { module_id, onboarding_completed, activated_at }.
POST: Activate a module. Body: { module_id: string, onboarding_data?: object }. Creates a module_activations row. Also creates an activity feed entry: "[User] activated [Module name]".

Create file: `apps/web/app/api/module-activations/[moduleId]/complete-onboarding/route.ts`

PATCH: Mark onboarding as complete. Body: { onboarding_data: object }. Updates the row.

## Shared Logic

Create file: `packages/logic/src/modules/activation.ts`

Zod schemas:
- `activateModuleSchema` — module_id (must be valid ModuleId), onboarding_data (optional record)
- `completeOnboardingSchema` — onboarding_data (record)

Function: `getRecommendedModule(activations: ModuleActivation[]): ModuleId | null`
- If no activations → return 'money'
- If money activated but not tasks → return 'tasks'  
- If money + tasks but not calendar → return 'calendar'
- If 3+ activated → return null (no recommendation)

Function: `getModuleTileState(module: ModuleDefinition, activation: ModuleActivation | null, isPro: boolean): 'recommended' | 'active' | 'available' | 'coming_soon' | 'locked'`

Export from `packages/logic/src/modules/index.ts`.

## TanStack Query Hooks

Create file: `apps/web/hooks/use-module-activations.ts`

- `useModuleActivations()` — fetches all activations for household
- `useActivateModule()` — mutation, invalidates activations query on success
- `useCompleteModuleOnboarding()` — mutation

## Server Component

Create file: `apps/web/app/dashboard/page.tsx` (this REPLACES the existing dashboard page)

Server component that:
- Authenticates user (same pattern as existing dashboard/page.tsx)
- Fetches: user profile, household, module activations, unread notification count, recent activity feed (last 5 items)
- Passes all data to ModuleLauncherClient
- Redirects to /onboarding if onboarding not complete (preserve existing behaviour)

## Client Component

Create file: `apps/web/components/dashboard/module-launcher.tsx`

Client component ('use client') that renders:

1. Header: "PLOT" logo left, greeting "Hey [display_name]" centre-left, notification bell (with badge) + avatar right.

2. Module grid: 
   - Mobile: 2 columns of module tiles
   - Desktop: 3 or 4 columns
   - Each tile is a card with: module icon (lucide-react), module name (Space Mono, uppercase), status badge, one-line summary if active, module accent colour as left border (4px)
   - Tile tap behaviour depends on state (see Part 1)

3. Recent activity section (below grid):
   - Section header: "RECENT ACTIVITY" in small uppercase monospace
   - Last 5 feed items in compact format (avatar, action text, timestamp)
   - "View all →" link (opens full activity feed as a slide-over or separate page)

4. For "Coming Soon" modules: tapping shows a bottom sheet (Radix Dialog) with module description, illustration placeholder, and a "Notify me" toggle that stores a preference.

Create file: `apps/web/components/dashboard/module-tile.tsx`

Reusable tile component with props: module (ModuleDefinition), state ('recommended' | 'active' | 'available' | 'coming_soon' | 'locked'), summary (string | null), onTap callback.

Visual states:
- Recommended: border-accent glow animation (subtle pulse using framer-motion), "Get Started" green badge top-right
- Active: solid module-colour left border, summary text visible
- Available: module-colour left border, "Set Up" grey badge
- Coming Soon: opacity-50, greyed border, "Coming Soon" badge, cursor-default
- Locked: opacity-50, Lock icon overlay, "Pro" badge

Style with PLOT design system: bg-card, 12px radius, 16px padding. Dark mode support via existing CSS custom properties. Module colours from the design token system.

## Existing Money Module Integration

After creating the launcher, ensure the existing Money onboarding at `apps/web/app/onboarding/page.tsx` ALSO creates a `module_activations` row for 'money' when it completes. Add this to the finalization step of the existing onboarding flow.

For existing users who have already completed onboarding, create a one-time data migration that inserts a `module_activations` row for 'money' with `onboarding_completed = true` for every household that has `has_completed_onboarding = true` on their user record.

Migration file: `supabase/migrations/20260301100001_backfill_money_activation.sql`

```sql
INSERT INTO public.module_activations (household_id, module_id, onboarding_completed, activated_at)
SELECT DISTINCT u.household_id, 'money', true, u.updated_at
FROM public.users u
WHERE u.has_completed_onboarding = true
  AND u.household_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.module_activations ma 
    WHERE ma.household_id = u.household_id AND ma.module_id = 'money'
  );
```

Output ALL complete files.
```

---

### New Prompt 0.5b — Module Onboarding Ceremony Framework

```
Create a reusable module onboarding ceremony framework that each module uses for its "Set 3 Things Up" quick onboarding.

## Shared Component

Create file: `apps/web/components/onboarding/module-onboarding-shell.tsx`

A reusable full-screen ceremony wrapper that any module can use. Props:

```typescript
interface ModuleOnboardingShellProps {
  moduleId: ModuleId;
  moduleName: string;
  moduleDescription: string; // 2 sentences max
  steps: OnboardingStep[];
  onComplete: (data: Record<string, unknown>) => void;
  onSkip: () => void;
}

interface OnboardingStep {
  id: string;
  content: React.ReactNode; // each module provides its own step UI
}
```

The shell handles:
- Full-screen layout (no sidebar, no bottom nav)
- Progress dots at top (● ○ ○ for 3-step flow)
- Greeting step (auto-generated from moduleName + moduleDescription + user's display_name)
- Framer Motion AnimatePresence transitions between steps
- "Skip setup" text button in the greeting step (calls onSkip)
- "Skip" option on each item within steps
- Final "All set ✨" completion step (auto-generated)
- X button top-right to exit (calls onSkip, marks as complete with whatever data gathered so far)
- Mobile-first, responsive, dark mode support
- WCAG 2.2 AA: focus management between steps, aria-live for progress announcements

Style: same ceremony pattern as existing Payday Ritual — Space Mono for step titles, Inter for body, generous whitespace, green accent CTA button.

## Tasks Onboarding

Create file: `apps/web/components/onboarding/tasks-onboarding.tsx`

Implements the 3-step content for Tasks module onboarding:

Step content (rendered inside the shell's step slots):

1. Three text inputs stacked vertically, each with a label "Regular chore [1/2/3]" and placeholder examples ("e.g., Take bins out", "e.g., Hoover downstairs", "e.g., Weekly food shop"). Each input has a small "Skip" text link.

2. A horizontal slider with labels: "I do most chores" on the left, "We split evenly" in centre, "Partner does most" on the right. Default: centre. Small helper text: "This is just for context — you'll track the real balance over time."

3. Optional text input: "Any big household projects going on?" with placeholder "e.g., Kitchen renovation". Small helper: "We'll create a project board for this." Has a clear "Skip — I'll add one later" link.

On complete: calls the module activation API with onboarding_data containing { routines: string[], fairnessBaseline: number, initialProject: string | null }. Then calls the relevant APIs to create the routine records and optional project.

## Meals Onboarding

Create file: `apps/web/components/onboarding/meals-onboarding.tsx`

Step content:

1. Number stepper labelled "How many dinners do you cook at home each week?" with - and + buttons. Range 1–7, default 5.

2. Three text inputs: "Name 3 meals your household loves" with placeholders ("e.g., Spaghetti bolognese", "e.g., Chicken stir fry", "e.g., Sunday roast").

3. Multi-select chip group: "Any dietary requirements?" Chips: Vegetarian, Vegan, Gluten-free, Dairy-free, Nut-free, Halal, Kosher, None. "None" is default selected and deselects others when tapped (and vice versa).

On complete: creates recipe stubs and stores preferences.

## Calendar Onboarding

Create file: `apps/web/components/onboarding/calendar-onboarding.tsx`

Step content:

1. Two rows labelled "My work days" and "Partner's work days". Each row has 7 small day buttons (M T W T F S S). Tapping toggles between filled (working) and outline (free). Default: Mon–Fri filled for both.

2. Three inputs, each with a text field ("What?") and a day dropdown ("When? — Monday/Tuesday/etc"). Label: "Any regular weekly commitments?". Placeholders: "e.g., Five-a-side football", "e.g., Yoga class".

3. Optional: "Next holiday or time off?" — Date range picker (start + end) and text input for label. Helper: "We'll add this to your shared calendar."

## Routing

Create file: `apps/web/app/dashboard/setup/[moduleId]/page.tsx`

Dynamic route that:
- Validates moduleId is a real ModuleId from the registry
- Checks if module is enabled and not already onboarded
- If already onboarded, redirect to the module's main page
- If not enabled, redirect to dashboard
- Otherwise, renders the appropriate onboarding component inside the ModuleOnboardingShell

The module tile's "Get Started" / "Set Up" tap navigates to `/dashboard/setup/[moduleId]`.

On completion, the component calls useCompleteModuleOnboarding, then uses router.push to navigate to the module's main screen.

Output ALL complete files: shell component, tasks onboarding, meals onboarding, calendar onboarding, dynamic route page.
```

---

### Modify Phase 0, Prompt 0.6 (Navigation) — replace with:

```
Update the dashboard layout to support the new Module Launcher architecture.

## File: Update `apps/web/app/dashboard/layout.tsx`

The dashboard layout now needs to handle two contexts:
1. The Module Launcher (the home screen at /dashboard)
2. Individual modules (at /dashboard/money/..., /dashboard/tasks/..., etc.)
3. Module onboarding ceremonies (at /dashboard/setup/[moduleId])

Layout structure:

For the Module Launcher (/dashboard root):
- No sidebar, no bottom nav. Full-width content. Just the launcher grid.
- Header with PLOT logo, greeting, notifications, avatar.

For module screens (/dashboard/money/*, /dashboard/tasks/*, etc.):
- Desktop: Slim left sidebar with PLOT logo at top (links to /dashboard), icon-only module strip (showing activated modules as small icons, tappable to switch modules), and settings gear at bottom. Main content area fills remaining width.
- Mobile: Top header bar with PLOT logo (links to /dashboard), module title, module-specific action buttons. No bottom tab bar. Standard back navigation.

For onboarding ceremonies (/dashboard/setup/*):
- Full-screen, no navigation chrome at all. Ceremony handles its own exit.

## Implementation

Detect which context we're in by checking the current pathname in the layout:
- pathname === '/dashboard' → launcher layout
- pathname.startsWith('/dashboard/setup/') → ceremony layout (just {children}, no nav)
- anything else → module layout with sidebar/header

## File: `apps/web/components/dashboard/module-sidebar.tsx`

Desktop sidebar (visible at md+ breakpoint) for when user is inside a module:
- Width: 64px (icon-only by default)
- Top: PLOT logo (links to /dashboard — the launcher)
- Middle: Vertical stack of module icons for all ACTIVATED modules. Each icon uses the module's accent colour when active (current module). Others are muted. Tapping switches to that module's root screen.
- Bottom: Settings gear icon

## File: `apps/web/components/dashboard/module-header.tsx`

Mobile header for when user is inside a module:
- Left: PLOT logo or back arrow (links to /dashboard)
- Centre: Module name
- Right: Module-specific action (e.g., "+" for tasks, filter icon for calendar)

This replaces the old DashboardHeaderNavClient and DashboardFooterClient components.

## Route Group Changes

The existing routes need to be reorganised:
- `/dashboard` → Module Launcher (already exists, replace page content)
- `/dashboard/blueprint` → move to `/dashboard/money/blueprint`
- `/dashboard/settings` → stays (global settings)
- New: `/dashboard/money` → Money module overview
- New: `/dashboard/tasks` → Tasks module root
- New: `/dashboard/calendar` → Calendar module root
- New: `/dashboard/setup/[moduleId]` → Module onboarding

For now, create redirects from old routes to new ones so existing bookmarks don't break:
- `/dashboard/blueprint` → redirect to `/dashboard/money/blueprint`

Preserve ALL existing auth checks and data fetching from the current dashboard layout. Just restructure the visual chrome around the children.

Output ALL complete files.
```

---

### Additional Figma Make Wireframe Prompts

Add these to the wireframe prompts document:

```
## Section 0: Module Launcher & Onboarding (NEW — add before Section 1)

### 0.1 — Module Launcher (Money Only Phase)

Create a lo-fi mobile wireframe for a household app's main home screen showing a module launcher grid.

Layout from top to bottom:
- Top bar: "PLOT" logo in monospace on the left. "Hey Adam" greeting text next to it. On the right: a notification bell icon with a small red "2" badge, and a circular user avatar.
- Below the top bar, generous whitespace, then a section label: "YOUR MODULES" in small uppercase monospace.
- Module grid (2 columns):
  - Card 1 (RECOMMENDED — prominent): Full-colour card with green left border (4px), pound sterling icon at top-left, "MONEY" label in monospace below the icon, "Get Started" in a small green badge at the top-right of the card. The card has a subtle pulsing glow effect indicated by a slightly thicker border or shadow.
  - Card 2 (COMING SOON): Greyed-out card at 50% opacity, checkmark icon, "TASKS" label, "Coming Soon" in a small grey badge. 
  - Card 3 (COMING SOON): Greyed-out, calendar icon, "CALENDAR", "Coming Soon" badge.
  - Card 4 (COMING SOON): Greyed-out, fork/knife icon, "MEALS", "Coming Soon" badge.
  - Card 5 (COMING SOON): Greyed-out, aeroplane icon, "HOLIDAYS", "Coming Soon" badge.
  - Card 6 (COMING SOON): Greyed-out, folder icon, "VAULT", "Coming Soon" badge.
- Below the grid: "RECENT ACTIVITY" section header.
  - A subtle placeholder message: "Activity will appear here as you use PLOT."
- No bottom tab bar. This IS the home screen.

Each module tile is approximately 160px × 120px with 12px rounded corners, 16px internal padding.


### 0.2 — Module Launcher (Multiple Modules Active)

Create a lo-fi mobile wireframe showing the same module launcher but with several modules active and in use.

Same layout as 0.1 but different tile states:
- Card 1 (ACTIVE): Green left border, pound icon, "MONEY", summary line below: "3 unpaid bills · Ritual in 5 days". No badge — full colour, clearly active.
- Card 2 (ACTIVE): Blue left border, checkmark icon, "TASKS", summary: "5 tasks due today · 2 overdue". Full colour.
- Card 3 (ACTIVE): Purple left border, calendar icon, "CALENDAR", summary: "Dentist at 2pm". Full colour.
- Card 4 (AVAILABLE — recommended): Orange left border, fork/knife icon, "MEALS", "Set Up" badge in orange. Full colour but no summary. Subtle glow indicating this is the recommended next module.
- Card 5 (COMING SOON): Greyed-out, aeroplane, "HOLIDAYS", "Coming Soon".
- Card 6 (COMING SOON): Greyed-out, folder, "VAULT", "Coming Soon".
- Card 7 (COMING SOON): Greyed-out, house, "HOME", "Coming Soon".
- Card 8 (COMING SOON): Greyed-out, baby/child icon, "KIDS", "Coming Soon".

Below the grid: "RECENT ACTIVITY" section with 3 compact feed items:
- "Adam completed Clean bathroom" — 2h ago
- "Sarah added Chicken Stir Fry to Wednesday" — 5h ago
- "Payday Ritual completed for March" — yesterday

"View all →" link at the bottom of the activity section.


### 0.3 — Coming Soon Bottom Sheet

Create a lo-fi mobile wireframe showing a bottom sheet overlay that appears when tapping a "Coming Soon" module tile.

Background: Dimmed module launcher behind.

Bottom sheet (50% height) with:
- Drag handle at top.
- Module icon (aeroplane) and "HOLIDAYS" title in monospace, centred.
- Module colour accent (teal) as a thin line or subtle background tint.
- Description: "Plan trips together. Budgets, itineraries, packing lists — all linked to your money and tasks." (2 sentences, centre-aligned)
- A simple illustration placeholder: grey rounded rectangle with a small palm tree icon (64px).
- Below: A toggle row: "Notify me when available" with a switch toggle (default ON).
- At the very bottom: "Close" text button.


### 0.4 — Module Onboarding: Tasks (Greeting Step)

Create a lo-fi mobile wireframe for the greeting step of a module onboarding flow. Full-screen, no navigation chrome.

Layout:
- Top-left: Small "X" close button.
- Top-centre: Three small progress dots (● ○ ○).
- Large whitespace.
- Module icon (checkmark in a square) with blue accent colour, centred, 48px.
- Large greeting text, left-aligned:
  "Let's set up Tasks 📋"
  (line break)
  "Track chores, manage projects, and share the load fairly."
  (line break, smaller secondary text)
  "This takes about 2 minutes."
- Large whitespace.
- At the bottom: Full-width green button "Let's do it →".
- Below the button: "Skip setup" as a small text link, centred, muted colour.


### 0.5 — Module Onboarding: Tasks (Set 3 Things Step)

Create a lo-fi mobile wireframe for the main setup step of a tasks module onboarding. Full-screen.

Top: "X" close, progress dots (● ● ○).
Step title: "Your Regular Chores" in bold.

Three input rows stacked vertically, each with:
- A number label: "1.", "2.", "3."
- A text input field with placeholder text: "e.g., Take bins out", "e.g., Hoover downstairs", "e.g., Weekly food shop".
- A small "Skip" text link to the right of each input.

Below the inputs, a horizontal divider line.

Next section: "Effort Balance" label.
- A horizontal slider with three labels underneath: "I do most" (left), "We split evenly" (centre tick mark), "Partner does most" (right).
- Small helper text: "Just for context — you'll track the real balance over time."

Below: Another divider.

Optional section: "Any big projects?"
- Single text input with placeholder "e.g., Kitchen renovation".
- Helper: "We'll create a project board for this."
- "Skip — I'll add later" text link.

At the bottom: Full-width green button "Finish Setup →".


### 0.6 — Module Onboarding: Completion

Create a lo-fi mobile wireframe for the completion step of any module onboarding. Full-screen.

Top: Progress dots — all filled (● ● ●).

Centre of screen:
- Sparkle/checkmark icon (48px) in the module's accent colour (blue for Tasks).
- "All set ✨" in large bold text.
- Below: "Tasks is ready for your household." in smaller text.

Summary card below:
- "Created:"
- "3 weekly routines"
- "1 project: Kitchen Renovation"
- "Fairness tracking: On"

Large whitespace.

Bottom: Full-width green button "Open Tasks →".
```

---

## Part 5: Impact on Other Documents

### Changes to `plot-ux-ui-guide.md`

The following sections should be considered superseded by this addendum:
- Part 2 (Information Architecture) — bottom tab bar concept is removed. Module Launcher replaces it.
- Part 3.1 (Home Screen spec) — activity feed is no longer the home screen. Module Launcher is.
- Part 6 (Screen Flow: App Launch) — now goes: Auth check → Onboarding check → Module Launcher → User taps module → Module onboarding (if first time) → Module screen.

Everything else in the UX guide remains valid — component specs, ceremony patterns, accessibility requirements, visual design specs, and individual module screen designs.

### Changes to `plot-implementation-spec.md`

- Phase 0, Prompt 0.5 → replaced by this addendum's launcher prompt
- Phase 0, Prompt 0.6 → replaced by this addendum's navigation prompt
- Phase 0, Prompt 0.7 (Native bottom tab bar) → needs updating to show module launcher instead of 5-tab bar. Write a similar native prompt using the module grid pattern.
- All Phase 1–7 prompts → each module's first prompt should include: "Also create the module onboarding component at `apps/web/components/onboarding/[module]-onboarding.tsx` following the pattern established in the Tasks onboarding."

### Changes to `plot-gtm-strategy.md`

No changes needed. The strategy already assumes sequential module rollout and founding member model. The launcher makes the "coming soon" modules visible to users, which actually helps with demand validation — you can see which "Notify me" toggles get the most engagement.

---

*End of Module Launcher & Onboarding Addendum — Version 1.0*
