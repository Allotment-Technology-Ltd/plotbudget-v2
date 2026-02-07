-- Reset manual regression accounts to a clean slate (local + pre-production only).
-- DO NOT RUN ON PRODUCTION.
--
-- Deletes all app data for manual-solo@ and manual-couple@ (households, paycycles,
-- seeds, pots, repayments, income_sources) and resets their public.users rows so
-- they have no household and onboarding is not complete. Next login sends them
-- through onboarding again.
--
-- Requires public.users rows to exist (run seed-manual-regression.sql first if needed).
-- Usage:
--   psql "$DEV_DATABASE_URL" -f apps/web/scripts/reset-manual-regression.sql

-- =============================================================================
-- 1. Delete app data (dependency order)
-- =============================================================================

DELETE FROM public.seeds
WHERE paycycle_id IN (
  SELECT p.id FROM public.paycycles p
  JOIN public.households h ON h.id = p.household_id
  JOIN public.users u ON u.id = h.owner_id
  WHERE u.email IN ('manual-solo@plotbudget.test', 'manual-couple@plotbudget.test')
);

DELETE FROM public.paycycles
WHERE household_id IN (
  SELECT h.id FROM public.households h
  JOIN public.users u ON u.id = h.owner_id
  WHERE u.email IN ('manual-solo@plotbudget.test', 'manual-couple@plotbudget.test')
);

DELETE FROM public.income_sources
WHERE household_id IN (
  SELECT h.id FROM public.households h
  JOIN public.users u ON u.id = h.owner_id
  WHERE u.email IN ('manual-solo@plotbudget.test', 'manual-couple@plotbudget.test')
);

DELETE FROM public.pots
WHERE household_id IN (
  SELECT h.id FROM public.households h
  JOIN public.users u ON u.id = h.owner_id
  WHERE u.email IN ('manual-solo@plotbudget.test', 'manual-couple@plotbudget.test')
);

DELETE FROM public.repayments
WHERE household_id IN (
  SELECT h.id FROM public.households h
  JOIN public.users u ON u.id = h.owner_id
  WHERE u.email IN ('manual-solo@plotbudget.test', 'manual-couple@plotbudget.test')
);

DELETE FROM public.households
WHERE owner_id IN (
  SELECT id FROM public.users
  WHERE email IN ('manual-solo@plotbudget.test', 'manual-couple@plotbudget.test')
);

-- =============================================================================
-- 2. Reset users to onboarding state (no household, not completed)
-- =============================================================================

UPDATE public.users
SET
  household_id = NULL,
  current_paycycle_id = NULL,
  monthly_income = 0,
  onboarding_step = 0,
  has_completed_onboarding = false,
  updated_at = now()
WHERE email IN ('manual-solo@plotbudget.test', 'manual-couple@plotbudget.test');
