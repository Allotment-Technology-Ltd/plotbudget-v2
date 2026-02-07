-- Manual regression test accounts (local + pre-production / dev-db only).
-- DO NOT RUN ON PRODUCTION. Not used by any automated tests.
--
-- Creates public.users rows only (no households). Users start in onboarding state:
-- log in with email/password and you go through onboarding each time.
--
-- SETUP (one-time):
--   1. In Supabase Dashboard (Auth → Users) create two users:
--      - manual-solo@plotbudget.test   (e.g. password: ManualSolo123!)
--      - manual-couple@plotbudget.test (e.g. password: ManualCouple123!)
--   2. Run this script (it reads IDs from auth.users — no placeholders to replace):
--      psql "$DEV_DATABASE_URL" -f apps/web/scripts/seed-manual-regression.sql
--
-- RESET (clean slate so you can run onboarding again):
--   psql "$DEV_DATABASE_URL" -f apps/web/scripts/reset-manual-regression.sql
--
-- Emails are distinct from e2e users (solo@, couple@, etc.) so test cleanup never touches these.

-- =============================================================================
-- PUBLIC.USERS (profiles) — pull IDs from auth.users; no household, onboarding not complete
-- =============================================================================

INSERT INTO public.users (
  id, email, display_name, household_id, current_paycycle_id, monthly_income,
  onboarding_step, has_completed_onboarding, subscription_tier, created_at, updated_at
)
SELECT
  au.id,
  au.email,
  CASE au.email
    WHEN 'manual-solo@plotbudget.test' THEN 'Manual Solo'
    WHEN 'manual-couple@plotbudget.test' THEN 'Manual Couple'
    ELSE NULL
  END,
  NULL,
  NULL,
  0,
  0,
  false,
  'free',
  now(),
  now()
FROM auth.users au
WHERE au.email IN ('manual-solo@plotbudget.test', 'manual-couple@plotbudget.test')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  display_name = EXCLUDED.display_name,
  household_id = EXCLUDED.household_id,
  current_paycycle_id = EXCLUDED.current_paycycle_id,
  monthly_income = EXCLUDED.monthly_income,
  onboarding_step = EXCLUDED.onboarding_step,
  has_completed_onboarding = EXCLUDED.has_completed_onboarding,
  updated_at = now();
