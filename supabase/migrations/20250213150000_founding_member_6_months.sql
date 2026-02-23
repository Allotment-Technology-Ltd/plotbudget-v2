-- Founding Member: change period from 12 months to 6 months.
-- Trigger sets founding_member_until = NOW() + 6 months for first 50 signups.
-- Update existing users so founding_member_until = created_at + 6 months (for pre-launch consistency).

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
    SET founding_member_until = NOW() + INTERVAL '6 months'
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;
COMMENT ON FUNCTION public.set_founding_member_if_first_50 IS 'Sets founding_member_until = NOW() + 6 months for first 50 signups.';
-- Adjust existing users: founding_member_until = created_at + 6 months where it is in the future.
UPDATE public.users
SET founding_member_until = created_at + INTERVAL '6 months'
WHERE founding_member_until IS NOT NULL
  AND founding_member_until > NOW();
