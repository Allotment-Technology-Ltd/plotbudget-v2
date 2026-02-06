-- Seed test users and households for DEVELOPMENT ONLY
-- DO NOT RUN ON PRODUCTION
--
-- Usage (dev DB only):
--   psql "$DEV_DATABASE_URL" -f apps/web/scripts/seed-test-data.sql
--
-- Auth users: Create these first via the app signup flow, or in Supabase Dashboard
-- (Auth → Users → Add user). Then run this script to seed public.users and
-- public.households for the same UUIDs. Alternatively, if using local Supabase
-- with auth.users accessible, uncomment and adapt the auth.users section below.

-- =============================================================================
-- PUBLIC.USERS (profiles) – match IDs to auth.users created via app or Dashboard
-- =============================================================================

-- Solo test user (solo@plotbudget.test)
INSERT INTO public.users (
  id, email, household_id, monthly_income, onboarding_step, has_completed_onboarding,
  subscription_tier, created_at, updated_at
)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'solo@plotbudget.test',
  '11111111-1111-1111-1111-111111111111',
  2500,
  6,
  true,
  'free',
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  household_id = EXCLUDED.household_id,
  monthly_income = EXCLUDED.monthly_income,
  onboarding_step = EXCLUDED.onboarding_step,
  has_completed_onboarding = EXCLUDED.has_completed_onboarding,
  updated_at = now();

-- Couple test user (couple@plotbudget.test)
INSERT INTO public.users (
  id, email, household_id, monthly_income, onboarding_step, has_completed_onboarding,
  subscription_tier, created_at, updated_at
)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'couple@plotbudget.test',
  '22222222-2222-2222-2222-222222222222',
  3000,
  6,
  true,
  'free',
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  household_id = EXCLUDED.household_id,
  monthly_income = EXCLUDED.monthly_income,
  onboarding_step = EXCLUDED.onboarding_step,
  has_completed_onboarding = EXCLUDED.has_completed_onboarding,
  updated_at = now();

-- =============================================================================
-- PUBLIC.HOUSEHOLDS
-- =============================================================================

-- Solo household
INSERT INTO public.households (
  id, owner_id, is_couple, partner_income, total_monthly_income,
  needs_percent, wants_percent, savings_percent, repay_percent,
  pay_cycle_type, joint_ratio, created_at, updated_at
)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  false,
  0,
  2500,
  50,
  30,
  15,
  5,
  'specific_date',
  0,
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  owner_id = EXCLUDED.owner_id,
  is_couple = EXCLUDED.is_couple,
  total_monthly_income = EXCLUDED.total_monthly_income,
  updated_at = now();

-- Couple household
INSERT INTO public.households (
  id, owner_id, is_couple, partner_name, partner_income, total_monthly_income,
  needs_percent, wants_percent, savings_percent, repay_percent,
  pay_cycle_type, joint_ratio, created_at, updated_at
)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222222',
  true,
  'Jamie',
  2500,
  5500,
  50,
  30,
  15,
  5,
  'specific_date',
  55,
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  owner_id = EXCLUDED.owner_id,
  is_couple = EXCLUDED.is_couple,
  partner_name = EXCLUDED.partner_name,
  partner_income = EXCLUDED.partner_income,
  total_monthly_income = EXCLUDED.total_monthly_income,
  updated_at = now();

-- =============================================================================
-- AUTH.USERS (Supabase Auth)
-- If your Supabase project allows SQL inserts into auth.users (e.g. local or
-- SQL Editor), you can create auth users with the same IDs and password
-- 'test-password-123'. Otherwise create solo@plotbudget.test and
-- couple@plotbudget.test via Dashboard (Auth → Users → Add user) or via the
-- app signup, then update public.users id to match the returned auth.uid().
-- =============================================================================
