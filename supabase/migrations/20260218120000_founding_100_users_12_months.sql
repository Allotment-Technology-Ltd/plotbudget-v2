-- Founding Member: expand to first 100 households, 12 months free.
-- Replaces set_founding_household_if_first_50 (50 households, 6 months).

COMMENT ON COLUMN public.households.founding_member_until IS 'When set, household has Premium (Founding Member) until this timestamp. Limited to first 100 households.';

DROP TRIGGER IF EXISTS on_household_created_set_founder ON public.households;
DROP FUNCTION IF EXISTS public.set_founding_household_if_first_50();

CREATE OR REPLACE FUNCTION public.set_founding_household_if_first_100()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  founder_count bigint;
BEGIN
  SELECT COUNT(*) INTO founder_count
  FROM public.households
  WHERE founding_member_until IS NOT NULL;

  IF founder_count < 100 THEN
    UPDATE public.households
    SET founding_member_until = NOW() + INTERVAL '12 months'
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_founding_household_if_first_100 IS 'Sets founding_member_until = NOW() + 12 months for first 100 households.';

CREATE TRIGGER on_household_created_set_founder
  AFTER INSERT ON public.households
  FOR EACH ROW
  EXECUTE FUNCTION public.set_founding_household_if_first_100();
