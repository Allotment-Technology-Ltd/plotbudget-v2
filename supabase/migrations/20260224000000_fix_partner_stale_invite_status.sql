-- Fix stale partner_invite_status after external auth user deletion.
--
-- When a partner's auth account is deleted directly in Supabase (not via the app's
-- "Remove and delete account" flow), the following cascade happens:
--   auth.users DELETE  →  public.users DELETE (CASCADE)
--                      →  households.partner_user_id SET NULL (FK ON DELETE SET NULL)
--
-- However, partner_invite_status and the other invite fields are NOT reset, leaving
-- the household in an inconsistent 'accepted' state with partner_user_id = NULL.
-- This causes the owner to see "Partner active" in the UI even though no partner
-- exists, and blocks re-inviting.
--
-- Fix 1: Clean up existing stale rows.
UPDATE public.households
SET
  partner_invite_status = 'none',
  partner_email         = NULL,
  partner_auth_token    = NULL,
  partner_invite_sent_at = NULL,
  partner_accepted_at   = NULL,
  partner_last_login_at = NULL
WHERE partner_user_id IS NULL
  AND partner_invite_status != 'none';

-- Fix 2: Add a BEFORE DELETE trigger on public.users so that whenever a partner's
-- public.users row is deleted (either directly or via CASCADE from auth.users), the
-- household's invite fields are reset in the same transaction — before the FK sets
-- partner_user_id to NULL.
CREATE OR REPLACE FUNCTION public.reset_household_on_partner_user_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.households
  SET
    partner_invite_status  = 'none',
    partner_email          = NULL,
    partner_auth_token     = NULL,
    partner_invite_sent_at = NULL,
    partner_accepted_at    = NULL,
    partner_last_login_at  = NULL
  WHERE partner_user_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS reset_household_fields_on_partner_delete ON public.users;
CREATE TRIGGER reset_household_fields_on_partner_delete
  BEFORE DELETE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.reset_household_on_partner_user_delete();
