-- Add granular push notification preference columns to push_tokens.
-- Requires 20260216100000_push_tokens.sql to have been run (table must exist).
-- Safe to run when columns already exist (ADD COLUMN IF NOT EXISTS).

ALTER TABLE public.push_tokens
  ADD COLUMN IF NOT EXISTS payday_reminders boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS partner_activity boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS bills_marked_paid boolean NOT NULL DEFAULT true;
COMMENT ON COLUMN public.push_tokens.payday_reminders IS 'Send payday reminder notifications to this device';
COMMENT ON COLUMN public.push_tokens.partner_activity IS 'Send partner activity (mark paid / pot complete) notifications to this device';
COMMENT ON COLUMN public.push_tokens.bills_marked_paid IS 'Send bills auto-marked paid (overdue) notifications to this device';
