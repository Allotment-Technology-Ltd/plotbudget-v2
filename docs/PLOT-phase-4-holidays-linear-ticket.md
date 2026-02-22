# Linear ticket: Phase 4 — Holidays module

**Created in Linear:** [PLOT-156](https://linear.app/plot-app/issue/PLOT-156/phase-4-holidays-and-trip-planning-module) — Phase 4: Holidays & Trip Planning module. Branch: `PLOT-156-phase-4-holidays` or `feature/plot-156`.

This doc is the source content for that ticket. To recreate or copy to another issue: use the content below, or use the **Linear MCP** (`create_issue`) with this doc as the description. After creating the parent issue, note the issue ID (e.g. `PLOT-XXX`) and use it for branch naming: `PLOT-XXX-holidays-module` or `PLOT-XXX-phase-4-holidays`.

---

## Suggested title

**Phase 4: Holidays & Trip Planning module**

---

## Description (paste into Linear)

### Implementation plan (Phase 4 – Holidays)

- **Phase 4 merged spec** (prompts 4.1–4.9, data model, Restormel security rules, PLOT principles, verification):  
  [`docs/phase-4-holidays-module-merged.md`](phase-4-holidays-module-merged.md)
- **Phase 4b — Integrations** (all third-party travel/gig/dining providers — separate ticket, not in scope here):  
  [`docs/phase-4b-integrations-plan.md`](phase-4b-integrations-plan.md)

---

### Summary

Implement the Holidays module so households can manage trips end-to-end: create trips, link savings pots and task projects, build itineraries (flights, accommodation, activities, dining — entered manually), track budget by category, manage packing lists, and sync key dates to Calendar and Tasks. All bespoke functionality; no third-party provider integrations.

**Out of scope for this ticket (Phase 4b — separate project):** All third-party travel/gig/dining integrations (Amadeus, Viator, GetYourGuide, Ticketmaster, DICE, Yelp, Happy Cow deeplink, Airbnb deeplink). See `docs/phase-4b-integrations-plan.md`.

---

### User stories and acceptance criteria

**US1: Trip CRUD**  
As a household member, I can create, view, edit, and delete trips (name, destination, dates, currency, status) so we have one place to plan holidays.

- **AC1.1** I can create a trip with name, destination, start/end date, currency, and optional notes.
- **AC1.2** I see a list of my household’s trips with status, destination, and dates; I can open a trip to view full details.
- **AC1.3** I can edit trip details and delete a trip (with confirmation).
- **AC1.4** I can link a trip to a savings pot and/or a task project (create new or select existing).

**US2: Itinerary**  
As a household member, I can add and manage itinerary entries (flights, accommodation, activities, dining, other) by date so we have a clear day-by-day plan.

- **AC2.1** On a trip detail page I see an itinerary timeline (by date); I can add entries with date, title, description, optional time and cost.
- **AC2.2** I can set entry type (travel, accommodation, activity, dining, other) and optionally store a booking reference and booking URL.
- **AC2.3** I can reorder, edit, and remove itinerary entries.

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

**US5: Travel and gig search — Phase 4b (separate ticket)**  
Third-party provider search (flights, hotels, activities, gigs, dining) is out of scope for this ticket. See the Phase 4b integrations ticket and `docs/phase-4b-integrations-plan.md`.

**US6: Calendar and task integration**  
As a household member, I see trip-related dates on the shared calendar and optional tasks (e.g. "Book flights") so we don't miss deadlines.

- **AC6.1** When I create a trip and link a project, I can optionally create initial tasks (e.g. "Book flights", "Book accommodation"); they appear in the Tasks module with `linked_module: 'holidays'`. Tasks are only created with explicit user confirmation — no silent automation.
- **AC6.2** When I add an itinerary or budget item with a due/payment date, I can create a calendar event (`source_module: 'holidays'`) and optionally a task. Both require explicit user confirmation.

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

- **DB:** Migration `supabase/migrations/20260340000000_holidays_module.sql` for `trips`, `itinerary_entries`, `trip_budget_items`, `packing_items`; RLS on all four; regenerate `database.types.ts`.
- **Logic:** `packages/logic/src/holidays/` — Zod schemas (with custom error messages), `trip-budget-calculator.ts` (pure, returns full per-category breakdown), `packing-templates.ts`; export from `packages/logic/src/index.ts`.
- **API:** Trips CRUD and nested itinerary/budget/packing routes under `/api/trips/`. No travel/gig search routes (Phase 4b).
- **Web:** RSC trips list and trip detail (itinerary timeline, budget breakdown + lazy-loaded pie chart, packing checklists, linked pot/project); create/edit trip dialog with error-friendly form design (Restormel §8); delete confirmation + undo toast.
- **Native:** Trips list (FlatList) and detail; packing list with AsyncStorage offline sync; create trip modal.
- **Cross-module:** Link pot/project; calendar events and tasks from due dates (user-confirmed); activity feed and smart cards.
- **Module registry:** Flip `holidays.isEnabled` to `true` in `packages/logic/src/modules/registry.ts`.
- **No third-party integrations in this ticket** — see Phase 4b.

---

### Definition of done

- All prompts 4.1–4.9 from `docs/phase-4-holidays-module-merged.md` are implemented and verified.
- All sections of the verification checklist in that document are checked off (Security, Functionality, Performance, UX, Testing).
- Branch named with Linear issue ID (e.g. `PLOT-XXX-phase-4-holidays`); PR links to this issue.
