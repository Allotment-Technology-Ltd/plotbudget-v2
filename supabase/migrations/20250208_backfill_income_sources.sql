-- One-time backfill: create income_sources from existing onboarding data
-- (users.monthly_income, households.partner_income) for every household that
-- has no income_sources yet. Ensures all users see and edit their income in Settings → Income.

WITH households_to_backfill AS (
  SELECT
    h.id,
    h.owner_id,
    h.pay_cycle_type,
    h.pay_day,
    h.pay_cycle_anchor,
    h.partner_income
  FROM public.households h
  WHERE NOT EXISTS (
    SELECT 1 FROM public.income_sources i WHERE i.household_id = h.id
  )
),
-- My salary: owner's monthly_income, only when > 0
my_salary AS (
  SELECT
    b.id AS household_id,
    'My salary'::TEXT AS name,
    u.monthly_income AS amount,
    b.pay_cycle_type AS frequency_rule,
    CASE WHEN b.pay_cycle_type = 'specific_date' THEN GREATEST(1, LEAST(31, COALESCE(b.pay_day, 1))) ELSE NULL END AS day_of_month,
    CASE WHEN b.pay_cycle_type = 'every_4_weeks' THEN b.pay_cycle_anchor ELSE NULL END AS anchor_date,
    'me'::payment_source AS payment_source,
    0 AS sort_order
  FROM households_to_backfill b
  JOIN public.users u ON u.id = b.owner_id
  WHERE COALESCE(u.monthly_income, 0) > 0
),
-- Partner salary: household partner_income, only when > 0 and frequency allows (no every_4_weeks without anchor)
partner_salary AS (
  SELECT
    b.id AS household_id,
    'Partner salary'::TEXT AS name,
    b.partner_income AS amount,
    b.pay_cycle_type AS frequency_rule,
    CASE WHEN b.pay_cycle_type = 'specific_date' THEN GREATEST(1, LEAST(31, COALESCE(b.pay_day, 1))) ELSE NULL END AS day_of_month,
    CASE WHEN b.pay_cycle_type = 'every_4_weeks' THEN b.pay_cycle_anchor ELSE NULL END AS anchor_date,
    'partner'::payment_source AS payment_source,
    1 AS sort_order
  FROM households_to_backfill b
  WHERE COALESCE(b.partner_income, 0) > 0
    AND (b.pay_cycle_type != 'every_4_weeks' OR b.pay_cycle_anchor IS NOT NULL)
)
INSERT INTO public.income_sources (
  household_id,
  name,
  amount,
  frequency_rule,
  day_of_month,
  anchor_date,
  payment_source,
  sort_order,
  is_active
)
SELECT household_id, name, amount, frequency_rule, day_of_month, anchor_date, payment_source, sort_order, true
FROM my_salary
WHERE (frequency_rule != 'every_4_weeks' OR anchor_date IS NOT NULL)
UNION ALL
SELECT household_id, name, amount, frequency_rule, day_of_month, anchor_date, payment_source, sort_order, true
FROM partner_salary;
