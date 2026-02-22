# Phase 4: Holidays & Trip Planning — Merged Implementation Spec

> Single reference for Phase 4 development.  
> **Last amended:** 2026-02-22 — integrations deferred to Phase 4b (standalone doc); Restormel security, PLOT principles, and Nielsen heuristics applied throughout; migration timestamp corrected; module pre-registration noted; performance guidance added.

---

## How to use this document

1. Paste the **Phase 4 Context Block** into Cursor at the start of a Phase 4 session.
2. Execute prompts **4.1 through 4.9** in order (details below).
3. Run the **Verification checklist** after each prompt and at phase end.
4. **Phase 4b** (all third-party travel, gig, and dining integrations) is a separate project — see `docs/phase-4b-integrations-plan.md`.

---

## Phase 4 Context Block

Paste this into Cursor at the start of Phase 4 work:

```
# CONTEXT: PLOT Platform Expansion — Phase 4 (Holidays & Trip Planning)

## What we're building
The Holidays module lets households manage trips end-to-end: create a trip, link a savings pot and a task project, build an itinerary (flights, accommodation, activities, dining — entered manually), track budget by category, manage packing lists, and sync key dates to Calendar and Tasks. Third-party travel search and gig/ticket integrations are Phase 4b (see `docs/phase-4b-integrations-plan.md`).

## What exists from earlier phases
- Phase 0: notifications, activity_feed, module registry, cross-module types, nav, design tokens.
- Phase 1: projects, tasks, routines, pots/repayments links, use-tasks hooks, API patterns.
- Phase 2: events table (source_module, source_entity_id) for calendar.
- Money: pots, seeds, blueprint.
- DB: households, users, pots, projects, events, tasks.
- **Module registry:** `packages/logic/src/modules/registry.ts` already defines the holidays module (`id: 'holidays'`, icon: Plane, `colorLight: '#0D9488'`, `colorDark: '#5EEAD4'`, `isEnabled: false`). No registry changes needed until the module ships — flip `isEnabled: true` in Prompt 4.9.

## Architecture rules (Restormel — Zero Tolerance)
- **Zero Trust:** Validate all API input with Zod server-side. Every schema field must include a custom human-readable error message (e.g. `z.string().min(1, 'Trip name is required')`). Never trust client input.
- **Server First:** Default to React Server Components. Only add `'use client'` where interactivity is required.
- **No Leaks:** Never import server-only modules (DB, secrets, Supabase service role) into Client Components.
- **Strict Types:** No `any`. No `// @ts-ignore`. Fix the logic if types fail.
- **No `dangerouslySetInnerHTML`.**
- **Security audit on every route:** injection-proof, session-checked, no over-fetching (SELECT only needed columns), no secrets in response bodies.
- Logic and Zod schemas in `packages/logic/src/holidays/`.
- All new tables: RLS with `household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())`.
- Module colour for holidays: #0D9488 (light) / #5EEAD4 (dark).

## PLOT principles applied to Holidays
- **Labor Equity:** All trips and itinerary entries are visible to both household members by default. No per-user ownership — the household owns all trips.
- **User Autonomy:** Show budget workings (planned per category, actual per category, difference). Never hide the maths behind a single total.
- **Constraint as Kindness:** Resist adding options. One clear way to add an itinerary entry. Packing templates are suggestions, not requirements. Advanced fields (booking_ref, booking_url) collapsed by default.
- **Time Respect:** Optimistic UI updates throughout (packing toggles, budget edits). No loading spinners on interactions. Native packing list available offline immediately.
- **Reality over Aspiration:** Error messages are plain and honest. No motivational copy ("You're almost packed! 🎉" → use "5 items remaining").

## Holidays data model

### Tables
- trips — id, household_id, name, destination, start_date, end_date, status, linked_pot_id (FK pots), linked_project_id (FK projects), currency, notes, cover_image_url, created_at, updated_at
- itinerary_entries — id, trip_id, household_id, date, title, description, start_time, end_time, entry_type (travel|accommodation|activity|dining|other), booking_ref, booking_url, cost_amount, cost_currency, sort_order, created_at, updated_at
- trip_budget_items — id, trip_id, household_id, category (flights|accommodation|car_rental|activities|food|transport|other), name, planned_amount, actual_amount, currency, booking_ref, itinerary_entry_id (nullable FK → itinerary_entries ON DELETE SET NULL — budget items remain when an itinerary entry is removed), created_at, updated_at
- packing_items — id, trip_id, household_id, category, name, is_packed, assignee (me|partner|shared), sort_order, created_at, updated_at

### Trip status
draft | planning | booked | in_progress | completed | cancelled

### Cross-module
- Trip → Pot (linked_pot_id), Trip → Project (linked_project_id)
- Itinerary/budget due dates → create events (source_module 'holidays') and optionally tasks (linked_module 'holidays')
```

---

## Prompt sequence

### 4.1 — Database migration: Holidays tables

- **File:** `supabase/migrations/20260340000000_holidays_module.sql` *(sequence after the latest meals migrations at 20260334)*
- Create tables: `trips`, `itinerary_entries`, `trip_budget_items`, `packing_items` with CHECK/enums for status, entry_type, budget category, assignee.
- `trips` columns include: `cover_image_url TEXT` (external URL, not uploaded; nullable).
- RLS on all four; indexes: trips(household_id, status), itinerary_entries(trip_id, date), trip_budget_items(trip_id), packing_items(trip_id).
- `updated_at` triggers (follow the pattern from `20260310000000_tasks_module.sql`).
- After applying the migration locally, regenerate types:
  ```
  pnpm supabase gen types typescript --local > packages/supabase/src/database.types.ts
  ```

### 4.2 — Shared logic: Holidays schemas and business rules

- **Location:** `packages/logic/src/holidays/`
- **schemas.ts:** Zod create/update schemas for trip, itinerary entry, trip budget item, and packing item; infer TypeScript types. Follow the pattern in `packages/logic/src/tasks/schemas.ts` and `packages/logic/src/meals/schemas.ts`. **Every field must include a custom human-readable error message** per Restormel rules (e.g. `z.string().min(1, 'Trip name is required').max(200, 'Trip name must be under 200 characters')`). No `any` types.
- **trip-budget-calculator.ts:** Pure function — no I/O. Takes `TripBudgetItem[]` and returns per-category totals (planned, actual, difference) and overall totals. Expose the full breakdown so the UI can display workings, not just the final sum (User Autonomy principle).
- **packing-templates.ts:** Predefined templates (beach, city, skiing, winter-city, camping, business); `getPackingTemplate(id)`. Each template returns a minimal list of `{ name, category }` items (≤ 20 items per template — Constraint as Kindness).
- **`packages/logic/src/index.ts`:** Add `export * from './holidays';` alongside the existing module exports.

### 4.3 — Web API routes: Trips CRUD

All routes follow the Restormel Fortress pattern: authenticate first (`supabase.auth.getUser()`; return 401 if no session), validate with Zod (`safeParse`; return 400 with `errors.flatten().fieldErrors`), try/catch all DB operations (return a reference ID error, never a stack trace), SELECT only needed columns.

- **`GET/POST /api/trips`** — list trips for the household; create a trip.
- **`GET/PATCH/DELETE /api/trips/[id]`** — get, update, or delete a single trip. RLS enforces household scoping; the route should also verify ownership explicitly to fail fast and return a clear 403.
- **Nested routes:**
  - `GET/POST /api/trips/[id]/itinerary`, `PATCH/DELETE /api/trips/[id]/itinerary/[entryId]`
  - `GET/POST /api/trips/[id]/budget`, `PATCH/DELETE /api/trips/[id]/budget/[itemId]`
  - `GET/POST /api/trips/[id]/packing` (POST accepts `?template=beach` to seed from a packing template), `PATCH/DELETE /api/trips/[id]/packing/[itemId]`
- Travel/gig search endpoints are **Phase 4b only** — do not add them here.

### 4.4 — TanStack Query hooks

- **File:** `apps/web/hooks/use-trips.ts`
- Queries: `useTrips`, `useTrip`, `useTripItinerary`, `useTripBudget`, `useTripPacking`. Follow the same patterns as `use-tasks.ts`.
- Mutations: create/update/delete trip, itinerary entry, budget item, packing item; `useApplyPackingTemplate`. No travel/gig search mutations in Phase 4 — those are Phase 4b.
- **Performance:** Set `staleTime: 60_000` on trip queries (trip data changes infrequently). Use **optimistic updates** for `isPackedToggle` so the checkbox feels instant (Time Respect). Invalidate only the narrowest query key after each mutation (e.g. `['trip-packing', tripId]`, not all trips).

### 4.5 — Web pages and components

- **List:** `apps/web/app/dashboard/holidays/page.tsx` — RSC; fetch trips server-side. Trip cards show status, destination, dates, pot progress if linked. "Add trip" button. Paginate at 20 trips per page.
- **Layout:** `apps/web/app/dashboard/holidays/layout.tsx` — header "Holidays", module colour `#0D9488`.
- **Detail:** `apps/web/app/dashboard/holidays/[id]/page.tsx` — RSC; load trip + itinerary + budget + packing via parallel `await`s (not sequential). Pass data to client components.
  - Itinerary timeline: client component, sorted by date then `sort_order`.
  - Budget breakdown: **lazy-load Recharts** with `next/dynamic({ ssr: false })` (bundle is large, detail-page only). Show the per-category table (planned / actual / difference) alongside the chart — never hide the workings (User Autonomy).
  - Packing checklists: optimistic toggle on `is_packed` — no spinner, instant feedback (Time Respect / Nielsen #1 Visibility of Status).
  - Linked pot progress and linked project name displayed; no hidden data.
  - `cover_image_url`: `next/image` with explicit `width`/`height` (or `fill` + sized wrapper) to prevent layout shift.
- **Create/edit trip dialog** (not a separate page — avoids a full navigation round-trip):
  - React Hook Form + Zod resolver using the schema from Prompt 4.2.
  - Follow the Restormel error-friendly form pattern: required-field markers, inline field errors with `aria-invalid` + `aria-describedby`, error summary count at top, submit disabled while `hasErrors`.
  - Required fields: name, destination, start date, end date. All other fields optional and collapsed under "More options" (Constraint as Kindness).
- **Delete trip:** confirmation dialog stating the trip name and consequence ("This will permanently delete [Trip Name] and all its itinerary, budget, and packing data."). Toast notification after deletion with an undo action for 5 seconds (Nielsen #3 User Control + #10 Error Recovery).
- Error boundary around the budget chart; if it fails, show a static table instead.

### 4.6 — Optional: "Plan a trip" flow

- Short wizard (2–3 steps, not a full page per step): name + destination + dates → link pot / create project → apply packing template → land on trip detail. Keep the form minimal; do not block trip creation on optional steps (pot/project linking can be done later from the detail page).
- Reuse the create trip dialog from Prompt 4.5 for step 1; pop additional panels inline.

### 4.7 — Native screens

- Holidays entry from "More" tab (or dedicated tab when `tabBar: true`). Follow the existing native navigation pattern.
- **Trips list:** `FlatList` with `keyExtractor`, `initialNumToRender={10}`, and `windowSize={5}` to keep memory low on long lists.
- **Trip detail:** itinerary, budget summary, packing checklist. Load itinerary and packing in parallel (two separate queries fired together, not sequentially).
- **Packing list offline sync:**
  1. On load: read from AsyncStorage first (instant render), then fetch from Supabase in the background and merge (Supabase wins on conflicts — it is the source of truth).
  2. On toggle: write to AsyncStorage immediately (optimistic), then sync to Supabase. If offline, append the change to a queue in AsyncStorage.
  3. On reconnect (`NetInfo.addEventListener`): flush the queue by replaying changes in order. Deduplicate consecutive toggles to the same `itemId` (keep only the last state). After a successful sync, clear the queue and refresh from Supabase to reconcile any server-side changes made by the partner.
  4. Use a simple `{ tripId, items: [...], updatedAt }` shape for cached state and a `{ tripId, queue: [{ itemId, is_packed, timestamp }] }` shape for the pending queue — no per-item AsyncStorage keys.
- **Create trip:** modal/bottom sheet. Mirror the web dialog fields. Keep the form to the essentials (name, destination, dates); pot/project linking is optional and can be done from detail.
- Avoid heavy imports in native screens; do not import Recharts or any web-only library.

### 4.8 — Cross-module integration

- On trip create (or "Link pot"): create/select pot, set `trip.linked_pot_id`.
- On trip create (or "Link project"): create/select project, set `trip.linked_project_id`; optionally create initial tasks (e.g. "Book flights", "Book accommodation") with `linked_module: 'holidays'`.
- Payment/due dates from itinerary or budget items → create event (`source_module: 'holidays'`, `source_entity_id`); optionally create a task (`linked_module: 'holidays'`). Always confirm with the user before creating tasks — no silent automation (User Autonomy).
- Native packing: queue changes to AsyncStorage when offline; flush to Supabase on reconnect.

### 4.9 — Smart cards, activity feed, and module enable

- **Smart cards:** "Trip coming up in 7 days" and "Trip savings at X%" (linked pot nearing target). Link to `/dashboard/holidays/[id]`. Use module colour from registry. Copy must be plain and factual — no motivational language (Reality over Aspiration).
- **Activity feed:** On trip create, itinerary entry add, and packing list fully packed — insert activity feed entry with `source_module: 'holidays'` and `action_url` linking to the trip.
- **Enable module:** In `packages/logic/src/modules/registry.ts`, flip `holidays.isEnabled` to `true`. The module metadata (colour, icon, navOrder) is already correct — no other registry changes needed.

---

## Verification checklist (Phase 4)

### Security (Restormel)
- [ ] Every API route: authenticated (`getUser()` check), Zod-validated input, try/catch, no stack traces in responses.
- [ ] No API keys, Supabase service role, or secrets in any client bundle or response body.
- [ ] All Zod schema fields have custom human-readable error messages.
- [ ] No `any` types, no `@ts-ignore`, no `dangerouslySetInnerHTML`.
- [ ] RLS applied to all four new tables; manually verified in Supabase dashboard.
- [ ] `database.types.ts` regenerated after migration (`pnpm supabase gen types typescript --local > packages/supabase/src/database.types.ts`).

### Functionality
- [ ] Migration applies cleanly; RLS policies and type-generation verified.
- [ ] Trips CRUD works on web: create, view, edit, delete (with confirmation dialog + undo toast).
- [ ] Itinerary, budget, and packing CRUD work on web and native.
- [ ] Packing template seeding works (`?template=beach` etc.).
- [ ] Trip detail: itinerary timeline, budget breakdown (per-category table + pie chart), packing checklists, linked pot progress and project name all displayed correctly.
- [ ] Budget breakdown shows planned / actual / difference per category (not just a total).
- [ ] Cross-module: linking a pot updates `linked_pot_id`; linking a project creates optional initial tasks; due dates create calendar events; all require explicit user confirmation.
- [ ] Smart cards appear for upcoming trips and pot progress; activity feed receives entries for create/add/packed events.
- [ ] Holidays module enabled in registry (`isEnabled: true`) and visible in nav.

### Performance
- [ ] Trip detail loads with parallel data fetches (not sequential); no waterfall.
- [ ] Recharts loaded lazily (`next/dynamic`); no impact on initial page bundle.
- [ ] Packing toggle is optimistic — no spinner, no round-trip delay.
- [ ] Native packing list renders from AsyncStorage on first load; syncs to Supabase in background.
- [ ] Native FlatList uses `initialNumToRender` and `windowSize` to stay memory-efficient.

### UX (PLOT Principles + Nielsen)
- [ ] Create trip form: required-field markers, inline errors, error summary, submit disabled on errors, accessible (`aria-invalid`, `aria-describedby`).
- [ ] Delete trip shows trip name and consequence; toast confirms deletion with 5-second undo.
- [ ] No motivational copy anywhere in the module (e.g. no "You're almost packed! 🎉").
- [ ] Both household members see all trips with no ownership restrictions (Labor Equity).
- [ ] Budget workings (per-category breakdown) always visible, not hidden behind a summary (User Autonomy).

### Testing
- [ ] Unit tests colocated with source files (e.g. `trip-budget-calculator.test.ts` next to `trip-budget-calculator.ts`).
- [ ] Schema validation tests cover required fields, max lengths, and enum values.
- [ ] API route integration tests cover: auth rejection (no session), invalid Zod input, successful CRUD, and RLS enforcement.

---

## File path reference (Phase 4)

```
packages/logic/src/holidays/
  schemas.ts                    # Zod schemas + inferred types
  trip-budget-calculator.ts     # Pure budget calculation function
  packing-templates.ts          # Template definitions + getPackingTemplate()
  schemas.test.ts               # Unit tests (colocated)
  trip-budget-calculator.test.ts

apps/web/app/dashboard/holidays/
  page.tsx                      # RSC — trips list
  layout.tsx                    # Header + module colour
  [id]/page.tsx                 # RSC — trip detail

apps/web/app/api/trips/
  route.ts                      # GET /api/trips, POST /api/trips
  [id]/route.ts                 # GET, PATCH, DELETE /api/trips/[id]
  [id]/itinerary/route.ts
  [id]/itinerary/[entryId]/route.ts
  [id]/budget/route.ts
  [id]/budget/[itemId]/route.ts
  [id]/packing/route.ts
  [id]/packing/[itemId]/route.ts

apps/web/hooks/use-trips.ts     # TanStack Query hooks

apps/native/app/(tabs)/holidays/
  index.tsx                     # Trips list (FlatList)
  [id].tsx                      # Trip detail

packages/supabase/src/database.types.ts   # Regenerated after migration
supabase/migrations/20260340000000_holidays_module.sql
```

---

## Phase 4b — Integrations (standalone project)

All third-party travel, gig, and dining integrations have been moved to a dedicated standalone plan. **Do not implement any of the below during Phase 4.**

See **`docs/phase-4b-integrations-plan.md`** for the full implementation plan, which covers:

- Travel search: Amadeus (flights, hotels, car rental), Skyscanner, Booking.com
- Activities & tours: Viator, GetYourGuide
- Gigs & tickets: Ticketmaster Discovery API, DICE API
- Dining: Yelp Fusion API
- Deeplinks (no server API): Happy Cow (veg-friendly dining), Airbnb (accommodation)
- Unified search endpoint, provider normalisation, rate limiting, caching, error handling, and API key management

---

*End of Phase 4 merged spec. Execute prompts 4.1–4.9 in order. Integrations follow as Phase 4b.*
