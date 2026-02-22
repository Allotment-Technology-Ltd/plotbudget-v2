-- Meal plan: breakfast/lunch/dinner per day, batch cooking, and leftovers linking.
-- meal_slot: which meal of the day (breakfast, lunch, dinner, other).
-- is_batch_cook: marked when cooking in bulk for later meals.
-- leftovers_from_meal_plan_entry_id: when this meal is leftovers, link to the source entry.

ALTER TABLE public.meal_plan_entries
  ADD COLUMN IF NOT EXISTS meal_slot TEXT NOT NULL DEFAULT 'dinner'
  CHECK (meal_slot IN ('breakfast', 'lunch', 'dinner', 'other'));

ALTER TABLE public.meal_plan_entries
  ADD COLUMN IF NOT EXISTS is_batch_cook BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.meal_plan_entries
  ADD COLUMN IF NOT EXISTS leftovers_from_meal_plan_entry_id UUID REFERENCES public.meal_plan_entries(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS meal_plan_entries_leftovers_from_idx
  ON public.meal_plan_entries(leftovers_from_meal_plan_entry_id) WHERE leftovers_from_meal_plan_entry_id IS NOT NULL;

COMMENT ON COLUMN public.meal_plan_entries.meal_slot IS 'Which meal of the day: breakfast, lunch, dinner, or other.';
COMMENT ON COLUMN public.meal_plan_entries.is_batch_cook IS 'True when this entry represents a batch-cook session (cook once, eat over several meals).';
COMMENT ON COLUMN public.meal_plan_entries.leftovers_from_meal_plan_entry_id IS 'When this meal is leftovers, reference the meal plan entry it came from.';
