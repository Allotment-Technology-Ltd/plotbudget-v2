\set ON_ERROR_STOP on
-- Seed trial/grace period test users for manual testing.
-- DEVELOPMENT ONLY — DO NOT RUN ON PRODUCTION
--
-- Prerequisites:
--   1. Run trial tracking migration: 20250213090000_trial_tracking.sql
--   2. Create auth users first via Supabase Dashboard (Auth → Users → Add user)
--      with emails: trial-milestone@plotbudget.test, trial-ending@plotbudget.test,
--      trial-ended@plotbudget.test, trial-grace@plotbudget.test, trial-archive@plotbudget.test
--      Use password: test-password-123
--
-- Usage (dev DB only):
--   psql "$DEV_DATABASE_URL" -f apps/web/scripts/seed-trial-test-users.sql
--
-- This script reads user IDs from auth.users — no placeholders to replace.
-- Scenario mapping: trial-milestone (1 cycle) | trial-ending (ending soon) |
-- trial-ended (over limits) | trial-grace (day 6) | trial-archive (day 8)

-- Fixed household IDs (one per trial user, mapped by email)
-- trial-milestone -> aaaaaaaa-1111... | trial-ending -> aaaaaaaa-2222... | etc.

-- Check that auth users exist
DO $$
BEGIN
  IF (SELECT count(*) FROM auth.users WHERE email IN (
    'trial-milestone@plotbudget.test', 'trial-ending@plotbudget.test', 'trial-ended@plotbudget.test',
    'trial-grace@plotbudget.test', 'trial-archive@plotbudget.test'
  )) = 0
  THEN
    RAISE EXCEPTION 'No auth users found. Create the 5 trial users in Supabase Dashboard (Auth → Users → Add user): trial-milestone@plotbudget.test, trial-ending@plotbudget.test, trial-ended@plotbudget.test, trial-grace@plotbudget.test, trial-archive@plotbudget.test. Use password: test-password-123';
  END IF;
END $$;

-- =============================================================================
-- PUBLIC.USERS (profiles) — pull IDs from auth.users, set trial state
-- =============================================================================

INSERT INTO public.users (
  id, email, household_id, monthly_income, onboarding_step, has_completed_onboarding,
  subscription_tier, trial_cycles_completed, trial_ended_at, grace_period_start,
  trial_milestone_email_sent, trial_ending_email_sent, trial_ended_email_sent, grace_period_reminder_sent,
  created_at, updated_at
)
SELECT
  au.id,
  au.email,
  NULL,
  2500, 6, true, 'free',
  CASE au.email
    WHEN 'trial-milestone@plotbudget.test' THEN 1
    WHEN 'trial-ending@plotbudget.test' THEN 1
    ELSE 2
  END,
  CASE WHEN au.email IN ('trial-ended@plotbudget.test', 'trial-grace@plotbudget.test', 'trial-archive@plotbudget.test') THEN now() ELSE NULL END,
  NULL,
  false, false,
  CASE WHEN au.email IN ('trial-ended@plotbudget.test', 'trial-grace@plotbudget.test', 'trial-archive@plotbudget.test') THEN true ELSE false END,
  CASE WHEN au.email = 'trial-archive@plotbudget.test' THEN true ELSE false END,
  now(), now()
FROM auth.users au
WHERE au.email IN (
  'trial-milestone@plotbudget.test', 'trial-ending@plotbudget.test', 'trial-ended@plotbudget.test',
  'trial-grace@plotbudget.test', 'trial-archive@plotbudget.test'
)
ON CONFLICT (id) DO UPDATE SET
  trial_cycles_completed = EXCLUDED.trial_cycles_completed,
  trial_ended_at = COALESCE(EXCLUDED.trial_ended_at, public.users.trial_ended_at),
  grace_period_start = COALESCE(EXCLUDED.grace_period_start, public.users.grace_period_start),
  trial_milestone_email_sent = EXCLUDED.trial_milestone_email_sent,
  trial_ending_email_sent = EXCLUDED.trial_ending_email_sent,
  trial_ended_email_sent = EXCLUDED.trial_ended_email_sent,
  grace_period_reminder_sent = EXCLUDED.grace_period_reminder_sent,
  updated_at = now();

-- Override trial_ended_at and grace_period_start for trial-grace (6 days ago) and trial-archive (8 days ago)
UPDATE public.users SET trial_ended_at = now() - INTERVAL '6 days', grace_period_start = now() - INTERVAL '6 days'
WHERE email = 'trial-grace@plotbudget.test';
UPDATE public.users SET trial_ended_at = now() - INTERVAL '8 days', grace_period_start = now() - INTERVAL '8 days'
WHERE email = 'trial-archive@plotbudget.test';
UPDATE public.users SET trial_ended_at = now(), grace_period_start = now()
WHERE email = 'trial-ended@plotbudget.test';

-- =============================================================================
-- HOUSEHOLDS (one per user) — owner_id from public.users
-- =============================================================================

INSERT INTO public.households (
  id, owner_id, is_couple, partner_income, total_monthly_income,
  needs_percent, wants_percent, savings_percent, repay_percent,
  pay_cycle_type, pay_day, joint_ratio, created_at, updated_at
)
SELECT
  CASE u.email
    WHEN 'trial-milestone@plotbudget.test' THEN 'aaaaaaaa-1111-1111-1111-111111111111'::uuid
    WHEN 'trial-ending@plotbudget.test' THEN 'aaaaaaaa-2222-2222-2222-222222222222'::uuid
    WHEN 'trial-ended@plotbudget.test' THEN 'aaaaaaaa-3333-3333-3333-333333333333'::uuid
    WHEN 'trial-grace@plotbudget.test' THEN 'aaaaaaaa-4444-4444-4444-444444444444'::uuid
    WHEN 'trial-archive@plotbudget.test' THEN 'aaaaaaaa-5555-5555-5555-555555555555'::uuid
  END,
  u.id, false, 0, 2500, 50, 30, 15, 5, 'specific_date', 25, 0, now(), now()
FROM public.users u
WHERE u.email IN (
  'trial-milestone@plotbudget.test', 'trial-ending@plotbudget.test', 'trial-ended@plotbudget.test',
  'trial-grace@plotbudget.test', 'trial-archive@plotbudget.test'
)
ON CONFLICT (id) DO UPDATE SET
  owner_id = EXCLUDED.owner_id,
  total_monthly_income = EXCLUDED.total_monthly_income,
  updated_at = now();

-- Link users to households
UPDATE public.users u SET household_id = CASE u.email
  WHEN 'trial-milestone@plotbudget.test' THEN 'aaaaaaaa-1111-1111-1111-111111111111'::uuid
  WHEN 'trial-ending@plotbudget.test' THEN 'aaaaaaaa-2222-2222-2222-222222222222'::uuid
  WHEN 'trial-ended@plotbudget.test' THEN 'aaaaaaaa-3333-3333-3333-333333333333'::uuid
  WHEN 'trial-grace@plotbudget.test' THEN 'aaaaaaaa-4444-4444-4444-444444444444'::uuid
  WHEN 'trial-archive@plotbudget.test' THEN 'aaaaaaaa-5555-5555-5555-555555555555'::uuid
END
WHERE u.email IN (
  'trial-milestone@plotbudget.test', 'trial-ending@plotbudget.test', 'trial-ended@plotbudget.test',
  'trial-grace@plotbudget.test', 'trial-archive@plotbudget.test'
);

-- =============================================================================
-- PAYCYCLES
-- =============================================================================

-- trial-milestone: 1 completed + 1 active (so cycle switchover can be simulated)
INSERT INTO public.paycycles (
  id, household_id, status, start_date, end_date,
  total_income, total_allocated, ritual_closed_at, created_at, updated_at
)
SELECT
  'bbbbbbbb-1111-1111-1111-111111111111'::uuid,
  'aaaaaaaa-1111-1111-1111-111111111111'::uuid,
  'completed',
  (CURRENT_DATE - INTERVAL '30 days')::date,
  (CURRENT_DATE - INTERVAL '1 day')::date,
  2500, 2000,
  now() - INTERVAL '1 day',
  now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.paycycles WHERE id = 'bbbbbbbb-1111-1111-1111-111111111111');

INSERT INTO public.paycycles (
  id, household_id, status, start_date, end_date,
  total_income, total_allocated, created_at, updated_at
)
SELECT
  'bbbbbbbb-1111-1111-1111-111111111112'::uuid,
  'aaaaaaaa-1111-1111-1111-111111111111'::uuid,
  'active',
  CURRENT_DATE,
  (CURRENT_DATE + INTERVAL '28 days')::date,
  2500, 0,
  now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.paycycles WHERE id = 'bbbbbbbb-1111-1111-1111-111111111112');

-- trial-ended: 2 completed cycles
INSERT INTO public.paycycles (
  id, household_id, status, start_date, end_date,
  total_income, total_allocated, ritual_closed_at, created_at, updated_at
)
SELECT
  'bbbbbbbb-3333-3333-3333-333333333301'::uuid,
  'aaaaaaaa-3333-3333-3333-333333333333'::uuid,
  'completed',
  (CURRENT_DATE - INTERVAL '60 days')::date,
  (CURRENT_DATE - INTERVAL '31 days')::date,
  2500, 2000,
  now() - INTERVAL '31 days',
  now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.paycycles WHERE id = 'bbbbbbbb-3333-3333-3333-333333333301');

INSERT INTO public.paycycles (
  id, household_id, status, start_date, end_date,
  total_income, total_allocated, ritual_closed_at, created_at, updated_at
)
SELECT
  'bbbbbbbb-3333-3333-3333-333333333302'::uuid,
  'aaaaaaaa-3333-3333-3333-333333333333'::uuid,
  'completed',
  (CURRENT_DATE - INTERVAL '30 days')::date,
  (CURRENT_DATE - INTERVAL '1 day')::date,
  2500, 2000,
  now() - INTERVAL '1 day',
  now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.paycycles WHERE id = 'bbbbbbbb-3333-3333-3333-333333333302');

-- trial-ending: 1 completed + 1 active (ending in 3 days)
INSERT INTO public.paycycles (
  id, household_id, status, start_date, end_date,
  total_income, total_allocated, ritual_closed_at, created_at, updated_at
)
SELECT
  'bbbbbbbb-2222-2222-2222-222222222201'::uuid,
  'aaaaaaaa-2222-2222-2222-222222222222'::uuid,
  'completed',
  (CURRENT_DATE - INTERVAL '30 days')::date,
  (CURRENT_DATE - INTERVAL '4 days')::date,
  2500, 2000,
  now() - INTERVAL '4 days',
  now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.paycycles WHERE id = 'bbbbbbbb-2222-2222-2222-222222222201');

INSERT INTO public.paycycles (
  id, household_id, status, start_date, end_date,
  total_income, total_allocated, created_at, updated_at
)
SELECT
  'bbbbbbbb-2222-2222-2222-222222222202'::uuid,
  'aaaaaaaa-2222-2222-2222-222222222222'::uuid,
  'active',
  (CURRENT_DATE - INTERVAL '3 days')::date,
  (CURRENT_DATE + INTERVAL '3 days')::date,
  2500, 0,
  now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.paycycles WHERE id = 'bbbbbbbb-2222-2222-2222-222222222202');

-- trial-grace, trial-archive: 2 completed cycles each
INSERT INTO public.paycycles (
  id, household_id, status, start_date, end_date,
  total_income, total_allocated, ritual_closed_at, created_at, updated_at
)
SELECT
  'bbbbbbbb-4444-4444-4444-444444444401'::uuid,
  'aaaaaaaa-4444-4444-4444-444444444444'::uuid,
  'completed',
  (CURRENT_DATE - INTERVAL '60 days')::date,
  (CURRENT_DATE - INTERVAL '31 days')::date,
  2500, 2000,
  now() - INTERVAL '31 days',
  now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.paycycles WHERE id = 'bbbbbbbb-4444-4444-4444-444444444401');

INSERT INTO public.paycycles (
  id, household_id, status, start_date, end_date,
  total_income, total_allocated, ritual_closed_at, created_at, updated_at
)
SELECT
  'bbbbbbbb-4444-4444-4444-444444444402'::uuid,
  'aaaaaaaa-4444-4444-4444-444444444444'::uuid,
  'completed',
  (CURRENT_DATE - INTERVAL '30 days')::date,
  (CURRENT_DATE - INTERVAL '7 days')::date,
  2500, 2000,
  now() - INTERVAL '7 days',
  now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.paycycles WHERE id = 'bbbbbbbb-4444-4444-4444-444444444402');

INSERT INTO public.paycycles (
  id, household_id, status, start_date, end_date,
  total_income, total_allocated, ritual_closed_at, created_at, updated_at
)
SELECT
  'bbbbbbbb-5555-5555-5555-555555555501'::uuid,
  'aaaaaaaa-5555-5555-5555-555555555555'::uuid,
  'completed',
  (CURRENT_DATE - INTERVAL '60 days')::date,
  (CURRENT_DATE - INTERVAL '31 days')::date,
  2500, 2000,
  now() - INTERVAL '31 days',
  now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.paycycles WHERE id = 'bbbbbbbb-5555-5555-5555-555555555501');

INSERT INTO public.paycycles (
  id, household_id, status, start_date, end_date,
  total_income, total_allocated, ritual_closed_at, created_at, updated_at
)
SELECT
  'bbbbbbbb-5555-5555-5555-555555555502'::uuid,
  'aaaaaaaa-5555-5555-5555-555555555555'::uuid,
  'completed',
  (CURRENT_DATE - INTERVAL '30 days')::date,
  (CURRENT_DATE - INTERVAL '9 days')::date,
  2500, 2000,
  now() - INTERVAL '9 days',
  now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.paycycles WHERE id = 'bbbbbbbb-5555-5555-5555-555555555502');

-- =============================================================================
-- POTS (for over-limits: trial-ended has 3 pots, free tier = 2)
-- =============================================================================

INSERT INTO public.pots (
  id, household_id, name, current_amount, target_amount, status, created_at, updated_at
)
SELECT
  'cccccccc-3333-3333-3333-333333333301'::uuid,
  'aaaaaaaa-3333-3333-3333-333333333333'::uuid,
  'Emergency Fund',
  500, 5000, 'active',
  now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.pots WHERE id = 'cccccccc-3333-3333-3333-333333333301');

INSERT INTO public.pots (
  id, household_id, name, current_amount, target_amount, status, created_at, updated_at
)
SELECT
  'cccccccc-3333-3333-3333-333333333302'::uuid,
  'aaaaaaaa-3333-3333-3333-333333333333'::uuid,
  'Holiday',
  200, 2000, 'active',
  now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.pots WHERE id = 'cccccccc-3333-3333-3333-333333333302');

INSERT INTO public.pots (
  id, household_id, name, current_amount, target_amount, status, created_at, updated_at
)
SELECT
  'cccccccc-3333-3333-3333-333333333303'::uuid,
  'aaaaaaaa-3333-3333-3333-333333333333'::uuid,
  'Car Fund',
  0, 3000, 'active',
  now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.pots WHERE id = 'cccccccc-3333-3333-3333-333333333303');

-- trial-milestone, trial-ending: 2 pots each (at free tier limit)
INSERT INTO public.pots (id, household_id, name, current_amount, target_amount, status, created_at, updated_at)
SELECT 'cccccccc-1111-1111-1111-111111111101'::uuid, 'aaaaaaaa-1111-1111-1111-111111111111'::uuid, 'Emergency', 500, 5000, 'active', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.pots WHERE id = 'cccccccc-1111-1111-1111-111111111101');
INSERT INTO public.pots (id, household_id, name, current_amount, target_amount, status, created_at, updated_at)
SELECT 'cccccccc-1111-1111-1111-111111111102'::uuid, 'aaaaaaaa-1111-1111-1111-111111111111'::uuid, 'Holiday', 200, 2000, 'active', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.pots WHERE id = 'cccccccc-1111-1111-1111-111111111102');

INSERT INTO public.pots (id, household_id, name, current_amount, target_amount, status, created_at, updated_at)
SELECT 'cccccccc-2222-2222-2222-222222222201'::uuid, 'aaaaaaaa-2222-2222-2222-222222222222'::uuid, 'Emergency', 500, 5000, 'active', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.pots WHERE id = 'cccccccc-2222-2222-2222-222222222201');
INSERT INTO public.pots (id, household_id, name, current_amount, target_amount, status, created_at, updated_at)
SELECT 'cccccccc-2222-2222-2222-222222222202'::uuid, 'aaaaaaaa-2222-2222-2222-222222222222'::uuid, 'Holiday', 200, 2000, 'active', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.pots WHERE id = 'cccccccc-2222-2222-2222-222222222202');

-- trial-grace, trial-archive: 2 pots each
INSERT INTO public.pots (id, household_id, name, current_amount, target_amount, status, created_at, updated_at)
SELECT 'cccccccc-4444-4444-4444-444444444401'::uuid, 'aaaaaaaa-4444-4444-4444-444444444444'::uuid, 'Emergency', 500, 5000, 'active', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.pots WHERE id = 'cccccccc-4444-4444-4444-444444444401');
INSERT INTO public.pots (id, household_id, name, current_amount, target_amount, status, created_at, updated_at)
SELECT 'cccccccc-4444-4444-4444-444444444402'::uuid, 'aaaaaaaa-4444-4444-4444-444444444444'::uuid, 'Holiday', 200, 2000, 'active', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.pots WHERE id = 'cccccccc-4444-4444-4444-444444444402');

INSERT INTO public.pots (id, household_id, name, current_amount, target_amount, status, created_at, updated_at)
SELECT 'cccccccc-5555-5555-5555-555555555501'::uuid, 'aaaaaaaa-5555-5555-5555-555555555555'::uuid, 'Emergency', 500, 5000, 'active', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.pots WHERE id = 'cccccccc-5555-5555-5555-555555555501');
INSERT INTO public.pots (id, household_id, name, current_amount, target_amount, status, created_at, updated_at)
SELECT 'cccccccc-5555-5555-5555-555555555502'::uuid, 'aaaaaaaa-5555-5555-5555-555555555555'::uuid, 'Holiday', 200, 2000, 'active', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.pots WHERE id = 'cccccccc-5555-5555-5555-555555555502');

-- =============================================================================
-- INCOME SOURCES (required for app)
-- =============================================================================

INSERT INTO public.income_sources (
  household_id, name, amount, frequency_rule, day_of_month, payment_source, sort_order, is_active, created_at, updated_at
)
SELECT
  h.id, 'Salary', 2500, 'specific_date', 25, 'me', 0, true, now(), now()
FROM public.households h
WHERE h.id IN (
  'aaaaaaaa-1111-1111-1111-111111111111',
  'aaaaaaaa-2222-2222-2222-222222222222',
  'aaaaaaaa-3333-3333-3333-333333333333',
  'aaaaaaaa-4444-4444-4444-444444444444',
  'aaaaaaaa-5555-5555-5555-555555555555'
)
AND NOT EXISTS (
  SELECT 1 FROM public.income_sources i
  WHERE i.household_id = h.id AND i.name = 'Salary'
);

-- Set current_paycycle_id so users can access blueprint (point to active cycle)
UPDATE public.users u SET current_paycycle_id = CASE u.email
  WHEN 'trial-milestone@plotbudget.test' THEN 'bbbbbbbb-1111-1111-1111-111111111112'::uuid
  WHEN 'trial-ending@plotbudget.test' THEN 'bbbbbbbb-2222-2222-2222-222222222202'::uuid
  WHEN 'trial-ended@plotbudget.test' THEN 'bbbbbbbb-3333-3333-3333-333333333302'::uuid
  WHEN 'trial-grace@plotbudget.test' THEN 'bbbbbbbb-4444-4444-4444-444444444402'::uuid
  WHEN 'trial-archive@plotbudget.test' THEN 'bbbbbbbb-5555-5555-5555-555555555502'::uuid
END
WHERE u.email IN (
  'trial-milestone@plotbudget.test', 'trial-ending@plotbudget.test', 'trial-ended@plotbudget.test',
  'trial-grace@plotbudget.test', 'trial-archive@plotbudget.test'
);
