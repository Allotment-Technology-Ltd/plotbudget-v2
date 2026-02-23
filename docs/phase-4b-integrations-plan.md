# Phase 4b: Holidays Integrations — Standalone Implementation Plan

> **Prerequisite:** Phase 4 (bespoke Holidays module) must be live before Phase 4b begins.  
> **Scope:** All third-party travel, gig, dining, and deeplink integrations that enable "search and add" workflows within the Holidays module.

---

## Context Block

Paste this into Cursor at the start of Phase 4b work:

```
# CONTEXT: Phase 4b — Holidays Integrations

## What exists (Phase 4)
- trips, itinerary_entries, trip_budget_items, packing_items tables with RLS.
- Full CRUD API under /api/trips/[id]/{itinerary,budget,packing}.
- itinerary_entries has: entry_type (travel|accommodation|activity|dining|other),
  booking_ref, booking_url — ready to receive provider results.
- packages/logic/src/holidays/ — schemas, budget calculator, packing templates.
- apps/web/hooks/use-trips.ts — CRUD mutations and queries.

## What Phase 4b adds
- /api/travel/search — unified travel search (flights, hotels, car rental, activities).
- /api/travel/gigs  — unified gig/ticket search (Ticketmaster + DICE).
- /api/travel/dining — dining search (Yelp Fusion).
- UI: search panels on trip detail page; "Add to itinerary" / "Add to budget" / "Get tickets".
- Deeplinks only (no server API): Happy Cow, Airbnb.
- Provider adapter modules in apps/web/lib/travel/.

## Architecture rules (Restormel — unchanged from Phase 4)
- Zero Trust: Zod-validate all search inputs server-side with custom error messages.
- Server First: all provider API calls are server-side only. No keys in client.
- No Leaks: API keys in env vars; never in response bodies or client bundles.
- Strict Types: no `any`, no `@ts-ignore`.
- Security audit on every route: injection-proof, auth-checked, no over-fetching.

## PLOT principles
- User Autonomy: search results are suggestions. User decides what to add. No auto-add.
- Constraint as Kindness: one search panel, one result shape, one "Add to itinerary" action.
- Time Respect: provider calls timeout at 5 s; partial results returned on failure.
  No spinners blocking the page — search is a secondary action.
- Reality over Aspiration: if a provider is down or returns no results, say so plainly.
  ("No results from Ticketmaster — try again later." Not "Something went wrong!")
```

---

## Provider registry

> **Security:** All keys are server-side env vars only. Never expose to client or log in responses.

| Provider | Type | Env key(s) | Status | Notes |
|----------|------|------------|--------|-------|
| **Amadeus** | Flights, hotels, car rental | `AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET` | **Required** | OAuth2 client credentials; test tier free |
| **Skyscanner** | Flights (alternative/affiliate) | `SKYSCANNER_API_KEY` | Optional | Partner signup; affiliate deeplinks |
| **Booking.com** | Hotels (alternative/affiliate) | `BOOKING_COM_API_KEY` | Optional | Managed Affiliate Partner |
| **Viator** | Activities & tours | `VIATOR_API_KEY` | Optional | Free Basic Access |
| **GetYourGuide** | Activities & tours | `GETYOURGUIDE_API_KEY` | Optional | Partner API via Partnerize |
| **Ticketmaster** | Gigs & events | `TICKETMASTER_API_KEY` | **Required** (gig search) | Discovery API; free tier |
| **DICE** | Gigs — electronic/indie | `DICE_API_KEY` | **Required** (gig search) | API base `https://api.dice.fm/v1`; Bearer token; register at dice.fm/partners |
| **Yelp Fusion** | Dining | `YELP_API_KEY` | Optional | Free tier; skip gracefully if not set |
| **Happy Cow** | Veg-friendly dining deeplink | — | Deeplink only | No API; open `https://www.happycow.net/searchmap?location={destination}` in browser |
| **Airbnb** | Accommodation deeplink | `AIRBNB_AFFILIATE_ID` (optional) | Deeplink only | No consumer API; construct URL with destination + dates + affiliate params |

---

## Prompt sequence

### 4b.1 — Unified search result type

- **File:** `packages/logic/src/holidays/search-result.ts`
- Define a `TravelSearchResult` type (and Zod schema) that all providers normalise into:
  ```
  {
    provider: string
    resultId: string
    type: 'flight' | 'hotel' | 'car_rental' | 'activity' | 'gig' | 'dining'
    title: string
    description?: string
    date?: string          // ISO date: YYYY-MM-DD, for gigs/activities
    startTime?: string     // ISO 8601 time: HH:mm (24-hour), local to destination
    price?: { amount: number; currency: string }
    bookingUrl: string     // provider link (affiliate where applicable)
    imageUrl?: string
    metadata: Record<string, unknown>  // provider-specific extras
  }
  ```
- Export from `packages/logic/src/holidays/index.ts`.
- No `any` in the type. `metadata` is the escape hatch for provider-specific fields that don't map to the shared shape.

### 4b.2 — Provider adapter modules

- **Location:** `apps/web/lib/travel/`
- One file per provider: `amadeus.ts`, `ticketmaster.ts`, `dice.ts`, `viator.ts`, `getyourguide.ts`, `yelp.ts`.
- Each adapter exports a single async function: `searchAmadeus(params)`, `searchTicketmaster(params)`, etc.
- Each call is wrapped in a **5-second `Promise.race` timeout**:
  ```typescript
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Provider timeout')), 5000)
  );
  const result = await Promise.race([providerCall(params), timeout]);
  ```
- Each adapter normalises its response into `TravelSearchResult[]` before returning.
- Adapters are `server-only` (import `server-only` at the top of each file).
- Unit test each adapter with a mocked HTTP response (colocated `*.test.ts`).

### 4b.3 — Travel search API route

- **File:** `apps/web/app/api/travel/search/route.ts`
- `POST /api/travel/search`
- Restormel Fortress pattern: auth check → Zod validation → provider calls → return.
- Request body schema (Zod, custom messages):
  ```
  {
    type: z.enum(['flight', 'hotel', 'car_rental', 'activity']),
    destination: z.string().min(1, 'Destination is required'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
    origin: z.string().optional(),        // for flights
    passengers: z.number().int().min(1).max(9).optional(),
  }
  ```
- Call the relevant adapter(s) in parallel using `Promise.allSettled` — a single provider failure returns partial results, not a 500.
- **Rate limiting:** 20 requests per household per minute. Track in Supabase (`travel_search_rate` table, one row per household with `count` + `window_start`). Respond 429 with `Retry-After: 60` on breach.
- **Server-side caching:** Cache responses for 5 minutes keyed by `SHA256(JSON.stringify(requestBody))`. Use a module-level `Map` with TTL (or Redis if configured). Avoids redundant provider calls for identical searches.
- Security checklist: injection-proof, auth-checked, no keys in response, SELECT only what's needed.

### 4b.4 — Gig search API route

- **File:** `apps/web/app/api/travel/gigs/route.ts`
- `POST /api/travel/gigs`
- Same Fortress pattern and rate limiting as 4b.3.
- Request body schema:
  ```
  {
    destination: z.string().min(1, 'Destination is required'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, ...),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, ...),
    keyword: z.string().max(100).optional(),
  }
  ```
- Call `searchTicketmaster` and `searchDice` in parallel via `Promise.allSettled`; merge and sort results by date.
- Results include a `bookingUrl` (provider "Get tickets" link) per result — no proxying of ticket purchase through PLOT.

### 4b.5 — Dining search API route

- **File:** `apps/web/app/api/travel/dining/route.ts`
- `POST /api/travel/dining`
- Only active if `YELP_API_KEY` is set in env; return `{ enabled: false }` gracefully if not.
- Same Fortress pattern. Body: `{ destination, cuisine?: string }`.
- Calls `searchYelp`; returns `TravelSearchResult[]` with `type: 'dining'`.

### 4b.6 — TanStack Query hooks (search mutations)

- Add to `apps/web/hooks/use-trips.ts`:
  - `useTravelSearch()` — mutation calling `POST /api/travel/search`.
  - `useGigSearch()` — mutation calling `POST /api/travel/gigs`.
  - `useDiningSearch()` — mutation calling `POST /api/travel/dining`.
- Mutations (not queries) — user-triggered, not background-refreshed.
- On success: store results in local React state (not TanStack Query cache); results are ephemeral.
- On error: surface the server's plain-language error message. Never show a stack trace.

### 4b.7 — Search UI on trip detail

- Add a collapsible "Find things to add" panel to `apps/web/app/dashboard/holidays/[id]/page.tsx`.
- **Lazy-load** the entire panel with `next/dynamic` — it is not rendered until the user opens it.
- Tabs within the panel: Flights / Hotels / Activities / Gigs / Dining. Only show tabs for providers that are configured (check from a server-side `enabledProviders` prop).
- Each result card:
  - Title, price (if available), date (if applicable), provider badge.
  - "Add to itinerary" button → creates an itinerary entry (pre-filled from the result, user can edit before saving).
  - "Add to budget" button (optional) → creates a budget item with the result's price as `planned_amount`.
  - "Get tickets" / "Book on [Provider]" link → opens `bookingUrl` in a new tab. Never proxied.
- No auto-add. User always confirms (User Autonomy / Nielsen #3).
- Loading state: skeleton cards (not a full-page spinner). Error state: plain message per tab.

### 4b.8 — Deeplinks (Happy Cow + Airbnb)

No server API calls. UI-only additions to the trip detail page.

- **Happy Cow:** "Find veg-friendly places near [destination]" button → opens `https://www.happycow.net/searchmap?location={encodeURIComponent(trip.destination)}` in a new tab. Optional: "Add place manually" shortcut that pre-fills an itinerary entry with `entry_type: 'dining'` and a `booking_url` for the user to paste a Happy Cow link.
- **Airbnb:** "Search stays on Airbnb" button → constructs `https://www.airbnb.co.uk/s/{destination}/homes?checkin={startDate}&checkout={endDate}` (append `&affiliateId={AIRBNB_AFFILIATE_ID}` if the env var is set). Opens in a new tab. No server call.
- No new DB tables or migrations required.

---

## Verification checklist (Phase 4b)

### Security
- [ ] All provider API keys confirmed server-side only; not present in any client bundle or response body.
- [ ] Every search route: auth-checked, Zod-validated, try/catch, no stack traces in responses.
- [ ] Provider adapters import `server-only`.

### Functionality
- [ ] Travel search (flights, hotels) returns normalised results from Amadeus; partial results returned when one provider times out.
- [ ] Gig search returns merged results from Ticketmaster and DICE; each result has a working "Get tickets" link.
- [ ] Dining search works when `YELP_API_KEY` is set; returns `{ enabled: false }` gracefully when not set.
- [ ] Rate limiting returns 429 with `Retry-After` header after 20 requests/household/minute.
- [ ] Search results cache for 5 minutes; identical requests within the window do not hit providers again.
- [ ] "Add to itinerary" from a result creates a correctly populated itinerary entry.
- [ ] "Add to budget" from a result creates a correctly populated budget item.
- [ ] Happy Cow deeplink opens correct search URL in new tab.
- [ ] Airbnb deeplink constructs correct URL with destination and dates in new tab.

### Performance
- [ ] Search panel lazy-loaded — not in initial page bundle.
- [ ] Provider calls run in parallel (`Promise.allSettled`); slow providers do not block fast ones.
- [ ] Each provider call times out at 5 seconds; no hanging requests.

### UX
- [ ] No auto-add of any result — all additions require explicit user action.
- [ ] Loading state is skeleton cards, not a full-page spinner.
- [ ] Error messages are plain-language per tab ("No results from Ticketmaster — try again later.").
- [ ] Tabs for unconfigured providers are hidden, not shown as disabled.

### Testing
- [ ] Provider adapter unit tests colocated (`amadeus.test.ts`, etc.) with mocked HTTP responses.
- [ ] Search route integration tests: auth rejection, Zod validation failure, provider timeout, successful response, rate-limit breach.

---

## File path reference (Phase 4b)

```
packages/logic/src/holidays/
  search-result.ts              # TravelSearchResult type + Zod schema
  search-result.test.ts

apps/web/lib/travel/
  amadeus.ts                    # Provider adapter (server-only)
  ticketmaster.ts
  dice.ts
  viator.ts
  getyourguide.ts
  yelp.ts
  amadeus.test.ts               # Unit tests (colocated)
  ticketmaster.test.ts
  dice.test.ts

apps/web/app/api/travel/
  search/route.ts               # POST /api/travel/search
  gigs/route.ts                 # POST /api/travel/gigs
  dining/route.ts               # POST /api/travel/dining

apps/web/app/dashboard/holidays/
  [id]/SearchPanel.tsx          # Lazy-loaded search UI (client component)
  [id]/SearchPanel.test.tsx

apps/web/hooks/use-trips.ts     # useTravelSearch, useGigSearch, useDiningSearch added here
```

---

*End of Phase 4b integrations plan. Begin only after Phase 4 is live and stable.*
