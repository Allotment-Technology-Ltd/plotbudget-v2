-- Founding Member: first 50 users get one year of Premium free.
-- Column stores until when the user has Founding Member (Premium) access; trigger sets it automatically on signup.
-- For an existing DB that already has users: run once to backfill the first 50 by created_at:
--   UPDATE public.users u SET founding_member_until = u.created_at + INTERVAL '1 year'
--   WHERE u.id IN (SELECT id FROM public.users ORDER BY created_at ASC LIMIT 50);

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS founding_member_until TIMESTAMPTZ;
COMMENT ON COLUMN public.users.founding_member_until IS 'When set, user has Premium (Founding Member) until this timestamp. First 50 signups get this set automatically to 1 year from creation.';
-- Trigger: after a new user is inserted, if total user count is <= 50, grant them Founding Member for 1 year.
CREATE OR REPLACE FUNCTION public.set_founding_member_if_first_50()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count bigint;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.users;

  IF user_count <= 50 THEN
    UPDATE public.users
    SET founding_member_until = NOW() + INTERVAL '1 year'
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_user_created_set_founding_member ON public.users;
CREATE TRIGGER on_user_created_set_founding_member
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_founding_member_if_first_50();
