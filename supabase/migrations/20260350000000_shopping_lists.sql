-- PLOT-157: Shopping list enhancements
-- 1. shopping_lists — named lists with title and done state
-- 2. grocery_items — add shopping_list_id, actual_price (receipt entry), is_staple

-- Shopping lists: named, per-household shopping trips
CREATE TABLE IF NOT EXISTS public.shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Shopping list',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'done')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS shopping_lists_household_id_idx ON public.shopping_lists(household_id);
CREATE INDEX IF NOT EXISTS shopping_lists_household_status_idx ON public.shopping_lists(household_id, status);

COMMENT ON TABLE public.shopping_lists IS 'Named shopping lists per household (e.g. "Weekly shop", "Costco run"). Items are linked via grocery_items.shopping_list_id.';
COMMENT ON COLUMN public.shopping_lists.status IS 'active = in progress; done = completed and archived.';
COMMENT ON COLUMN public.shopping_lists.completed_at IS 'When the list was marked as done.';

ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY shopping_lists_select_household ON public.shopping_lists
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY shopping_lists_insert_household ON public.shopping_lists
  FOR INSERT WITH CHECK (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY shopping_lists_update_household ON public.shopping_lists
  FOR UPDATE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY shopping_lists_delete_household ON public.shopping_lists
  FOR DELETE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE OR REPLACE FUNCTION public.touch_shopping_lists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS shopping_lists_set_updated_at ON public.shopping_lists;
CREATE TRIGGER shopping_lists_set_updated_at
BEFORE UPDATE ON public.shopping_lists
FOR EACH ROW EXECUTE FUNCTION public.touch_shopping_lists_updated_at();

-- Extend grocery_items with new PLOT-157 columns
ALTER TABLE public.grocery_items
  ADD COLUMN IF NOT EXISTS shopping_list_id UUID REFERENCES public.shopping_lists(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS actual_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS is_staple BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS grocery_items_shopping_list_id_idx ON public.grocery_items(shopping_list_id);
CREATE INDEX IF NOT EXISTS grocery_items_household_staple_idx ON public.grocery_items(household_id, is_staple) WHERE is_staple = TRUE;

COMMENT ON COLUMN public.grocery_items.shopping_list_id IS 'Which shopping list this item belongs to. NULL = legacy item not assigned to a named list.';
COMMENT ON COLUMN public.grocery_items.actual_price IS 'Actual price paid for this item (receipt entry). NULL = not yet entered.';
COMMENT ON COLUMN public.grocery_items.is_staple IS 'When true, this item is a household staple and appears in the Staples quick-add panel.';
