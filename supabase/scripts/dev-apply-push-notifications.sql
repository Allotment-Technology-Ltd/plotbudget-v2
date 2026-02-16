-- =============================================================================
-- DEV ONLY: Push notifications schema (push_tokens + preference columns)
-- =============================================================================
-- Run this once on your **dev** DB if you have not run any push-token migrations.
-- Use Supabase Dashboard → SQL Editor, or: psql $DATABASE_URL -f supabase/scripts/dev-apply-push-notifications.sql
--
-- Do NOT run this on prod. Prod uses migrations 20260216100000_push_tokens.sql
-- and 20260216110000_push_tokens_preferences.sql in order.
--
-- Biometrics: no DB schema (stored on device only).
-- =============================================================================

-- Push notification tokens for mobile app (Expo Push Token).
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, token)
);

CREATE INDEX IF NOT EXISTS push_tokens_user_id_idx ON public.push_tokens(user_id);
CREATE INDEX IF NOT EXISTS push_tokens_token_idx ON public.push_tokens(token);

COMMENT ON TABLE public.push_tokens IS 'Expo push tokens for mobile app; one row per device token per user.';

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS push_tokens_select_own ON public.push_tokens;
CREATE POLICY push_tokens_select_own ON public.push_tokens
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS push_tokens_insert_own ON public.push_tokens;
CREATE POLICY push_tokens_insert_own ON public.push_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS push_tokens_update_own ON public.push_tokens;
CREATE POLICY push_tokens_update_own ON public.push_tokens
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS push_tokens_delete_own ON public.push_tokens;
CREATE POLICY push_tokens_delete_own ON public.push_tokens
  FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS push_tokens_set_updated_at ON public.push_tokens;
CREATE TRIGGER push_tokens_set_updated_at
BEFORE UPDATE ON public.push_tokens
FOR EACH ROW EXECUTE FUNCTION public.touch_push_tokens_updated_at();

-- Granular preference columns (payday, partner activity, bills marked paid)
ALTER TABLE public.push_tokens
  ADD COLUMN IF NOT EXISTS payday_reminders boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS partner_activity boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS bills_marked_paid boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.push_tokens.payday_reminders IS 'Send payday reminder notifications to this device';
COMMENT ON COLUMN public.push_tokens.partner_activity IS 'Send partner activity (mark paid / pot complete) notifications to this device';
COMMENT ON COLUMN public.push_tokens.bills_marked_paid IS 'Send bills auto-marked paid (overdue) notifications to this device';
