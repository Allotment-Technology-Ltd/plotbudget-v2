# Favicon Design Brief

**Status:** Placeholder assets in place. New design to be created by graphic designer.  
**Approval:** User + Design Lead

---

## Current State

- **Placeholder:** `#` symbol (JetBrains Mono, bold) on rounded square
- **Light variant:** `#0E8345` on `#F5F0EA` background
- **Dark variant:** `#69F0AE` on `#111111` background
- **Locations:** `apps/marketing/public/`, `apps/web/public/`

---

## Requirements for New Design

### Brand Alignment

- **Source of truth:** `docs/design.md`, `packages/design-tokens`
- **Light mode:** Forest Green `#0E8345`; warm cream `#F5F0EA`
- **Dark mode:** Mint `#69F0AE`; near-black `#111111`
- **Typography:** JetBrains Mono, Space Mono, Inter

### Technical Specs

- **Format:** SVG primary (scalable)
- **Variants:** Light and dark (system preference)
- **Sizes to test:** 16×16, 32×32, 48×48, 180×180 (apple-touch-icon)
- **ViewBox:** 64×64 recommended for clean scaling

### Benchmark

Design must hold its own against: Linear, Resend, Claude, Cursor, Vercel — distinct, memorable, readable at small sizes.

### Deliverables

1. `favicon-light.svg` — light theme
2. `favicon-dark.svg` — dark theme
3. `favicon.svg` — fallback (default)
4. `apple-touch-icon.png` — 180×180 PNG (optional, for iOS)

### Where to Place

- Marketing: `apps/marketing/public/`
- Web app: `apps/web/public/`

Both sites use the same assets. Replace placeholder files when design is approved.
