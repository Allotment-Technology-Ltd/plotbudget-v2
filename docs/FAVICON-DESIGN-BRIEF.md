# Favicon Design Brief

**Status:** Aligned with Figma design system ([stage-fully-79803730.figma.site](https://stage-fully-79803730.figma.site/)).  
**Approval:** User + Design Lead

---

## Current State

- **Design source:** Figma Complete Logo System for PLOT
- **Light variant:** Forest Green `#008845` on `#f5f5f0` background
- **Dark variant:** Mint `#69F0AE` on `#0a0a0a` background
- **Locations:** `apps/marketing/public/`, `apps/web/public/`
- **Assets:** favicon-light.svg, favicon-dark.svg, favicon.svg, apple-touch-icon.svg, og-image.png
- **OG copy:** See [OG-IMAGE-COPY.md](OG-IMAGE-COPY.md) — marketing approved

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
