-- Founding Member: email sent 1 month before founding_member_until.
-- Used by cron /api/cron/trial-emails to send "Founding Member period ending soon" email once.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS founding_member_ending_soon_email_sent BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN public.users.founding_member_ending_soon_email_sent IS 'Whether Founding Member ending-soon (1 month before) email was sent';
