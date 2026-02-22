# Phase 4: Holidays & Trip Planning — Merged Implementation Spec

> **Source:** Merged from [plot-expansion-implementation-spec.md](plot-expansion-implementation-spec.md) (Phase 4 section) and [phase_4_travel_providers_addendum.md](phase_4_travel_providers_addendum.md). Single reference for Phase 4 development.

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

| Provider | Use in PLOT | Access model |
|----------|-------------|--------------|
| **Amadeus for Developers** | Flights, hotels, car rental search | Self-service; free test tier. Data only. |
| **Skyscanner Partner API** | Flights (optional) search + deeplinks | Partner signup; affiliate. |
| **Booking.com Demand API** | Hotel search + affiliate | Managed Affiliate Partner. |
| **Viator** | Tours & activities search + affiliate | Free signup; Basic Access. |
| **GetYourGuide** | Tours & activities search + affiliate | Partner API (GitHub); Partnerize; link builder. |
| **Ticketmaster** | Gigs & tickets — concerts, events | Discovery API; Affiliate Partner for ticket deeplinks. |
| **DICE** | Gigs & tickets — concerts, electronic, indie | Public API api.dicetickets.com/v1; API key; link to DICE for tickets. |
| **Happy Cow** | Veg-friendly dining (Phase 4b) | Deeplink to search by location; manual "Add place" with link. No API. |
| **Airbnb** | Accommodation (Phase 4b) | Deeplink with affiliate params; no consumer API. |

### Gigs & tickets (DICE + Ticketmaster)

- **Ticketmaster:** Discovery API (developer.ticketmaster.com). Env: `TICKETMASTER_API_KEY`. Affiliate Partner for "Get tickets" deeplinks.
- **DICE:** API base `https://api.dicetickets.com/v1`, Bearer token. Env: `DICE_API_KEY`. Register at dicetickets.com/register.
- **Implementation:** Unified gig search (server calls both); normalise to one shape; "Add to calendar", "Add to trip itinerary", "Get tickets". Store as itinerary entry with `entry_type` gig, `booking_provider` ticketmaster | dice.

### Activities/tours (Viator + GetYourGuide)

- Same flow: search by destination/dates → results → "Add to itinerary" / "Add to budget" / "Book on [Provider]" (affiliate URL where approved).

### Dining

- **Phase 4:** Yelp Fusion API (category search: vegan, vegetarian, restaurants) if env configured.
- **Phase 4b:** Happy Cow — "Find veg-friendly places" deeplink; manual "Add place" with Happy Cow link.

### Phase 4b (after Phase 4 ship)

- **Happy Cow:** UI only — deeplink to search by trip destination; optional itinerary entry with stored URL.
- **Airbnb:** "Search on Airbnb" / "Find a stay" — deeplink with destination/dates (and affiliate params if approved). No server API.

---

## Prompt sequence

### 4.1 — Database migration: Holidays tables

- **File:** `supabase/migrations/20260320000000_holidays_module.sql`
- Create tables: `trips`, `itinerary_entries`, `trip_budget_items`, `packing_items` with CHECK/enu ms for status, entry_type, budget category, assignee.
- RLS on all four; indexes: trips(household_id, status), itinerary_entries(trip_id, date), trip_budget_items(trip_id), packing_items(trip_id).
- `updated_at` triggers.
- Update `packages/supabase/src/database.types.ts`.

### 4.2 — Shared logic: Holidays schemas and business rules

- **Location:** `packages/logic/src/holidays/`
- **schemas.ts:** Zod create/update for trip, itinerary entry, trip budget item, packing item; infer types.
- **trip-budget-calculator.ts:** By-category and total planned vs actual (for pie chart).
- **packing-templates.ts:** Predefined templates (beach, city, skiing, etc.); `getPackingTemplate(id)`.
- **index.ts:** Re-export. Update `packages/logic/src/index.ts` to export holidays.

### 4.3 — Web API routes: Trips CRUD + travel/gig search

- Trips: `GET/POST /api/trips`, `GET/PATCH/DELETE /api/trips/[id]`.
- Nested: `GET/POST /api/trips/[id]/itinerary`, `PATCH/DELETE .../itinerary/[entryId]`; same for `budget` and `packing` (POST packing can accept `?template=beach` etc.).
- **Travel search:** `POST /api/trips/search` or `/api/travel/search` — body validated (type: flight|hotel|car|activity|gig, params). Server calls Amadeus (and optionally Viator, GetYourGuide, Yelp), normalises to unified shape; rate limit per household.
- **Gig search:** Same or separate endpoint — call Ticketmaster Discovery API and DICE API; normalise; return results with "Add to calendar" / "Add to itinerary" / "Get tickets" link.
- Env-driven provider toggles; no Happy Cow/Airbnb server calls in Phase 4.

### 4.4 — TanStack Query hooks

- **File:** `apps/web/hooks/use-trips.ts`
- Queries: useTrips, useTrip, useTripItinerary, useTripBudget, useTripPacking, useTravelSearch (mutation).
- Mutations: create/update/delete trip, itinerary, budget, packing; useApplyPackingTemplate. Same patterns as use-tasks.

### 4.5 — Web pages and components

- **List:** `apps/web/app/dashboard/holidays/page.tsx` — trip cards (status, destination, dates, pot progress if linked). "Add trip".
- **Layout:** `apps/web/app/dashboard/holidays/layout.tsx` — header "Holidays", module colour.
- **Detail:** `apps/web/app/dashboard/holidays/[id]/page.tsx` — server load trip + itinerary + budget + packing; client component: itinerary timeline, budget pie chart (Recharts), packing checklists, linked pot/project; "Search flights/hotels/activities/gigs" using travel search; "Add to calendar" / "Add to itinerary" / "Get tickets".
- Create/edit trip form (dialog or page). Module colour #0D9488 / #5EEAD4.

### 4.6 — Optional: "Plan a trip" flow

- Short wizard or single form: name, destination, dates → create trip → link pot / create project → apply packing template → land on trip detail. Keep minimal.

### 4.7 — Native screens

- Holidays entry (from More or tab). Trips list (FlatList); trip detail (itinerary, budget summary, packing). Packing list: offline (AsyncStorage) with sync when online. Create trip modal/screen.

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
