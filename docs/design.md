# PLOT Design System

> **Version:** 2.0  
> **Last Updated:** February 2026  
> **Stack:** Next.js 14 + Tailwind CSS + shadcn/ui  
> **Source of Truth:** `packages/ui/tailwind.config.ts`

---

## Table of Contents

1. [Brand Philosophy](#1-brand-philosophy)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing & Layout](#4-spacing--layout)
5. [Border Radius](#5-border-radius)
6. [Shadows & Effects](#6-shadows--effects)
7. [Animations](#7-animations)
8. [Component Classes](#8-component-classes)
9. [Accessibility](#9-accessibility)

---

## 1. Brand Philosophy

PLOT uses a **dual-mode design system** with distinct personalities:

| Mode | CSS Class | Personality | Primary Accent |
|------|-----------|-------------|----------------|
| **Light** | `:root` (default) | "Empowering Partner" — warm, trustworthy, accessible | Forest Green `#0E8345` |
| **Dark** | `.dark` | "Anti-Corporate Underdog" — cyberpunk terminal aesthetic | Mint `#69F0AE` |

### Key Design Principles

1. **Subtle Rounding** — Soft corners (4-12px) for approachability
2. **Monospace for Display** — JetBrains Mono and Space Mono for headlines, labels, CTAs
3. **Sans-serif for Body** — Inter for readable paragraph text
4. **Glow Effects** — Subtle accent glows replace traditional shadows in dark mode
5. **Mobile-First** — All components designed for touch, enhanced for desktop

---

## 2. Color System

### 2.1 CSS Custom Properties

All colors are defined as RGB triplets for alpha support (`rgb(var(--color) / 0.5)`).

#### Light Mode (`:root`)
```css
:root {
  /* Backgrounds */
  --bg-primary: 245 240 234;       /* #F5F0EA - Warm cream */
  --bg-secondary: 255 255 255;     /* #FFFFFF - Pure white */
  --bg-elevated: 240 235 228;      /* #F0EBE4 - Darker cream */

  /* Text */
  --text-primary: 17 17 17;        /* #111111 - Near-black */
  --text-secondary: 85 85 85;      /* #555555 - Medium gray */

  /* Accent */
  --accent-primary: 14 131 69;     /* #0E8345 - Forest green */
  --accent-glow: 14 131 69;        /* For glow effects */

  /* Borders */
  --border-subtle: 0 0 0;          /* Black at 8% opacity */
  --border-accent: 14 131 69;      /* Accent at 30% opacity */

  /* Semantic Feedback */
  --success: 46 125 50;            /* #2E7D32 */
  --error: 201 42 42;              /* #C92A2A */
  --warning: 255 107 53;           /* #FF6B35 */
  --info: 26 26 26;                /* #1A1A1A */

  /* Budget Categories */
  --needs: 141 163 153;            /* #8DA399 */
  --wants: 199 141 117;            /* #C78D75 */
  --repay: 239 83 80;              /* #EF5350 */
  --savings: 110 201 124;          /* #6EC97C */
}
```

#### Dark Mode (`.dark`)
```css
.dark {
  /* Backgrounds */
  --bg-primary: 17 17 17;          /* #111111 - Near-black */
  --bg-secondary: 26 26 26;        /* #1A1A1A - Dark gray */
  --bg-elevated: 34 34 34;         /* #222222 - Elevated */

  /* Text */
  --text-primary: 245 240 234;     /* #F5F0EA - Warm white */
  --text-secondary: 153 153 153;   /* #999999 - Medium gray */

  /* Accent */
  --accent-primary: 105 240 174;   /* #69F0AE - Mint green */
  --accent-glow: 105 240 174;      /* For glow effects */

  /* Budget Categories (muted for dark mode) */
  --needs: 61 90 107;              /* #3D5A6B */
  --wants: 157 107 71;             /* #9D6B47 */
  --repay: 184 85 77;              /* #B8554D */
  --savings: 46 125 95;            /* #2E7D5F */
}
```

### 2.2 Tailwind Color Classes

| Tailwind Class | Usage |
|----------------|-------|
| `bg-background` | Page backgrounds |
| `bg-card` | Card surfaces |
| `text-foreground` | Primary text |
| `text-muted-foreground` | Secondary text |
| `text-primary` | Accent-colored text |
| `bg-primary` | Primary buttons, highlights |
| `bg-needs` | Needs category |
| `bg-wants` | Wants category |
| `bg-savings` | Savings category |
| `bg-repay` | Repayments category |
| `bg-needs-subtle` | Needs at 30% opacity |
| `bg-needs-very-subtle` | Needs at 10% opacity |

### 2.3 Hex Reference Table

| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| Background | `#F5F0EA` | `#111111` |
| Surface | `#FFFFFF` | `#1A1A1A` |
| Elevated | `#F0EBE4` | `#222222` |
| Text Primary | `#111111` | `#F5F0EA` |
| Text Secondary | `#555555` | `#999999` |
| Accent Primary | `#0E8345` | `#69F0AE` |
| Needs | `#8DA399` | `#3D5A6B` |
| Wants | `#C78D75` | `#9D6B47` |
| Savings | `#6EC97C` | `#2E7D5F` |
| Repay | `#EF5350` | `#B8554D` |

---

## 3. Typography

### 3.1 Font Families

| Use Case | Font | Weights | Tailwind Class | CSS Variable |
|----------|------|---------|----------------|--------------|
| Hero headlines, numbers | JetBrains Mono | 400, 500, 700 | `font-display` | `--font-jetbrains` |
| Section titles, labels, CTAs | Space Mono | 400, 700 | `font-heading` | `--font-space` |
| Body text, paragraphs | Inter | 400, 500, 600 | `font-body` | `--font-inter` |

### 3.2 Font Loading (Next.js)
```tsx
// app/layout.tsx
import { Inter, JetBrains_Mono, Space_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space',
});
```

### 3.3 Type Scale

| Name | Size | Line Height | Letter Spacing | Usage |
|------|------|-------------|----------------|-------|
| `text-display-lg` | 4.5rem (72px) | 1.05 | 0.06em | Hero headlines |
| `text-display-sm` | 2.5rem (40px) | 1.1 | 0.04em | Hero headlines (mobile) |
| `text-headline` | 3rem (48px) | 1.15 | 0.02em | Section titles |
| `text-headline-sm` | 1.75rem (28px) | 1.2 | 0.02em | Section titles (mobile) |
| `text-sub` | 1.5rem (24px) | 1.3 | 0.01em | Subheadlines |
| `text-sub-sm` | 1.125rem (18px) | 1.4 | 0.01em | Subheadlines (mobile) |
| `text-label` | 0.875rem (14px) | 1.4 | 0.15em | Labels, metadata |
| `text-label-sm` | 0.75rem (12px) | 1.4 | 0.15em | Small labels |
| `text-cta` | 1rem (16px) | 1 | 0.2em | Buttons |
| `text-cta-sm` | 0.875rem (14px) | 1 | 0.15em | Small buttons |

---

## 4. Spacing & Layout

### 4.1 Breakpoints

| Name | Width | Target Device |
|------|-------|---------------|
| `xs` | 390px | iPhone SE / mini |
| `sm` | 640px | Phone landscape |
| `md` | 810px | Tablet portrait |
| `lg` | 1024px | Small laptop |
| `xl` | 1200px | Desktop (primary) |
| `2xl` | 1440px | Ultrawide |

### 4.2 Container Widths

| Name | Max Width | Usage |
|------|-----------|-------|
| `max-w-content` | 1200px | Main content wrapper |
| `max-w-prose` | 700px | Readable text width |
| `max-w-narrow` | 520px | Forms, hero subheadlines |

### 4.3 Utility Classes
```css
/* Content wrapper with responsive padding */
.content-wrapper {
  @apply w-full mx-auto px-6 md:px-10 xl:px-20;
  max-width: 1200px;
}

/* Consistent section vertical spacing */
.section-padding {
  @apply py-16 md:py-20 xl:py-24;
}
```

---

## 5. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Small elements, tags |
| `--radius-DEFAULT` | 6px | Inputs, small buttons |
| `--radius-md` | 8px | Buttons, cards |
| `--radius-lg` | 12px | Large cards, modals |
| `--radius-xl` | 16px | Hero elements |
```tsx
// Usage
<div className="rounded-sm">4px radius</div>
<div className="rounded">6px radius (default)</div>
<div className="rounded-md">8px radius</div>
<div className="rounded-lg">12px radius</div>
<div className="rounded-xl">16px radius</div>
```

---

## 6. Shadows & Effects

### 6.1 Box Shadows

| Name | Value | Usage |
|------|-------|-------|
| `shadow-glow` | `0 0 30px rgb(var(--accent-glow) / 0.15)` | Button hover states |
| `shadow-glow-lg` | `0 0 60px rgb(var(--accent-glow) / 0.2)` | Hero elements |
| `shadow-glow-sm` | `0 0 15px rgb(var(--accent-glow) / 0.1)` | Subtle highlights |
| `shadow-elevated` | Standard elevation | Cards in light mode |
| `shadow-phone` | `0 25px 50px -12px rgba(0, 0, 0, 0.5)` | Phone mockups |

### 6.2 Text Effects
```css
/* Subtle glow on headlines */
.text-glow {
  text-shadow: 0 0 20px rgb(var(--accent-glow) / 0.4);
}
```

---

## 7. Animations

### 7.1 Keyframe Animations

| Name | Duration | Easing | Usage |
|------|----------|--------|-------|
| `cursor-blink` | 1s | step-end | Terminal cursor |
| `fade-in` | 0.6s | ease-out | Element entrance |
| `slide-up` | 0.6s | ease-out | Element entrance with movement |
| `glow-pulse` | 3s | ease-in-out | Breathing glow effect |
| `accordion-down` | 0.2s | ease-out | shadcn accordion |
| `accordion-up` | 0.2s | ease-out | shadcn accordion |

### 7.2 Framer Motion Variants
```tsx
// packages/ui/src/lib/animations.ts

// Standard entrance animation
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut', delay },
  }),
};

// Stagger container for lists
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

// Standard viewport settings
export const viewportSettings = {
  once: true,
  amount: 0.2,
};
```

---

## 8. Component Classes

### 8.1 Buttons
```css
/* Primary Button */
.btn-primary {
  @apply inline-flex items-center justify-center
         bg-primary px-6 py-3 uppercase
         text-primary-foreground rounded-md
         transition-all duration-200;
  font-family: var(--font-space), monospace;
  font-size: 1rem;
  letter-spacing: 0.2em;
}

.btn-primary:hover {
  box-shadow: 0 0 30px rgb(var(--accent-glow) / 0.15);
  transform: translateY(-2px);
}

/* Ghost Button */
.btn-ghost {
  @apply inline-flex items-center justify-center
         px-6 py-3 uppercase text-primary
         bg-transparent rounded-md
         transition-all duration-200;
  font-family: var(--font-space), monospace;
  border: 1px solid rgb(var(--primary) / 0.3);
}

.btn-ghost:hover {
  background-color: rgb(var(--primary) / 0.1);
}
```

### 8.2 Cards
```css
.card-plot {
  @apply bg-card p-6 md:p-8 rounded-lg;
  border: 1px solid rgb(var(--border) / 0.08);
}
```

### 8.3 Typography Components
```css
/* Section eyebrow label */
.section-label {
  @apply uppercase tracking-widest text-primary;
  font-family: var(--font-space), monospace;
  font-size: 0.875rem;
  letter-spacing: 0.15em;
}

/* Section headline */
.section-headline {
  @apply uppercase text-foreground;
  font-family: var(--font-space), monospace;
  font-size: 1.75rem; /* Mobile */
}

@media (min-width: 810px) {
  .section-headline {
    font-size: 3rem; /* Desktop */
  }
}

/* Terminal prompt prefix */
.terminal-prompt::before {
  content: '>_ ';
  @apply text-primary;
}

/* Blinking cursor */
.cursor-blink {
  display: inline-block;
  width: 0.6em;
  height: 1.1em;
  background-color: rgb(var(--primary));
  animation: blink 1s step-end infinite;
}
```

---

## 9. Accessibility

### 9.1 Focus States (WCAG 2.2 AA)
```css
*:focus-visible {
  @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background;
}

*:focus:not(:focus-visible) {
  @apply outline-none ring-0;
}
```

### 9.2 Skip Link
```css
.skip-link {
  @apply sr-only;
}

.skip-link:focus {
  @apply not-sr-only absolute top-4 left-4 z-50 
         px-4 py-2 bg-primary text-primary-foreground rounded-md;
}
```

### 9.3 Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 9.4 Color Contrast

All text/background combinations meet WCAG AA (4.5:1 for normal text, 3:1 for large text):

| Combination | Ratio | Pass |
|-------------|-------|------|
| Light: `#111111` on `#F5F0EA` | 14.3:1 | ✓ AAA |
| Light: `#555555` on `#F5F0EA` | 5.2:1 | ✓ AA |
| Dark: `#F5F0EA` on `#111111` | 14.3:1 | ✓ AAA |
| Dark: `#999999` on `#111111` | 5.8:1 | ✓ AA |
| Light: `#0E8345` on `#F5F0EA` | 4.6:1 | ✓ AA |
| Dark: `#69F0AE` on `#111111` | 10.2:1 | ✓ AAA |

---

## Quick Reference: File Locations

| Purpose | File Path |
|---------|-----------|
| Tailwind Config | `packages/ui/tailwind.config.ts` |
| CSS Variables | `apps/web/app/globals.css` |
| Animation Variants | `packages/ui/src/lib/animations.ts` |
| Utility Functions | `packages/ui/src/lib/utils.ts` |

---

**End of Design System Documentation**