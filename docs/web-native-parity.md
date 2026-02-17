# Web and Native parity

Web and native must behave the same: **one set of business logic, two UIs**. Differences are only where the platform requires it (e.g. native gestures, pull-to-refresh) or where mobile adds capability (e.g. push, biometrics).

## Business logic: single source of truth

- **Server is authoritative.** All allocation totals, category sums, and remaining amounts come from the backend. Web and native both:
  - Call the same APIs (seeds, paycycles, households, income sources, etc.).
  - Display the same fields from the same responses (e.g. `paycycle.total_allocated`, `paycycle.alloc_*`, `paycycle.rem_*`).
- **No client-side reimplementation of server logic.** Avoid duplicating calculations (e.g. “derive total allocated from seeds on the client”) so that:
  - Behaviour cannot diverge between web and native.
  - Fixes and rules live in one place (server/API).
- **Native uses web app APIs.** Seed create/update/delete, paycycle close/unlock/resync, household percentages, etc. go through the web app’s API routes (with Bearer token). Those routes call the same server actions the web UI uses, so behaviour is identical.

## Allocation totals

- **Total allocated** and **category allocation / remaining** come from the `paycycles` row: `total_allocated`, `alloc_needs_me`, `alloc_needs_partner`, …, `rem_needs_me`, … .
- These are updated by **`updatePaycycleAllocations(paycycleId)`** in `apps/web/lib/actions/seed-actions.ts` whenever:
  - A seed is created, updated, or deleted (via API or web form).
  - Mark paid / unmark paid (ritual actions).
  - A draft is resynced or a new cycle is created.
- If a cycle has seeds but totals are still 0 (e.g. legacy data), native (and optionally web) can call **POST `/api/paycycles/[id]/recompute-allocations`** once; then refetch. That keeps both clients on the same server-derived numbers.

## UI parity

- **Blueprint screen order** (match web where possible):
  1. Header: title “Your Blueprint”, cycle selector, dates, bills-paid progress.
  2. Close ritual (all paid, not locked).
  3. Unlock (cycle locked).
  4. **How the Blueprint works** (expandable; active cycle only). Same copy as web, including couple-specific bullet.
  5. **Payday Transfers** (active cycle + couple only): Transfer to Joint, Your Set-Aside, Partner's Set-Aside. Same logic as web RitualTransferSummary.
  6. Total allocated (from `paycycle.total_allocated`).
  7. Income this cycle.
  8. Category allocation grid + “Edit split”.
  9. **Joint Account & Personal Set-Aside** (couple + not active cycle): same logic as web JointAccountSummary.
  10. Seed sections: Needs, Wants, Savings, Repayments (same labels and order as web).
  11. Savings pots (native shows a separate “Savings pots” block; web embeds pot info in the savings seed list — acceptable mobile layout difference).
- **Labels** must match web: e.g. “Needs”, “Wants”, “Savings”, “Repayments”; “Need”, “Want”, “Saving”, “Repayment” for add buttons; “Edit split”, “Total allocated”, etc.
- **Behaviour** (add/edit/delete seed, mark paid, close/unlock cycle, edit category split) must be the same; only the controls (buttons, sheets, dialogs) differ by platform.

## Where mobile can differ

- **Layout:** Bottom sheets instead of modals, pull-to-refresh, native list behaviour.
- **Extra features:** Push notifications, biometric lock, deep links — no need to mirror on web.
- **Copy:** Shortened or touch-friendly labels on small screens are fine as long as meaning and behaviour match.

## Adding or changing behaviour

- **New feature or rule:** Implement in the **server/API** (or shared package). Web and native should only call the API and render the response.
- **New API:** Prefer adding a route under `apps/web/app/api/` and calling existing server actions with a token-backed Supabase client so native can use the same logic with Bearer auth.
- **Avoid:** Re-implementing allocation math, validation, or business rules in the native app. If something is “wrong” on mobile, fix the shared path (API + server actions), not the client.
