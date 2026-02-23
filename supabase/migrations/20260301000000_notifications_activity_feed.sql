/* Notifications (in-app + push) and Activity Feed for PLOT platform expansion.
   Shared by all modules; RLS scoped by household. */

-- Notifications: per-user, household-scoped
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  source_module TEXT NOT NULL,
  source_entity_id UUID,
  action_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  push_sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS notifications_user_id_is_read_idx ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS notifications_household_id_created_at_idx ON public.notifications(household_id, created_at DESC);
COMMENT ON TABLE public.notifications IS 'In-app and push notifications; household-scoped, per user.';
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_select_household ON public.notifications
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY notifications_insert_household ON public.notifications
  FOR INSERT WITH CHECK (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY notifications_update_household ON public.notifications
  FOR UPDATE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY notifications_delete_household ON public.notifications
  FOR DELETE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
-- Trigger to keep updated_at fresh on notifications
CREATE OR REPLACE FUNCTION public.touch_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS notifications_set_updated_at ON public.notifications;
CREATE TRIGGER notifications_set_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.touch_notifications_updated_at();
-- Activity feed: household-scoped stream of actions
CREATE TABLE IF NOT EXISTS public.activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'partner', 'system')),
  action TEXT NOT NULL,
  object_name TEXT NOT NULL,
  object_detail TEXT,
  source_module TEXT NOT NULL,
  source_entity_id UUID,
  action_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS activity_feed_household_id_created_at_idx ON public.activity_feed(household_id, created_at DESC);
COMMENT ON TABLE public.activity_feed IS 'Household activity stream; mixed from all modules.';
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY activity_feed_select_household ON public.activity_feed
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY activity_feed_insert_household ON public.activity_feed
  FOR INSERT WITH CHECK (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY activity_feed_update_household ON public.activity_feed
  FOR UPDATE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY activity_feed_delete_household ON public.activity_feed
  FOR DELETE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
