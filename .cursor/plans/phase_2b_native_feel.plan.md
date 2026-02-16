# Phase 2b: Native Feel — Implementation Plan

**Source:** [docs/PLOT-93-phase-2-plan.md](docs/PLOT-93-phase-2-plan.md)  
**Goal:** The app feels native and tactile; gestures are natural, transitions seamless. Charts moved to Phase 4.

---

## Current State

- **Reanimated** (~4.1.1) and **Gesture Handler** (~2.24.0) are installed; babel plugin configured; `GestureHandlerRootView` wraps the app in `apps/native/app/_layout.tsx`.
- **Not installed:** `@gorhom/bottom-sheet`, `@shopify/react-native-skia`, `expo-haptics`.
- No custom animations yet — only basic `Modal` with `animationType="slide"` / `"fade"`.
- Design system in `packages/native-ui/` provides Card, Text, Button, Skeleton, etc.
- Three tabs: Dashboard (`index.tsx`), Blueprint (`two.tsx`), Settings (`settings.tsx`).

---

## Recommended Order

1. **PLOT-132** Bottom Sheets (foundation for modals)
2. **PLOT-131** Swipe Gestures (row-level actions) — *swipe removed; SeedCard inline actions used*
3. **PLOT-135** Micro-interactions (feedback on actions)
4. **PLOT-133** Shared Element Transitions (screen-level polish) — *detail routes added; transitions disabled for Expo Go compatibility*

**Moved to Phase 4:** PLOT-134 Interactive Reporting Suite (charts, APIs)

---

## 1. PLOT-132: Draggable Bottom Sheets

**Goal:** Replace React Native `Modal` with draggable bottom sheets.

**Install:** `@gorhom/bottom-sheet` (v5, Expo-compatible).

**Approach:** Create `AppBottomSheet` wrapper in `apps/native/components/AppBottomSheet.tsx`; add `BottomSheetModalProvider` in root layout; refactor SeedFormModal, DeleteSeedConfirmModal, IncomeManageModal, and cycle picker in `apps/native/app/(tabs)/two.tsx` to use sheets. Preserve all existing logic; use snap points (e.g. compact / half / full) and theme from design tokens.

---

## 2. PLOT-131: Physics-Based Swipe Gestures

**Goal:** Swipe-to-action rows for seeds/bills on Dashboard and Blueprint.

**Approach:** Create `SwipeableRow.tsx` with `GestureDetector` + `Gesture.Pan()` and Reanimated springs; swipe left = "Mark Paid", swipe right = "Edit" (opens bottom sheet). Extract `SeedCard` to `apps/native/components/SeedCard.tsx`. Wrap seed/bill rows in Dashboard and Blueprint. One row open at a time.

---

## 3. PLOT-135: Micro-interactions

**Goal:** Tactile, visual feedback across the app.

**Install:** `expo-haptics`.

**Approach:** Add `AnimatedPressable` and `SuccessAnimation` (e.g. checkmark + confetti on mark paid / pot complete); press animations on Button/Card; animated tab bar icons; list entering/layout animations; progress bar fill animations. Wire haptics to key actions (button press, success, swipe threshold).

---

## 4. PLOT-133: Shared Element Transitions

**Goal:** Budget cards expand into detail screens with shared element transitions.

**Approach:** Add routes `budget-detail/[type].tsx` and `pot-detail/[id].tsx`; set `sharedTransitionTag` on Dashboard category and pot cards; use Reanimated `SharedTransition` with spring physics in Expo Router. Detail screens show category/pot breakdown and actions.

---

## 5. PLOT-134: Interactive Reporting Suite (Charts + APIs)

**Goal:** Interactive charts on the dashboard that are **filterable** and **adaptable** to the user’s needs so they can **immerse themselves in their budgeting** — with clear metrics, intuitive IA, and best-in-class presentation. New APIs must be in place where needed (see 5a).

### 5a. Reporting APIs (ensure full suite is supported)

**Current gap:** Native fetches only the **current** paycycle and its seeds. No list of past/active paycycles for comparison or trend views.

**New API(s) to add (web app):**

- **`GET /api/paycycles?household_id=...&status=active,completed&limit=12`** — List paycycles for reporting (cycle picker, trends). Response: array of paycycle rows (id, name, start_date, end_date, status, total_income, total_allocated, alloc_*, rem_*). Ordered by end_date desc.
- **Optional: `GET /api/reporting/summary?household_id=...&cycle_ids=...`** — Pre-aggregated per cycle, per category: allocated, spent, remaining; optional per payment_source. Single source of truth for metric definitions.

**Metric definitions (CFO):** **Allocated** = paycycle alloc_*; **Remaining** = paycycle rem_*; **Spent** = Allocated - Remaining (derivable from paycycle for past cycles; for current cycle drill-down can use sum of seed amounts where is_paid).

**Native:** Add `fetchPaycyclesForReporting(householdId, { limit })` calling the new list endpoint (or Supabase with RLS). Use for cycle filter and multi-cycle charts.

---

### 5b. Reporting suite vision (CFO + CMO + UX + Graphic Design)

- **CFO:** Clear definitions for every number; reports: This cycle at a glance, Cycle comparison (last 3–6), Category drill-down, Pots progress, Partner view (me/partner/joint). Sensible defaults.
- **CMO:** Frame as outcomes — e.g. "You're on track", "£X left in Wants". One primary headline per section; CTAs: "See breakdown", "Compare to last cycle", "View bills".
- **UX:** IA: Overview → By category → By cycle → By payment. Filters: "This cycle", "Last 3 cycles", "By category", "By payment". Minimal steps; empty states ("Complete a cycle to see trends"); loading skeletons; consistent filter bar.
- **Graphic Design:** One primary number/chart per block; category palette from design tokens (needs, wants, savings, repay); 4/8px grid; shared chart primitives (axes, labels, tooltips) for one coherent system.

---

### 5c. Report types and chart choices

Report types to support: **Category breakdown** (where did it go / what's left) — donut or bar by category; **Cycle comparison** (am I improving?) — bar across cycles; **Payment source** (me vs partner vs joint) — donut or stacked bar; **Pots progress** — animated progress bars; **Upcoming / overdue** — list + optional timeline. Data: paycycle alloc/rem, list paycycles API, seeds, pots. Chart components: Donut, Bar, shared progress bars; design tokens; haptics.

(Original principles retained below for reference.)

- **Interactive:** Tap/rotate to drill down, see amounts, compare.
- **Filterable:** By time (current cycle vs previous), by category (Needs/Wants/Savings/Repay), by payment source (me/partner/joint), by paid vs unpaid.
- **Adaptable:** User can choose what to see (e.g. allocation vs spending vs remaining), which chart type(s), and optionally persist preferences (e.g. MMKV or Supabase user prefs later).
- **Immersive:** Smooth animations, haptics, and clear narrative (e.g. “Where did it go?” vs “What’s left?”).

**Chart options (implement what fits scope):**

- **Donut/pie:** Allocation or spending by category; spin-to-select segment; center shows total or selected segment; haptics on segment change. Good for “where did it go?”.
- **Bar or horizontal bar:** Compare categories (allocated vs spent vs remaining) or compare cycles. Good for “am I on track?”.
- **Progress / stacked:** E.g. category breakdown as stacked bars or multiple progress bars. Reuse existing progress-bar styling with animated fills.
- **Time / trend (if data allows):** e.g. remaining over days in cycle — only if paycycle + daily data is available without extra backend work.

**Data and APIs:** Require list paycycles API (see 5a). From paycycle rows derive allocated/remaining/spent; from current seeds and pots derive drill-down and progress. Optional reporting/summary API for server-side aggregation.

**Implementation outline:**

- **Install:** `@shopify/react-native-skia` (or `react-native-svg` + Reanimated if Skia is incompatible with Expo SDK 54).
- **Filter UI:** Add a compact filter bar or segmented control above the chart area (e.g. “This cycle” / “By category” / “By payment”; “Allocation” / “Spent” / “Remaining”). Store selected filters in component state (later: MMKV or user prefs).
- **Chart component(s):** Build at least one primary chart (e.g. donut for allocation by category) that reacts to filters; optionally a second view (e.g. bar comparison). Use design token colors for categories (`needs`, `wants`, `savings`, `repay`).
- **Interactivity:** Tap or spin-to-select segments; show amount/percentage in center or tooltip; `expo-haptics` on selection change; animate transitions when filters change (Reanimated).
- **Placement:** Replace or augment the current text-based “Category breakdown” and related blocks on `apps/native/app/(tabs)/index.tsx`. Keep hero metrics (allocated, left to spend, days left) and other sections; charts sit in a dedicated “Insights” or “Breakdown” section that can expand or scroll.
- **Fallback:** If Skia is problematic, use `react-native-svg` for paths and Reanimated for animations; reduce “spin” to tap-to-select if needed.

**Files to create/change:**

- `apps/native/components/charts/` — e.g. `DonutChart.tsx`, `BarChart.tsx` (if in scope), `ChartFilters.tsx`.
- `apps/native/app/(tabs)/index.tsx` — integrate filterable chart(s), replace or augment category breakdown.
- Optional: `apps/native/lib/chart-data.ts` — derive chart series from paycycle/seeds/pots for different filter combinations.

**Risk:** Skia + Expo SDK 54 compatibility; fallback to SVG + Reanimated. Profile on mid-range Android for 60fps.

---

## Package Installation Summary

From `apps/native/`:

```bash
npx expo install @gorhom/bottom-sheet expo-haptics @shopify/react-native-skia
```

Use `npx expo install` for SDK-compatible versions.

---

## Risk Notes

- **Reporting APIs:** Implement `GET /api/paycycles` (and optionally `GET /api/reporting/summary`) before or in parallel with PLOT-134 so the full reporting suite has data for cycle comparison and trends.
- **Skia:** Verify compatibility with Expo SDK 54 / RN 0.81; have SVG + Reanimated fallback for charts.
- **Bottom sheet + keyboard:** Ensure `softwareKeyboardLayoutMode: "resize"` (or equivalent) for forms in sheets.
- **Shared transitions:** Test on both platforms; API may evolve.
- **Performance:** Profile charts and gestures on mid-range Android; simplify animations if needed.
