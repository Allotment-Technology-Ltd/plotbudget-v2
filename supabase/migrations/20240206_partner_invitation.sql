-- Partner Invitation System (Phase 6.1)
-- Add partner fields to households for magic-link partner access.

-- Add partner columns to households
ALTER TABLE public.households
  ADD COLUMN IF NOT EXISTS partner_email TEXT,
  ADD COLUMN IF NOT EXISTS partner_auth_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS partner_invite_status TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS partner_invite_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS partner_last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS partner_accepted_at TIMESTAMPTZ;

-- Constraint for invite status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'partner_invite_status_check'
  ) THEN
    ALTER TABLE public.households
      ADD CONSTRAINT partner_invite_status_check
      CHECK (partner_invite_status IN ('none', 'pending', 'accepted'));
  END IF;
END $$;

-- Index for magic link lookups
CREATE INDEX IF NOT EXISTS idx_households_partner_token
  ON public.households(partner_auth_token)
  WHERE partner_auth_token IS NOT NULL;

-- RLS: Partner access is handled at app level via middleware (partner has no auth.uid()).
-- Existing owner-only policies remain unchanged.
