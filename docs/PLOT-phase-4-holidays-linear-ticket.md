# Linear ticket: Phase 4 — Holidays module

**Created in Linear:** [PLOT-156](https://linear.app/plot-app/issue/PLOT-156/phase-4-holidays-and-trip-planning-module) — Phase 4: Holidays & Trip Planning module. Branch: `PLOT-156-phase-4-holidays` or `feature/plot-156`.

This doc is the source content for that ticket. To recreate or copy to another issue: use the content below, or use the **Linear MCP** (`create_issue`) with this doc as the description. After creating the parent issue, note the issue ID (e.g. `PLOT-XXX`) and use it for branch naming: `PLOT-XXX-holidays-module` or `PLOT-XXX-phase-4-holidays`.

---

## Suggested title

**Phase 4: Holidays & Trip Planning module**

---

## Description (paste into Linear)

### Implementation plan (Phase 4 – Holidays)

- **Phase 4 in Implementation Spec** (prompts 4.1–4.9, data model, verification):  
  [`.cursor/plans/plot-expansion-implementation-spec.md`](.cursor/plans/plot-expansion-implementation-spec.md) — see section **Phase 4: Holidays & Trip Planning**.
- **Travel providers & gigs (DICE + Ticketmaster):**  
  [`.cursor/plans/phase_4_travel_providers_addendum.md`](.cursor/plans/phase_4_travel_providers_addendum.md) — provider list, Gigs & tickets (DICE + Ticketmaster), GetYourGuide, Happy Cow (Phase 4b).

**Full URLs for Linear (use your repo):**  
`https://github.com/<org>/<repo>/blob/main/.cursor/plans/plot-expansion-implementation-spec.md`  
`https://github.com/<org>/<repo>/blob/main/.cursor/plans/phase_4_travel_providers_addendum.md`

---

### Summary

Implement the Holidays module so households can manage trips end-to-end: create trips, link savings pots and task projects, build itineraries (flights, accommodation, activities, gigs), track budget by category, manage packing lists, and sync key dates to Calendar and Tasks. Integrate with travel and gig providers (Amadeus, Viator, GetYourGuide, DICE, Ticketmaster) for search and "Add to itinerary" / "Add to calendar" / "Get tickets".

**Out of scope for this ticket (Phase 4b):** Happy Cow and Airbnb deeplink-only integrations (separate follow-up).

---

### User stories and acceptance criteria

**US1: Trip CRUD**  
As a household member, I can create, view, edit, and delete trips (name, destination, dates, currency, status) so we have one place to plan holidays.

- **AC1.1** I can create a trip with name, destination, start/end date, currency, and optional notes.
- **AC1.2** I see a list of my household’s trips with status, destination, and dates; I can open a trip to view full details.
- **AC1.3** I can edit trip details and delete a trip (with confirmation).
- **AC1.4** I can link a trip to a savings pot and/or a task project (create new or select existing).

**US2: Itinerary**  
As a household member, I can add and manage itinerary entries (flights, accommodation, activities, gigs, other) by date so we have a clear day-by-day plan.

- **AC2.1** On a trip detail page I see an itinerary timeline (by date); I can add entries with date, title, description, optional time and cost.
- **AC2.2** I can set entry type (e.g. travel, accommodation, activity, gig, other) and optionally store a booking reference and booking URL.
- **AC2.3** I can reorder, edit, and remove itinerary entries.
- **AC2.4** Entries can be added from search results (travel, activities, gigs) with "Add to itinerary" and optional "Add to budget".

**US3: Trip budget**  
As a household member, I can track planned and actual spend by category (flights, accommodation, activities, food, etc.) and see how it compares to our linked pot so we stay on budget.

- **AC3.1** I can add budget items with category, name, planned amount, and optional actual amount and currency.
- **AC3.2** I see a budget breakdown by category and a pie chart (planned vs actual) on the trip detail page.
- **AC3.3** I can link a budget item to an itinerary entry; totals and category sums are correct.
- **AC3.4** If the trip is linked to a pot, I see pot progress (current vs target) in context.

**US4: Packing lists**  
As a household member, I can manage packing checklists per trip (with optional templates) and mark items as packed so we don’t forget anything.

- **AC4.1** I can add packing items (name, category, assignee: me / partner / shared) and mark them as packed.
- **AC4.2** I can apply a packing template (e.g. beach, city, skiing) to pre-fill the list.
- **AC4.3** On native, the packing list is available offline and syncs when back online.

**US5: Travel and gig search**  
As a household member, I can search for flights/hotels/cars, activities/tours, and gigs from within the app and add results to my trip or calendar so I don’t have to leave PLOT to plan.

- **AC5.1** I can search for travel (flights, hotels, cars) using at least one provider (e.g. Amadeus); results show in a unified list with "Add to itinerary" and optional "Add to budget".
- **AC5.2** I can search for activities/tours (Viator, GetYourGuide where configured); I can add a result to the itinerary and open the provider’s booking link.
- **AC5.3** I can search for gigs (concerts, events) via Ticketmaster and DICE; results show with "Add to calendar", "Add to trip itinerary", and "Get tickets" (provider link).
- **AC5.4** Search is rate-limited per household; errors (e.g. provider down) show a clear message without exposing internals.

**US6: Calendar and task integration**  
As a household member, I see trip-related dates on the shared calendar and optional tasks (e.g. "Book flights") so we don’t miss deadlines.

- **AC6.1** When I create a trip and link a project, I can optionally create initial tasks (e.g. "Book flights", "Book accommodation"); they appear in the Tasks module with linked_module 'holidays'.
- **AC6.2** When I add an itinerary or budget item with a due/payment date, I can create a calendar event (source_module 'holidays') and optionally a task.
- **AC6.3** Gigs added to the itinerary can create a calendar event for the gig date.

**US7: Home and activity feed**  
As a household member, I see holidays-related smart cards on the home screen and trip actions in the activity feed so the module feels part of the household system.

- **AC7.1** A smart card appears when a trip is starting soon (e.g. within 7 days) or when the linked pot is near target (e.g. 80%); the card links to the trip.
- **AC7.2** Creating a trip, adding an itinerary entry, or completing the packing list creates an activity feed entry with source_module 'holidays' and a link to the trip.

**US8: Native experience**  
As a mobile user, I can view trips, manage itinerary and packing, and search (or open provider links) on my phone, with packing available offline.

- **AC8.1** I can open the Holidays area (from More or a tab), see my trips, and open a trip detail.
- **AC8.2** I can add/edit itinerary and packing items; packing list syncs from AsyncStorage when offline to Supabase when online.
- **AC8.3** I can create a trip (name, destination, dates, optional pot/project link) from native.

---

### Technical scope (reference)

- **DB:** Migration for `trips`, `itinerary_entries`, `trip_budget_items`, `packing_items`; RLS; update `database.types.ts`.
- **Logic:** `packages/logic/src/holidays/` — Zod schemas, trip budget calculator, packing templates.
- **API:** Trips CRUD, nested itinerary/budget/packing routes; travel search (Amadeus, Viator, GetYourGuide, Yelp as configured); gig search (Ticketmaster, DICE); rate limiting.
- **Web:** Dashboard holidays list and trip detail (itinerary timeline, budget pie chart, packing); travel/gig search UI; create/edit trip.
- **Native:** Trips list and detail; packing with offline sync; create trip.
- **Cross-module:** Link pot/project; create calendar events and tasks from due dates; activity feed and smart cards.
- **Module registry:** Enable Holidays module (`isEnabled: true`).

---

### Definition of done

- All prompts 4.1–4.9 from the Phase 4 implementation spec are implemented and verified.
- Verification checklist (in [plot-expansion-implementation-spec.md](.cursor/plans/plot-expansion-implementation-spec.md) Phase 4 section) is passed.
- Branch named with Linear issue ID (e.g. `PLOT-XXX-phase-4-holidays`); PR links to this issue.
