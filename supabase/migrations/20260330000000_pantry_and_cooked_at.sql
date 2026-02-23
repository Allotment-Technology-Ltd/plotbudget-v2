-- Pantry (fridge / cupboard / pantry) stock and meal plan "cooked" state.
-- Pantry: record what the household has in stock for advisory when planning and deduction when cooking.
-- cooked_at: when set, this meal was made and pantry was (or can be) deducted.

-- Pantry items: household stock by location
CREATE TABLE IF NOT EXISTS public.pantry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity_value DECIMAL(12,4),
  quantity_unit TEXT,
  location TEXT NOT NULL DEFAULT 'pantry' CHECK (location IN ('fridge', 'cupboard', 'pantry')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS pantry_items_household_id_idx ON public.pantry_items(household_id);
CREATE INDEX IF NOT EXISTS pantry_items_household_location_idx ON public.pantry_items(household_id, location);
COMMENT ON TABLE public.pantry_items IS 'Household stock: what you have in fridge, cupboard or pantry. Used for advisory when adding meals and deduction when marking as cooked.';
COMMENT ON COLUMN public.pantry_items.location IS 'Where the item is stored: fridge, cupboard, or pantry.';
ALTER TABLE public.pantry_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY pantry_items_select_household ON public.pantry_items
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY pantry_items_insert_household ON public.pantry_items
  FOR INSERT WITH CHECK (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY pantry_items_update_household ON public.pantry_items
  FOR UPDATE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY pantry_items_delete_household ON public.pantry_items
  FOR DELETE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
CREATE OR REPLACE FUNCTION public.touch_pantry_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS pantry_items_set_updated_at ON public.pantry_items;
CREATE TRIGGER pantry_items_set_updated_at
BEFORE UPDATE ON public.pantry_items
FOR EACH ROW EXECUTE FUNCTION public.touch_pantry_items_updated_at();
-- When a meal is marked as cooked, pantry amounts are deducted (handled in app)
ALTER TABLE public.meal_plan_entries
  ADD COLUMN IF NOT EXISTS cooked_at TIMESTAMPTZ;
COMMENT ON COLUMN public.meal_plan_entries.cooked_at IS 'When set, this meal was made; pantry deductions are applied for recipe ingredients.';
