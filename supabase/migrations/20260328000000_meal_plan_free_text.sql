-- Meal plan: support free-text entries (takeaway, leftovers, eating out) alongside recipe-based entries.
-- recipe_id becomes nullable; free_text stores ad-hoc meal labels when no recipe is linked.

ALTER TABLE public.meal_plan_entries
  ADD COLUMN IF NOT EXISTS free_text TEXT;
ALTER TABLE public.meal_plan_entries
  ALTER COLUMN recipe_id DROP NOT NULL;
-- At least one of recipe_id or free_text must be set; free_text when set must be non-empty after trim.
ALTER TABLE public.meal_plan_entries
  DROP CONSTRAINT IF EXISTS meal_plan_entries_recipe_or_free_text;
ALTER TABLE public.meal_plan_entries
  ADD CONSTRAINT meal_plan_entries_recipe_or_free_text
  CHECK (
    (recipe_id IS NOT NULL) OR
    (free_text IS NOT NULL AND trim(free_text) <> '')
  );
COMMENT ON COLUMN public.meal_plan_entries.free_text IS 'Ad-hoc meal label when not using a recipe (e.g. Takeaway, Leftovers from Monday).';
