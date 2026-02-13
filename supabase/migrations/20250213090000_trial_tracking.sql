-- Trial tracking: cycle count, ended state, grace period, and email flags.
-- Used for trial/grace period emails and auto-archiving excess pots.
-- See docs/TRIAL-TRANSITION-EMAILS.md and docs/TRIAL-CYCLE-TRACKING.md.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS trial_cycles_completed INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trial_ended_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS grace_period_start TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS trial_milestone_email_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trial_ending_email_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trial_ended_email_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS grace_period_reminder_sent BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.users.trial_cycles_completed IS 'Number of completed pay cycles (trial = first 2)';
COMMENT ON COLUMN public.users.trial_ended_at IS 'When trial ended (2nd cycle completed)';
COMMENT ON COLUMN public.users.grace_period_start IS 'Start of 7-day grace period after trial ends for users over free tier limits';
COMMENT ON COLUMN public.users.trial_milestone_email_sent IS 'Whether trial milestone (1 of 2) email was sent';
COMMENT ON COLUMN public.users.trial_ending_email_sent IS 'Whether trial ending soon (3 days before) email was sent';
COMMENT ON COLUMN public.users.trial_ended_email_sent IS 'Whether trial ended action required email was sent';
COMMENT ON COLUMN public.users.grace_period_reminder_sent IS 'Whether grace period day-6 reminder email was sent';
