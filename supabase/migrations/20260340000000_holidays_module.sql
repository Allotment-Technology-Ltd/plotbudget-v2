-- Holidays module: trips, itinerary_entries, trip_budget_items, packing_items.
-- Phase 4 of PLOT platform expansion; RLS scoped by household.

-- Trips: household trip plans with optional pot/project links
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'planning', 'booked', 'in_progress', 'completed', 'cancelled')),
  CHECK (end_date >= start_date),
  linked_pot_id UUID REFERENCES public.pots(id) ON DELETE SET NULL,
  linked_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  notes TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS trips_household_id_status_idx ON public.trips(household_id, status);
COMMENT ON TABLE public.trips IS 'Household trips; can link to savings pots and task projects.';
COMMENT ON COLUMN public.trips.cover_image_url IS 'External image URL only (no uploads); nullable.';
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY trips_select_household ON public.trips
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY trips_insert_household ON public.trips
  FOR INSERT WITH CHECK (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY trips_update_household ON public.trips
  FOR UPDATE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  ) WITH CHECK (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY trips_delete_household ON public.trips
  FOR DELETE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
CREATE OR REPLACE FUNCTION public.touch_trips_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trips_set_updated_at ON public.trips;
CREATE TRIGGER trips_set_updated_at
BEFORE UPDATE ON public.trips
FOR EACH ROW EXECUTE FUNCTION public.touch_trips_updated_at();
-- Itinerary entries: day-by-day plan items for a trip
CREATE TABLE IF NOT EXISTS public.itinerary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TEXT,
  end_time TEXT,
  entry_type TEXT NOT NULL DEFAULT 'other' CHECK (entry_type IN ('travel', 'accommodation', 'activity', 'dining', 'other')),
  booking_ref TEXT,
  booking_url TEXT,
  cost_amount DECIMAL(12,2),
  cost_currency TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS itinerary_entries_trip_id_date_idx ON public.itinerary_entries(trip_id, date);
COMMENT ON TABLE public.itinerary_entries IS 'Day-by-day itinerary entries for a trip.';
ALTER TABLE public.itinerary_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY itinerary_entries_select_household ON public.itinerary_entries
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY itinerary_entries_insert_household ON public.itinerary_entries
  FOR INSERT WITH CHECK (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY itinerary_entries_update_household ON public.itinerary_entries
  FOR UPDATE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  ) WITH CHECK (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY itinerary_entries_delete_household ON public.itinerary_entries
  FOR DELETE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
CREATE OR REPLACE FUNCTION public.touch_itinerary_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS itinerary_entries_set_updated_at ON public.itinerary_entries;
CREATE TRIGGER itinerary_entries_set_updated_at
BEFORE UPDATE ON public.itinerary_entries
FOR EACH ROW EXECUTE FUNCTION public.touch_itinerary_entries_updated_at();
-- Trip budget items: planned and actual spend per category
CREATE TABLE IF NOT EXISTS public.trip_budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('flights', 'accommodation', 'car_rental', 'activities', 'food', 'transport', 'other')),
  name TEXT NOT NULL,
  planned_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  actual_amount DECIMAL(12,2),
  currency TEXT NOT NULL DEFAULT 'GBP',
  booking_ref TEXT,
  itinerary_entry_id UUID REFERENCES public.itinerary_entries(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS trip_budget_items_trip_id_idx ON public.trip_budget_items(trip_id);
COMMENT ON TABLE public.trip_budget_items IS 'Budget line items per category for a trip; itinerary_entry_id ON DELETE SET NULL so budget items survive when an itinerary entry is removed.';
ALTER TABLE public.trip_budget_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY trip_budget_items_select_household ON public.trip_budget_items
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY trip_budget_items_insert_household ON public.trip_budget_items
  FOR INSERT WITH CHECK (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY trip_budget_items_update_household ON public.trip_budget_items
  FOR UPDATE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  ) WITH CHECK (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY trip_budget_items_delete_household ON public.trip_budget_items
  FOR DELETE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
CREATE OR REPLACE FUNCTION public.touch_trip_budget_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trip_budget_items_set_updated_at ON public.trip_budget_items;
CREATE TRIGGER trip_budget_items_set_updated_at
BEFORE UPDATE ON public.trip_budget_items
FOR EACH ROW EXECUTE FUNCTION public.touch_trip_budget_items_updated_at();
-- Packing items: checklist of items to pack for a trip
CREATE TABLE IF NOT EXISTS public.packing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  category TEXT,
  name TEXT NOT NULL,
  is_packed BOOLEAN NOT NULL DEFAULT FALSE,
  assignee TEXT NOT NULL DEFAULT 'shared' CHECK (assignee IN ('me', 'partner', 'shared')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS packing_items_trip_id_idx ON public.packing_items(trip_id);
COMMENT ON TABLE public.packing_items IS 'Packing checklist items for a trip; assignee scoped to me/partner/shared.';
ALTER TABLE public.packing_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY packing_items_select_household ON public.packing_items
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY packing_items_insert_household ON public.packing_items
  FOR INSERT WITH CHECK (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY packing_items_update_household ON public.packing_items
  FOR UPDATE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  ) WITH CHECK (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY packing_items_delete_household ON public.packing_items
  FOR DELETE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
CREATE OR REPLACE FUNCTION public.touch_packing_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS packing_items_set_updated_at ON public.packing_items;
CREATE TRIGGER packing_items_set_updated_at
BEFORE UPDATE ON public.packing_items
FOR EACH ROW EXECUTE FUNCTION public.touch_packing_items_updated_at();
