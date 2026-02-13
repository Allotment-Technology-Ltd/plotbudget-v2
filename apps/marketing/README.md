# PLOT Marketing Site

**plotbudget.com** — Early Access Landing Page

A single-page React application for the PLOT budgeting app waitlist, built with Vite, Tailwind CSS, and Framer Motion. Part of the PlotBudget monorepo as `apps/marketing`.

---

## Quick Start (Monorepo)

```bash
# From the monorepo root:
pnpm install
pnpm dev
# → Web app: http://localhost:3000
# → Marketing: http://localhost:3001

# Or run marketing only:
cd apps/marketing && pnpm dev
```

For local MailerLite testing, copy `.env.example` to `.env` in `apps/marketing/` and add your `MAILERLITE_API_KEY`.

---

## Architecture

```
plot-marketing/
├── api/
│   └── subscribe.js          # Vercel serverless function (MailerLite proxy)
├── public/
│   ├── favicon.svg            # PLOT # brand mark
│   └── screenshots/           # App screenshots for phone mockups
│       ├── dashboard-dark.png
│       ├── dashboard-light.png
│       ├── blueprint-dark.png  (optional)
│       ├── blueprint-light.png (optional)
│       ├── ritual-dark.png     (optional)
│       └── ritual-light.png    (optional)
├── src/
│   ├── main.jsx               # React entry (HelmetProvider)
│   ├── index.css              # Tailwind + CSS variables + custom styles
│   ├── App.jsx                # All sections + animation orchestration
│   ├── hooks/
│   │   └── useTheme.js        # Dark/light theme management
│   └── components/
│       ├── SEO.jsx            # Dynamic meta tags + Schema.org
│       ├── Navbar.jsx         # Sticky nav + theme toggle
│       └── MailerLiteForm.jsx # Email form with state machine
├── tailwind.config.js         # Custom breakpoints, colors, typography
├── vite.config.js             # Build config
├── postcss.config.js
├── package.json
├── .env.example
└── index.html                 # Entry HTML with FOUC prevention
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| CSS custom properties for colours | One class per element (e.g. `bg-plot-bg`) auto-swaps on theme change. No `dark:` prefixes cluttering markup. |
| Serverless proxy for MailerLite | API key stays server-side. No CORS issues. Works on Vercel's free tier. |
| FOUC prevention script in `<head>` | Inline script applies `.dark` before first paint — no flash of wrong theme. |
| Framer Motion `whileInView` | Sections animate on scroll-reveal. `viewport: { once: true }` prevents re-triggering. |
| `prefers-reduced-motion` respected | All animations disabled globally for users who request it. |
| 0px border-radius everywhere | Enforces the terminal/cyberpunk aesthetic from the PLOT app. |

---

## Adding Your Screenshots

1. Export screenshots from FlutterFlow at 2× resolution
2. Compress via [TinyPNG](https://tinypng.com/) (aim for <200KB each)
3. Place in `public/screenshots/`:
   - `dashboard-dark.png` — Main dashboard, dark theme
   - `dashboard-light.png` — Main dashboard, light theme
4. The phone mockups in the App Showcase section reference these paths
5. For additional pairs (Blueprint, Ritual), uncomment the optional block in `App.jsx` → `AppShowcase`

---

## MailerLite Setup

### Step 1: Get Your API Key
1. Log into [MailerLite Dashboard](https://dashboard.mailerlite.com)
2. Go to **Integrations** → **API**
3. Copy your API key

### Step 2: Set Environment Variables

**Local development:** Add to `.env`:
```
MAILERLITE_API_KEY=your_key_here
MAILERLITE_GROUP_ID=optional_group_id
```

**Vercel deployment:** Add via Dashboard → Settings → Environment Variables

### Step 3: Test
1. Run `npx vercel dev` (for local serverless function testing)
2. Submit a test email in the hero form
3. Check your MailerLite audience for the new subscriber

### Direct API Fallback
If you don't want to use a serverless proxy (e.g. during early dev), you can temporarily call MailerLite directly from the client. In `MailerLiteForm.jsx`, change the fetch URL:

```js
// Replace this:
const response = await fetch('/api/subscribe', { ... });

// With this (NOT recommended for production):
const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_MAILERLITE_API_KEY}`,
  },
  body: JSON.stringify({ email: trimmed }),
});
```

⚠️ This exposes your API key in the client bundle. Only use for local testing.

---

## Deployment (Vercel)

The marketing site deploys as a **separate Vercel project** with Root Directory set to `apps/marketing`.

**Vercel project settings:**
1. Root Directory: `apps/marketing`
2. Build Command: `pnpm run build`
3. Output Directory: `dist`
4. Install Command: `pnpm install` (Vercel runs this from monorepo root)

**Environment variables** (Vercel dashboard):
- `MAILERLITE_API_KEY` — your key
- `MAILERLITE_GROUP_ID` — optional group ID

**Connect your domain:** Dashboard → Settings → Domains → Add plotbudget.com

Vercel automatically:
- Builds the Vite project
- Serves the SPA
- Routes `/api/subscribe` to the serverless function
- Provisions SSL for your custom domain
- Deploys to a global CDN

---

## Theme System

The dual-mode theme is managed by three cooperating systems:

1. **CSS Custom Properties** (`src/index.css`)
   - `:root` = light mode values
   - `.dark` = dark mode values

2. **`useTheme` Hook** (`src/hooks/useTheme.js`)
   - Reads localStorage → OS preference → defaults to light
   - Toggles `.dark` class on `<html>`
   - Persists choice to localStorage

3. **FOUC Prevention** (`index.html`)
   - Inline `<script>` applies `.dark` before React mounts
   - User never sees a flash of the wrong theme

### Adding New Theme-Aware Colours

1. Add CSS variable to both `:root` and `.dark` in `src/index.css`
2. Reference it in `tailwind.config.js` under `extend.colors.plot`
3. Use in markup: `bg-plot-newcolor` or `text-plot-newcolor`

---

## Responsive Breakpoints

| Name | Width | Target Device |
|------|-------|---------------|
| `xs` | 390px | iPhone SE / Mini |
| `sm` | 640px | Standard phone landscape |
| `md` | 810px | Tablet portrait (iPad) |
| `lg` | 1024px | Small laptop |
| `xl` | 1200px | Desktop (primary canvas) |
| `2xl` | 1440px | Ultrawide |

Usage: `md:text-headline` applies from 810px upward.

---

## Performance Checklist

- [ ] All screenshots compressed (<200KB each)
- [ ] Google Fonts preconnected in `<head>`
- [ ] Images use `loading="lazy"` (below fold)
- [ ] Framer Motion tree-shaken via Vite's manual chunks
- [ ] No videos on initial load
- [ ] Vercel CDN provides global edge caching
- [ ] Scanline CSS effect uses zero JavaScript

---

## Accessibility Checklist

- [x] Skip-to-content link (keyboard/screen reader)
- [x] Semantic HTML (`<nav>`, `<main>`, `<section>`, `<footer>`)
- [x] Single `<h1>` (hero headline only)
- [x] `aria-labelledby` on all sections
- [x] `aria-expanded` + `aria-controls` on FAQ accordion
- [x] `aria-label` on all buttons and nav links
- [x] `role="alert"` on form error messages
- [x] Form labels (`<label>` with `htmlFor` + `sr-only`)
- [x] Focus-visible styles (green outline, visible for keyboard users)
- [x] Reduced motion support (`prefers-reduced-motion`)
- [x] Colour contrast meets WCAG AA in both themes

---

## Rive Integration (Optional, Post-Launch)

The project is structured to accept Rive animations. Potential placements:

1. **Hero typing effect** — Replace `TerminalHeadline` with a Rive canvas
2. **Solution step checkmarks** — Rive check animation on scroll
3. **Logo animation** — Rive wordmark assembly on page load

To integrate:
```bash
npm install @rive-app/react-canvas
```

Then replace the relevant JSX with `<RiveComponent>` instances.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (port 3000) |
| `npm run build` | Production build → `/dist` |
| `npm run preview` | Preview production build locally |

---

## Licence

Private — PLOT Budget Ltd. All rights reserved.
