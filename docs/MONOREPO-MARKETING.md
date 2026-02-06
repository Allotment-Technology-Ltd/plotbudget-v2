# Monorepo: Marketing Site Integration

The marketing site (plotbudget.com) lives in `apps/marketing` as part of the PlotBudget monorepo.

## Structure

```
plotbudget/
├── apps/
│   ├── web/          # Next.js app — app.plotbudget.com
│   └── marketing/    # Vite + React — plotbudget.com
├── packages/
│   └── ...
└── turbo.json
```

## Commands

```bash
# Install (from root)
pnpm install

# Run both apps
pnpm dev
# → Web: http://localhost:3000
# → Marketing: http://localhost:3001

# Run marketing only
pnpm dev --filter=@repo/marketing

# Build all
pnpm turbo run build

# Build marketing only
pnpm turbo run build --filter=@repo/marketing
```

## Vercel Deployment

**Separate Vercel projects** for each app:

| Project   | Root Directory | Domain              |
|-----------|----------------|---------------------|
| App       | (root)         | app.plotbudget.com  |
| Marketing | apps/marketing | plotbudget.com      |

For the **marketing** Vercel project:

1. Root Directory: `apps/marketing`
2. Build Command: `pnpm run build`
3. Output Directory: `dist`
4. Install Command: `pnpm install` (runs from monorepo root)
5. Environment variables: `MAILERLITE_API_KEY`, `MAILERLITE_GROUP_ID`, `VITE_GA_MEASUREMENT_ID`

See `apps/marketing/README.md` for full deployment details.
