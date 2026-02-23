-- Move Founding Member status from Users to Households to ensure "Couple = 1" counting.

-- 1. Add column to households
ALTER TABLE public.households
  ADD COLUMN IF NOT EXISTS founding_member_until TIMESTAMPTZ;
COMMENT ON COLUMN public.households.founding_member_until IS 'When set, household has Premium (Founding Member) until this timestamp. Limited to first 50 households.';
-- 2. Backfill: If any user in a household is a founder, the household becomes a founder.
-- We take the MAX date if multiple users have it (unlikely but safe).
UPDATE public.households h
SET founding_member_until = (
  SELECT MAX(u.founding_member_until)
  FROM public.users u
  WHERE u.household_id = h.id
)
WHERE EXISTS (
  SELECT 1
  FROM public.users u
  WHERE u.household_id = h.id
    AND u.founding_member_until IS NOT NULL
    AND u.founding_member_until > NOW()
);
-- 3. Drop old trigger on users
DROP TRIGGER IF EXISTS on_user_created_set_founding_member ON public.users;
DROP FUNCTION IF EXISTS public.set_founding_member_if_first_50();
-- 4. Create new trigger on households
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

  -- If we are within the first 50 households, grant 6 months free.
  IF household_count <= 50 THEN
    UPDATE public.households
    SET founding_member_until = NOW() + INTERVAL '6 months'
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;
CREATE TRIGGER on_household_created_set_founder
  AFTER INSERT ON public.households
  FOR EACH ROW
  EXECUTE FUNCTION public.set_founding_household_if_first_50();
-- 5. Optional: Cleanup users column?
-- Keeping it for now to avoid breaking running code immediately, but code should switch to household column.
-- ALTER TABLE public.users DROP COLUMN founding_member_until;;
