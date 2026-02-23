-- Allow user-defined pantry locations (e.g. "cupboard above sink", "basement", "garage")
-- instead of fixed fridge/cupboard/pantry.

ALTER TABLE public.pantry_items
  DROP CONSTRAINT IF EXISTS pantry_items_location_check;
ALTER TABLE public.pantry_items
  ALTER COLUMN location SET DEFAULT 'pantry';
COMMENT ON COLUMN public.pantry_items.location IS 'Where the item is stored: any label the user chooses (e.g. Fridge, Cupboard above sink, Basement, Garage).';
