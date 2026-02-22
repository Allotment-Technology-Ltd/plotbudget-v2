# UX: Nav bar (mobile) and breadcrumbs

## Nav bar – what must stay vs what can move

### Must stay in the top bar (all screen sizes)

- **Home / PLOT** – Primary identity and escape to launcher. Non-negotiable.
- **Current module context** – The one module dropdown (Money, Tasks, Meals, or Calendar) so the user always knows where they are and can move within the module. Must stay visible.
- **Notifications** – High-value, time-sensitive. Keep in the bar.
- **Avatar / user menu** – Standard pattern; users expect account/identity in the top-right.

### Can move elsewhere (especially on mobile)

- **“Go to” (other modules)** – On small screens this competes for space and can cause wrapping or jumble. **Recommendation:** Keep “Go to” in the bar on desktop (md+). On mobile, move “Go to” into the **avatar menu** as a “Switch module” or “Go to” group (Home, Money, Tasks, Calendar, Meals). Same links, less bar clutter.
- **Module label length** – On very small screens the full “Meals & shopping” can be shortened to “Meals” or icon-only in the trigger to save space (optional refinement).

### Bottom dock (module switcher)

- **Desktop (pointer):** macOS-style magnification: icons scale up (to ~1.35×) by proximity to the cursor, with smooth falloff (72px radius). Implemented with pointer move/leave, `requestAnimationFrame`, and `prefers-reduced-motion` / `hover: hover` checks so the effect only runs where appropriate.
- **Mobile (touch):** No magnification (no hover). Flat dock with equal touch targets (min 44px), clear active state (current module highlighted). Labels kept for clarity; `touch-manipulation` for responsive taps.
- **Accessibility:** Magnification is disabled when `prefers-reduced-motion: reduce` or when the device doesn’t support hover (`hover: hover`).

### Implementation notes

- Use a single row with `overflow-hidden` / `min-w-0` on the middle section so the bar never wraps into multiple rows.
- Right side (notifications + avatar): `shrink-0` so it never collapses.
- Left side: logo and current module dropdown can use `min-w-0` and truncation so the middle flex child doesn’t force overflow.

---

## Breadcrumbs: do we need them? Do mobile apps use them?

### Do mobile apps use breadcrumbs?

- **Usually no.** Native mobile UIs typically use:
  - A **back control** (or “Back to [screen]”) in the header.
  - A **clear page title** (e.g. “Blueprint”, “Recipes”).
  - Sometimes **one level of hierarchy** in the title (e.g. “Budget > Groceries”), but not long trails.

- **Full breadcrumb trails** (Home > Money > Blueprint > …) are more common on **web/desktop** where horizontal space and deep IA are normal.

### Do we need breadcrumbs?

- **Not as a requirement.** Current pattern is already good:
  - **Top bar:** PLOT (home) + current module dropdown (in-module pages) + “Go to” (other modules).
  - **Page content:** Each page has a clear title (e.g. “Recipes”, “What can I cook?”).
  - **Back links** where it helps (e.g. “Back to Recipes” on recipe detail).

- **When breadcrumbs might help (optional, desktop-first):**
  - Deeper flows (e.g. Budget > Pot > Repayment plan) where “where am I?” is less obvious.
  - If you add more nesting later, a short breadcrumb (e.g. “Money > Blueprint”) could be added **above the page title** on larger screens only; keep them off the main nav bar.

- **Recommendation:** **Don’t implement app-wide breadcrumbs for mobile.** Rely on:
  - Strong page titles.
  - In-module dropdown for sibling pages.
  - “Back to X” or back button where depth is greater than one.
  - Optionally add a **short breadcrumb** (e.g. “Money > Blueprint”) on desktop only for the deepest screens, if you see confusion in testing.

---

## Summary

| Element            | In bar (mobile) | In bar (desktop) | Alternative on mobile   |
|-------------------|-----------------|------------------|-------------------------|
| PLOT / Home       | Yes             | Yes              | —                       |
| Current module ▼  | Yes             | Yes              | —                       |
| Go to ▼           | No              | No               | Bottom dock (always)    |
| Notifications     | Yes             | Yes              | —                       |
| Avatar            | Yes             | Yes              | —                       |
| Breadcrumbs       | No              | Optional (later) | Page title + back link  |
