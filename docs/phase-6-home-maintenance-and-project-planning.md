# Phase 6: Home Maintenance & Project Planning (combined plan)

Single plan covering: (1) project planning in the Tasks module (create project, planning workflow, escalation), (2) Phase 6 Home Maintenance (data, logic, UI, ceremonies, cross-module), and (3) maintenance cadence, due-date sync to Calendar/Tasks, suggested timelines, and seasonal Quarterly Health Check.

---

## Current state

**Tasks module (Phase 1):**
- **Data:** `projects`, `project_phases`, `tasks`, `routines` exist with RLS; tasks have `project_id`, `phase_id`, `routine_id`, `linked_module`, `linked_entity_id`.
- **API:** Full CRUD for tasks, projects, phases, routines (`apps/web/app/api/tasks`, `apps/web/app/api/projects`, `apps/web/app/api/routines`).
- **Hooks:** `apps/web/hooks/use-tasks.ts` exposes `useCreateProject`, `useUpdateProject`, `useCreatePhase`, etc.
- **UI gaps:** No "New project" entry point; Projects list empty state only links "Back to Tasks". Project detail supports add phase/add task and pot/repayment links, but no create-project flow or explicit "planning then start" workflow.

**Home Maintenance:** Not implemented. Spec calls for property_profiles, maintenance_items, contractors; seasonal checklist; escalation task→project; Quarterly Health Check; cross-module (seeds, calendar, vault).

**Onboarding:** Home Maintenance Step 2: property type, heating type, outdoor space (feeds seasonal checklist).

---

## 1. Project planning (Tasks)

### 1.1 Create project entry and form

- **Projects list:** Add a primary "New project" button (visible when list is empty). Use existing `useCreateProject()`.
- **Create project dialog/sheet:** Form: name (required), description (optional), start_date, target_end_date, estimated_budget, optional linked_pot_id / linked_repayment_id. On submit → create project → redirect to project detail. Use `createProjectSchema` and `POST /api/projects`.

### 1.2 Planning workflow

- When `project.status === 'planning'`, show clear "Planning" state: add phases, add tasks, optionally link pot/repayment.
- **"Start project" action:** Button/banner on project detail → PATCH status to `active` (optionally set start_date to today if unset).

### 1.3 Escalation from Home Maintenance

- For a task with `linked_module === 'home'` and `linked_entity_id` = maintenance_item, show **"Convert to project"**. API creates project (name from item or user), optional initial phase, links task to project/phase, sets maintenance_item.linked_project_id. Redirect to project detail.

---

## 2. Phase 6: Home Maintenance — data and logic

### 2.1 Database migration

**File:** `supabase/migrations/YYYYMMDD_home_maintenance.sql`

**property_profiles**
- `id` (UUID PK), `household_id` (FK → households, RLS), `property_type` (TEXT: detached, semi_detached, terraced, flat, bungalow), `heating_type` (TEXT: gas_boiler, electric, heat_pump, oil, other), `outdoor_spaces` (TEXT[] or JSONB), `created_at` / `updated_at`. One active profile per household to start.

**maintenance_items**
- `id`, `household_id`, `property_profile_id` (nullable FK), `name`, `description` (optional), `category` (e.g. heating, plumbing, garden, safety, appliance)
- **Cadence (required for due dates and calendar/tasks sync):**
  - `frequency` (TEXT): `one_off` | `weekly` | `fortnightly` | `monthly` | `quarterly` | `biannual` | `annual` | `custom`
  - `interval_months` (INTEGER, nullable): for custom / non-12-month annual (e.g. 12, 24 for boiler)
  - `interval_weeks` (INTEGER, nullable): for custom week-based (e.g. 2 = every 2 weeks)
  - `seasonal_rule` (JSONB, nullable): e.g. `{ "active_in_seasons": ["spring", "summer"], "interval_weeks": 1 }` for "weekly in spring/summer only"; or `{ "active_in_seasons": ["autumn", "spring"] }` for gutter-style twice-yearly
- `last_done_at` (DATE), `next_due_at` (DATE) — source of truth for "when due"; drive Tasks and Calendar
- `estimated_cost` (DECIMAL), `created_at` / `updated_at`
- Optional: `linked_task_id` (FK → tasks), `linked_project_id` (FK → projects) for escalation
- RLS: household_id in (SELECT household_id FROM users WHERE id = auth.uid())
- Indexes: `(household_id, next_due_at)`, `(household_id, category)`

**contractors**
- `id`, `household_id`, `name`, `trade`, `contact_phone`, `contact_email`, `notes`, `created_at` / `updated_at`. RLS same pattern.

### 2.2 Logic package (`packages/logic/src/home/` or `maintenance/`)

- **Zod schemas:** create/update for property_profile, maintenance_item (including frequency, interval_months, interval_weeks, seasonal_rule), contractor.
- **Seasonal checklist generator:** `generateSeasonalChecklist(propertyProfile, season?)` → suggested maintenance items from property type, heating, outdoor space (and season). Rules in a static map (e.g. gas_boiler → annual boiler service, outdoor → gutter clear, etc.).
- **Next-due computation:** `computeNextDueAfterComplete(item, completedDate)` — given frequency + interval_months/interval_weeks + seasonal_rule, compute next `next_due_at`. Handles seasonal rules (e.g. next occurrence in spring/summer only for grass).
- **Suggested cadences:** `getSuggestedCadences(categoryOrTemplateName?, season?)` — returns suggested options by task type and season (e.g. "Boiler service" → 12 or 24 months; "Window cleaning" → monthly; "Grass cutting" → weekly in spring/summer; "Gutter clearing" → autumn + spring). Used to pre-fill or show chips in UI.
- **Season boundaries:** `getSeasonForDate(date)`, `getCurrentSeason()` — e.g. Spring Mar–May, Summer Jun–Aug, Autumn Sep–Nov, Winter Dec–Feb (UK-style default).
- **Escalation:** `createProjectFromMaintenanceItem(maintenanceItem, options?)` → used by API for "Convert to project".

### 2.3 Due dates → Calendar and Tasks (sync behaviour)

- **Tasks:** On create/update of a maintenance item with `next_due_at`, create or update a **task** with `due_date = next_due_at`, `linked_module = 'home'`, `linked_entity_id = maintenance_item.id` so it appears in the Tasks module. When user marks maintenance "Done" (or completes the linked task), call `computeNextDueAfterComplete`, set `next_due_at`, and create/update the task for the next occurrence.
- **Calendar:** When Calendar module exists, create/update a **calendar event** for the due date (e.g. "Boiler service due"). Same source of truth: `maintenance_items.next_due_at`. Define event type/household calendar when Calendar is implemented; Phase 6 can add placeholder or simple integration.
- **Single source of truth:** Maintenance item drives both; if user changes due date on the item, task and calendar event are updated accordingly.

### 2.4 API routes

- Property profile: GET/POST/PATCH (single resource per household).
- Maintenance items: GET/POST, GET/PATCH/DELETE per id; GET supports `?due_before=`, `?category=`, `?frequency=`.
- Contractors: GET/POST, GET/PATCH/DELETE per id.
- **From checklist:** POST that calls seasonal generator and inserts (or returns suggestions for user to confirm).
- **Mark done:** PATCH that sets last_done_at, runs computeNextDueAfterComplete, updates next_due_at and linked task (and calendar when available).
- **Convert to project:** POST maintenance-items/[id]/convert-to-project — creates project/phase, links task, sets linked_project_id; returns project id.

### 2.5 Home Maintenance UI (web)

- **Module:** Enable Home in registry when Phase 6 ships; route group `dashboard/home` (or `dashboard/maintenance`).
- **Property profile:** One screen/dialog: property type, heating, outdoor space (match onboarding).
- **Maintenance list:** Items with due dates, category, "Mark done" (recalc next due). Per-item: Edit, "Convert to project". **Cadence selector on create/edit:** suggested timelines (chips/dropdown) from `getSuggestedCadences` plus custom (interval + optional seasonal_rule). Examples: "Every 12 months", "Every 24 months", "Monthly", "Weekly (spring & summer only)".
- **Contractors:** Simple CRUD list.
- **Quarterly Health Check (seasonal):**
  - **View:** Route e.g. `/dashboard/home/health-check`. "Quarter" = **season** (Spring Mar–May, Summer Jun–Aug, Autumn Sep–Nov, Winter Dec–Feb). Summary: maintenance due this season, overdue, property summary. Suggested seasonal checklist items for current season.
  - **Guided flow:** Optional "Run health check" — steps: due/overdue items, assign/create tasks, optional "Convert to project", suggested cadences for current season (e.g. "Gutter clearing — often autumn and spring"). Summary at end.

### 2.6 Cross-module (Phase 6.8)

- **Maintenance costs → seeds:** "Log cost" when marking done → create seed or deep link to Blueprint. Optional later: `linked_module` / `linked_entity_id` on seeds.
- **Due dates → calendar:** As in 2.3.
- **Contractors → vault:** Optional link to vault document; can be follow-up.

---

## 3. Integration: escalation and project planning

- Task from maintenance: set `linked_module = 'home'`, `linked_entity_id = maintenance_item.id`. Show "Convert to project" in Tasks or Home.
- Convert-to-project: from Home (maintenance item) or Task detail (when task is home-linked). API creates project, links task, sets maintenance_item.linked_project_id; redirect to project detail.
- Standalone "New project" in Tasks: create → project detail in planning → add phases/tasks → "Start project".

---

## 4. Implementation order

| Order | Deliverable |
|-------|-------------|
| 1 | **Project planning (Tasks):** "New project" on Projects list + create project dialog; "Start project" on project detail when status is planning. |
| 2 | **Phase 6.1:** Migration for property_profiles, maintenance_items (with full cadence fields: frequency, interval_months, interval_weeks, seasonal_rule, last_done_at, next_due_at), contractors; RLS; types in packages/supabase. |
| 3 | **Phase 6.2 (logic):** Zod schemas, seasonal checklist generator, `computeNextDueAfterComplete`, `getSuggestedCadences`, season boundaries (`getSeasonForDate`, `getCurrentSeason`), escalation helper. |
| 4 | **Phase 6 API:** Property, maintenance items (CRUD + mark done + next-due recalc), contractors CRUD, from-checklist, convert-to-project. When saving an item with next_due_at, create/update linked task (and later calendar event). |
| 5 | **Phase 6 UI:** Home routes, property profile, maintenance list with cadence selector (suggested + custom), contractor list, "Convert to project". |
| 6 | **Quarterly Health Check:** Seasonal summary view (due this season, overdue) + optional guided flow; suggested cadences in flow; season-aligned (spring/summer/autumn/winter). |
| 7 | **Cross-module:** Maintenance cost → seed/Blueprint; calendar event creation when Calendar exists; vault link for contractors if desired. |

---

## 5. Files to add or touch

- **New:** `supabase/migrations/YYYYMMDD_home_maintenance.sql` (with full cadence columns on maintenance_items).
- **New:** `packages/logic/src/home/` — schemas.ts, seasonal-checklist.ts, next-due.ts (computeNextDueAfterComplete), suggested-cadences.ts (getSuggestedCadences, season helpers), escalation.ts, index.ts.
- **New:** `apps/web/app/api/home/` — property, maintenance-items (incl. mark-done with next-due recalc), contractors, convert-to-project.
- **New:** `apps/web/app/dashboard/home/` — layout, property, maintenance list (with cadence UI), contractors, health-check (view + guided flow).
- **New:** `apps/web/hooks/use-home.ts` — queries/mutations for property, items, contractors.
- **Edit:** `apps/web/components/tasks/projects-list-client.tsx` — "New project" + create dialog.
- **Edit:** `apps/web/components/tasks/project-detail-client.tsx` — "Start project" when status is planning; optional "Converted from Home" when from escalation.
- **Edit:** Task detail/card — "Convert to project" when task has linked_module === 'home'.
- **Edit:** `packages/supabase/src/database.types.ts` — new table types.
- **Edit:** Module registry — Home isEnabled when shipping Phase 6.

---

## 6. Open decisions

- **Naming:** `home` vs `maintenance` in routes and package (module id is `home`).
- **Seeds:** Whether to add linked_module/linked_entity_id to seeds.
- **Calendar:** Exact event type and household calendar id when Calendar module exists.

This is the single combined plan for Phase 6 Home Maintenance and project planning, including cadence, due-date sync to Calendar and Tasks, suggested timelines, and seasonal Quarterly Health Check.
