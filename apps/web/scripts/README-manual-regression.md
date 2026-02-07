# Manual regression test accounts

Two accounts for **manual** regression testing only (local and pre-production / dev-db). They are **not** used by any automated tests. Both start with a clean slate (email + password only) so you can run through onboarding every time.

| Account | Email | Purpose |
|--------|--------|--------|
| Solo | `manual-solo@plotbudget.test` | Solo household (after onboarding) |
| Couple | `manual-couple@plotbudget.test` | Couple household (after onboarding) |

## One-time setup

1. **Create auth users** in Supabase Dashboard (Auth → Users):
   - `manual-solo@plotbudget.test` (e.g. password: `ManualSolo123!`)
   - `manual-couple@plotbudget.test` (e.g. password: `ManualCouple123!`)

2. **Run the seed** (no UUIDs to replace — it reads IDs from `auth.users`):
   ```bash
   psql "$DEV_DATABASE_URL" -f apps/web/scripts/seed-manual-regression.sql
   ```

This creates `public.users` rows only (no households). When you log in, the app sends you to onboarding.

## Reset (clean slate for another regression run)

Wipes all app data for these two users and resets their profile so the next login goes to onboarding again.

```bash
psql "$DEV_DATABASE_URL" -f apps/web/scripts/reset-manual-regression.sql
```

## Do not

- Run these scripts on production.
- Add `manual-solo@plotbudget.test` or `manual-couple@plotbudget.test` to the e2e test cleanup list (see `tests/utils/db-cleanup.ts`).
