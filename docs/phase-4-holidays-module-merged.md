# Phase 4: Holidays & Trip Planning — Merged Implementation Spec

> **Source:** Merged from the Phase 4 implementation spec and travel providers addendum. Single reference for Phase 4 development.  
> **Last amended:** 2026-02-22 — migration timestamp corrected; module pre-registration noted; provider table clarified; typo fixed; testing section added; Phase 4b expanded; security and index-export guidance added.

---

## How to use this document

1. Paste the **Phase 4 Context Block** into Cursor at the start of a Phase 4 session.
2. Execute prompts **4.1 through 4.9** in order (details below).
3. Run the **Verification checklist** after each prompt and at phase end.
4. **Phase 4b** (Happy Cow, Airbnb deeplinks) is implemented after Phase 4 is live.

---

## Phase 4 Context Block

Paste this into Cursor at the start of Phase 4 work:

```
# CONTEXT: PLOT Platform Expansion — Phase 4 (Holidays & Trip Planning)

## What we're building
The Holidays module lets households manage trips end-to-end: create a trip, link a savings pot and a task project, build an itinerary (flights, accommodation, activities, gigs, dining), track budget by category, manage packing lists, and sync key dates to Calendar and Tasks. Users can search for travel (flights, hotels, cars), activities/tours (Viator, GetYourGuide), dining (Yelp; Happy Cow deeplink in Phase 4b), and gigs/tickets (DICE, Ticketmaster) and add results to itinerary and calendar.

## What exists from earlier phases
- Phase 0: notifications, activity_feed, module registry, cross-module types, nav, design tokens.
- Phase 1: projects, tasks, routines, pots/repayments links, use-tasks hooks, API patterns.
- Phase 2: events table (source_module, source_entity_id) for calendar.
- Money: pots, seeds, blueprint.
- DB: households, users, pots, projects, events, tasks.
- **Module registry:** `packages/logic/src/modules/registry.ts` already defines the holidays module (`id: 'holidays'`, icon: Plane, `colorLight: '#0D9488'`, `colorDark: '#5EEAD4'`, `isEnabled: false`). No registry changes needed until the module ships — flip `isEnabled: true` in Prompt 4.9.

## Architecture rules
- Logic and Zod in packages/logic/src/holidays/
- All new tables: RLS with household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
- Validate all API input with Zod; no secrets in client; travel/gig search server-side only
- Module colour for holidays: #0D9488 (light) / #5EEAD4 (dark)

## Holidays data model

### Tables
- trips — id, household_id, name, destination, start_date, end_date, status, linked_pot_id (FK pots), linked_project_id (FK projects), currency, notes, cover_image_url, created_at, updated_at
- itinerary_entries — id, trip_id, household_id, date, title, description, start_time, end_time, entry_type (travel|accommodation|activity|gig|other), booking_ref, booking_provider, booking_url, cost_amount, cost_currency, sort_order, created_at, updated_at
- trip_budget_items — id, trip_id, household_id, category (flights|accommodation|car_rental|activities|food|transport|other), name, planned_amount, actual_amount, currency, booking_ref, itinerary_entry_id (nullable), created_at, updated_at
- packing_items — id, trip_id, household_id, category, name, is_packed, assignee (me|partner|shared), sort_order, created_at, updated_at

### Trip status
draft | planning | booked | in_progress | completed | cancelled

### Cross-module
- Trip → Pot (linked_pot_id), Trip → Project (linked_project_id)
- Itinerary/budget due dates → create events (source_module 'holidays') and optionally tasks (linked_module 'holidays')
- Gigs added to itinerary: entry_type 'gig', booking_provider 'ticketmaster'|'dice'
```

---

## Travel & gig providers (canonical list)

> **Security:** All provider API keys (`AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET`, `TICKETMASTER_API_KEY`, `DICE_API_KEY`, `VIATOR_API_KEY`, `GETYOURGUIDE_API_KEY`, `YELP_API_KEY`) are server-side only. Never expose them to the client or include them in any response body.

| Provider | Use in PLOT | Access model | Status |
|----------|-------------|--------------|--------|
| **Amadeus for Developers** | Flights, hotels, car rental search | Self-service; free test tier. Data only. | **Required** (core travel search) |
| **Skyscanner Partner API** | Flights (optional) search + deeplinks | Partner signup; affiliate. | Optional |
| **Booking.com Demand API** | Hotel search + affiliate | Managed Affiliate Partner. | Optional |
| **Viator** | Tours & activities search + affiliate | Free signup; Basic Access. | Optional |
| **GetYourGuide** | Tours & activities search + affiliate | Partner API (GitHub); Partnerize; link builder. | Optional |
| **Ticketmaster** | Gigs & tickets — concerts, events | Discovery API; Affiliate Partner for ticket deeplinks. | **Required** (gig search) |
| **DICE** | Gigs & tickets — concerts, electronic, indie | Public API api.dice.fm/v1; API key; link to DICE for tickets. | **Required** (gig search) |
| **Yelp Fusion** | Dining search (restaurants, vegan, vegetarian) | Free tier; Env: `YELP_API_KEY`. | Optional (Phase 4 if env set) |
| **Happy Cow** | Veg-friendly dining (Phase 4b) | Deeplink to search by location; manual "Add place" with link. No API. | Phase 4b only |
| **Airbnb** | Accommodation (Phase 4b) | Deeplink with affiliate params; no consumer API. | Phase 4b only |

### Gigs & tickets (DICE + Ticketmaster)

- **Ticketmaster:** Discovery API (developer.ticketmaster.com). Env: `TICKETMASTER_API_KEY`. Affiliate Partner for "Get tickets" deeplinks.
- **DICE:** API base `https://api.dice.fm/v1`, Bearer token. Env: `DICE_API_KEY`. Register at dice.fm/partners.
- **Implementation:** Unified gig search (server calls both); normalise to one shape; "Add to calendar", "Add to trip itinerary", "Get tickets". Store as itinerary entry with `entry_type` gig, `booking_provider` ticketmaster | dice.

### Activities/tours (Viator + GetYourGuide)

- Same flow: search by destination/dates → results → "Add to itinerary" / "Add to budget" / "Book on [Provider]" (affiliate URL where approved).

### Dining

- **Phase 4:** Yelp Fusion API (`YELP_API_KEY` env; skip gracefully if not set). Category search: restaurants, vegan, vegetarian, cafes — scoped to trip destination.
- **Phase 4b:** Happy Cow — "Find veg-friendly places" deeplink; manual "Add place" with Happy Cow link.

### Phase 4b (after Phase 4 ship)

- **Happy Cow:** UI only — deeplink to search by trip destination; optional itinerary entry with stored URL.
- **Airbnb:** "Search on Airbnb" / "Find a stay" — deeplink with destination/dates (and affiliate params if approved). No server API.

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
- **schemas.ts:** Zod create/update for trip, itinerary entry, trip budget item, packing item; infer types. Follow the pattern in `packages/logic/src/tasks/schemas.ts` and `packages/logic/src/meals/schemas.ts`.
- **trip-budget-calculator.ts:** By-category and total planned vs actual (for pie chart). Pure function — no I/O.
- **packing-templates.ts:** Predefined templates (beach, city, skiing, winter-city, camping, business); `getPackingTemplate(id)`. Each template returns a minimal list of `{ name, category }` items; keep templates small (≤ 20 items) to avoid overwhelming the user.
- **index.ts:** Re-export all public symbols.
- **`packages/logic/src/index.ts`:** Add `export * from './holidays';` alongside the existing module exports.

### 4.3 — Web API routes: Trips CRUD + travel/gig search

- Trips: `GET/POST /api/trips`, `GET/PATCH/DELETE /api/trips/[id]`.
- Nested: `GET/POST /api/trips/[id]/itinerary`, `PATCH/DELETE .../itinerary/[entryId]`; same for `budget` and `packing` (POST packing accepts `?template=beach` etc.).
- **Travel search:** `POST /api/travel/search` — body validated with Zod (type: flight|hotel|car|activity|gig, destination, dates, params). Server calls Amadeus (and Viator / GetYourGuide / Yelp where their env keys are set); normalises results to a single unified shape before returning. Each provider call is wrapped in a **5-second timeout** using `Promise.race`; a single provider failure returns partial results rather than a 500.
- **Gig search:** `POST /api/travel/gigs` — call Ticketmaster Discovery API and DICE API in parallel; normalise to one shape; return results with provider-specific "Get tickets" link.
- **Rate limiting:** 20 search requests per household per minute (track in Supabase or in-memory per deployment; respond 429 with `Retry-After` header on breach).
- **Search result caching:** Cache provider responses for 5 minutes keyed by `{type, destination, dates}` (server-side; use an in-memory LRU cache or Redis if available) to avoid redundant external API calls.
- Env-driven provider toggles; no Happy Cow/Airbnb server calls in Phase 4.
- All API routes validate the session via `supabase.auth.getUser()` before any DB or provider call.

### 4.4 — TanStack Query hooks

- **File:** `apps/web/hooks/use-trips.ts`
- Queries: `useTrips`, `useTrip`, `useTripItinerary`, `useTripBudget`, `useTripPacking`. Follow the same patterns as `use-tasks.ts`.
- `useTravelSearch` and `useGigSearch` implemented as **mutations** (not queries) because they are user-triggered, not background-refreshed.
- Mutations: create/update/delete trip, itinerary entry, budget item, packing item; `useApplyPackingTemplate`.
- **Performance:** Set `staleTime: 60_000` on trips queries (data changes infrequently). Use **optimistic updates** for `isPackedToggle` so the checkbox feels instant. Invalidate only the narrowest query key after a mutation (e.g. `['trip-packing', tripId]` not all trips).

### 4.5 — Web pages and components

- **List:** `apps/web/app/dashboard/holidays/page.tsx` — server component; fetch trips list server-side. Trip cards show status, destination, dates, pot progress if linked. "Add trip" button. Paginate at 20 trips per page if the household has many.
- **Layout:** `apps/web/app/dashboard/holidays/layout.tsx` — header "Holidays", module colour `#0D9488`.
- **Detail:** `apps/web/app/dashboard/holidays/[id]/page.tsx` — server component loads trip + itinerary + budget + packing in a single Supabase call (or parallel awaits, not sequential). Pass to client components for interactivity.
  - Itinerary timeline (client component; sorted by date/sort_order).
  - Budget pie chart: **lazy-load Recharts** with `next/dynamic` and `{ ssr: false }` — the Recharts bundle is large and only needed on the detail page.
  - Packing checklists with optimistic toggle.
  - Linked pot/project display.
  - Travel/gig search panel: **lazy-load** with `next/dynamic` (only rendered when user opens it).
  - `cover_image_url`: render with `next/image` (specify `width`/`height` or `fill` with a sized wrapper) so it is optimised and does not cause layout shift.
- Create/edit trip: dialog (not a separate page) to avoid a full navigation round-trip. Module colour `#0D9488` / `#5EEAD4`.
- Add error boundaries around the search panel and the budget chart so a provider failure or chart error does not take down the whole page.

### 4.6 — Optional: "Plan a trip" flow

- Short wizard (2–3 steps, not a full page per step): name + destination + dates → link pot / create project → apply packing template → land on trip detail. Keep the form minimal; do not block trip creation on optional steps (pot/project linking can be done later from the detail page).
- Reuse the create trip dialog from Prompt 4.5 for step 1; pop additional panels inline.

### 4.7 — Native screens

- Holidays entry from "More" tab (or dedicated tab when `tabBar: true`). Follow the existing native navigation pattern.
- **Trips list:** `FlatList` with `keyExtractor`, `initialNumToRender={10}`, and `windowSize={5}` to keep memory low on long lists.
- **Trip detail:** itinerary, budget summary, packing checklist. Load itinerary and packing in parallel (two separate queries fired together, not sequentially).
- **Packing list offline sync:**
  1. On load: read from AsyncStorage first (instant render), then fetch from Supabase in the background and merge (Supabase wins on conflicts).
  2. On toggle: write to AsyncStorage immediately (optimistic), then sync to Supabase. If offline, queue the change; flush the queue on reconnect using `NetInfo.addEventListener`.
  3. Use a simple `{ tripId, items: [...], updatedAt }` shape in AsyncStorage — no per-item keys.
- **Create trip:** modal/bottom sheet. Mirror the web dialog fields. Keep the form to the essentials (name, destination, dates); pot/project linking is optional and can be done from detail.
- Avoid heavy imports in native screens; do not import Recharts or any web-only library.

### 4.8 — Cross-module integration

- On trip create (or "Link pot"): create/select pot, set trip.linked_pot_id.
- On trip create (or "Link project"): create/select project, set trip.linked_project_id; optional initial tasks (e.g. "Book flights").
- Payment/due dates from itinerary or budget → create event (source_module 'holidays', source_entity_id); optionally create task (linked_module 'holidays').
- Native packing: sync to AsyncStorage when offline; merge/sync to Supabase when online.

### 4.9 — Smart cards and activity feed

- Smart cards: "Upcoming trip in 7 days", "Trip savings at X%" (linked pot). Link to `/dashboard/holidays/[id]`. Module colour from registry.
- Activity feed: on trip create, itinerary add, packing complete — insert with source_module 'holidays', action_url to trip.

---

## Verification checklist (Phase 4)

- [ ] Migration applies; RLS and types updated.
- [ ] Trips CRUD and itinerary/budget/packing CRUD work on web.
- [ ] Trip detail shows itinerary timeline, budget pie chart, packing checklists; linked pot and project displayed.
- [ ] Amadeus (or mock) travel search works; gig search (Ticketmaster + DICE) returns normalised results; rate limit and errors handled.
- [ ] Create trip can create/link pot and project; due dates create calendar events and optionally tasks.
- [ ] Native: trip list and detail; packing list works offline and syncs when online.
- [ ] Smart cards and activity feed show holiday events.
- [ ] Holidays module enabled in module registry (`isEnabled: true`).

---

## File path reference (Holidays)

```
packages/logic/src/holidays/           # schemas, budget calculator, packing templates
apps/web/app/dashboard/holidays/      # list, layout, [id] detail
apps/web/app/api/trips/               # CRUD + nested itinerary, budget, packing
apps/web/app/api/travel/              # or trips/search — travel + gig search
apps/web/hooks/use-trips.ts           # TanStack Query hooks
apps/web/lib/travel/                  # optional: amadeus.ts, ticketmaster.ts, dice.ts
apps/native/app/.../holidays/         # native trips list and detail
packages/supabase/src/database.types.ts # trips, itinerary_entries, trip_budget_items, packing_items
```

---

## Phase 4b (after Phase 4)

- **Happy Cow:** "Find veg-friendly places" — open Happy Cow search (trip destination) in browser; optional "Add place" with name + Happy Cow URL stored in itinerary.
- **Airbnb:** "Search on Airbnb" — open Airbnb with destination/dates (and affiliate params); optional itinerary/budget line with label and URL.
- No new tables or server API routes; env for `AIRBNB_AFFILIATE_*` if used.

---

*End of Phase 4 merged spec. Execute prompts 4.1–4.9 in order; then Phase 4b when ready.*
