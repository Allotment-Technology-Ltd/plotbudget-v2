-- Calendar events for PLOT shared calendar (Phase 2).
-- Supports one-off and recurring events; source_module/source_entity_id for cross-module linking.

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  all_day BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_rule TEXT,
  source_module TEXT,
  source_entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS events_household_id_start_at_idx ON public.events(household_id, start_at);
CREATE INDEX IF NOT EXISTS events_household_id_end_at_idx ON public.events(household_id, end_at) WHERE end_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS events_source_idx ON public.events(source_module, source_entity_id) WHERE source_module IS NOT NULL;
COMMENT ON TABLE public.events IS 'Household calendar events; may be one-off or recurring (iCal RRULE).';
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY events_select_household ON public.events
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY events_insert_household ON public.events
  FOR INSERT WITH CHECK (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY events_update_household ON public.events
  FOR UPDATE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY events_delete_household ON public.events
  FOR DELETE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
CREATE OR REPLACE FUNCTION public.touch_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS events_set_updated_at ON public.events;
CREATE TRIGGER events_set_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.touch_events_updated_at();
