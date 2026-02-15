-- Add founding_member_until to households (dev DB).
-- Run this once so /dashboard/settings and dashboard pages can read the column.
--
-- How to run:
--   Option A – Supabase Dashboard: Project → SQL Editor → New query → paste this file → Run.
--   Option B – psql:  psql "$DEV_DATABASE_URL" -f apps/web/scripts/dev-db-add-founding_member_until_to_households.sql
--
-- Source: supabase/migrations/20260215100000_move_founder_to_household.sql

-- 1. Add column to households
ALTER TABLE public.households
  ADD COLUMN IF NOT EXISTS founding_member_until TIMESTAMPTZ;

COMMENT ON COLUMN public.households.founding_member_until IS 'When set, household has Premium (Founding Member) until this timestamp. Limited to first 50 households.';

-- 2. Backfill: If any user in a household is a founder, the household becomes a founder.
UPDATE public.households household
SET founding_member_until = (
  SELECT MAX(u.founding_member_until)
  FROM public.users u
  WHERE u.household_id = household.id
)
WHERE EXISTS (
  SELECT 1
  FROM public.users u
  WHERE u.household_id = household.id
    AND u.founding_member_until IS NOT NULL
    AND u.founding_member_until > NOW()
);

-- 3. Drop old trigger on users (if present)
DROP TRIGGER IF EXISTS on_user_created_set_founding_member ON public.users;
DROP FUNCTION IF EXISTS public.set_founding_member_if_first_50();

-- 4. Create new trigger on households
-- Note: COUNT(*) per insert is O(n); acceptable for "first 50" use. For high-throughput production, use a counter table.
CREATE OR REPLACE FUNCTION public.set_founding_household_if_first_50()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  household_count bigint;
BEGIN
  SELECT COUNT(*) INTO household_count FROM public.households;
  IF household_count > 50 THEN
    RETURN NEW;
  END IF;

  UPDATE public.households
  SET founding_member_until = NOW() + INTERVAL '6 months'
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_household_created_set_founder ON public.households;
CREATE TRIGGER on_household_created_set_founder
  AFTER INSERT ON public.households
  FOR EACH ROW
  EXECUTE FUNCTION public.set_founding_household_if_first_50();
