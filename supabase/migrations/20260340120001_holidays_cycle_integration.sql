-- Add due_date to trip_budget_items and trip_budget_item_id to seeds
-- This allows budget items to be scheduled for payment in cycles

-- Add due_date column to trip_budget_items
ALTER TABLE public.trip_budget_items 
ADD COLUMN IF NOT EXISTS due_date DATE;

COMMENT ON COLUMN public.trip_budget_items.due_date IS 'When this budget item payment is due; used to schedule in relevant cycle as a Want.';

-- Add trip_budget_item_id to seeds to link them back
ALTER TABLE public.seeds
ADD COLUMN IF NOT EXISTS trip_budget_item_id UUID REFERENCES public.trip_budget_items(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.seeds.trip_budget_item_id IS 'Links seed to a trip budget item if this want was added from holidays module.';

-- Index for querying seeds by trip budget item
CREATE INDEX IF NOT EXISTS seeds_trip_budget_item_id_idx ON public.seeds(trip_budget_item_id);
