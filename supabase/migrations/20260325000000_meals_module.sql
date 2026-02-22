-- Meals & Groceries module: recipes, meal_plan_entries, grocery_items.
-- Phase 3 of PLOT platform expansion; RLS scoped by household.

-- Recipes: household recipe collection with structured ingredients
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  ingredients JSONB NOT NULL DEFAULT '[]',
  servings INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS recipes_household_id_idx ON public.recipes(household_id);

COMMENT ON TABLE public.recipes IS 'Recipes with ingredients; ingredients stored as JSONB array of { name, quantity }.';
COMMENT ON COLUMN public.recipes.ingredients IS 'Array of { name: string, quantity: string } e.g. [{ "name": "chicken", "quantity": "200g" }].';

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY recipes_select_household ON public.recipes
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY recipes_insert_household ON public.recipes
  FOR INSERT WITH CHECK (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY recipes_update_household ON public.recipes
  FOR UPDATE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY recipes_delete_household ON public.recipes
  FOR DELETE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE OR REPLACE FUNCTION public.touch_recipes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS recipes_set_updated_at ON public.recipes;
CREATE TRIGGER recipes_set_updated_at
BEFORE UPDATE ON public.recipes
FOR EACH ROW EXECUTE FUNCTION public.touch_recipes_updated_at();

-- Meal plan entries: which recipe is planned for which date
CREATE TABLE IF NOT EXISTS public.meal_plan_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  planned_date DATE NOT NULL,
  servings INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS meal_plan_entries_household_id_idx ON public.meal_plan_entries(household_id);
CREATE INDEX IF NOT EXISTS meal_plan_entries_planned_date_idx ON public.meal_plan_entries(household_id, planned_date);

COMMENT ON TABLE public.meal_plan_entries IS 'Planned meals: recipe + date; used to generate grocery list.';

ALTER TABLE public.meal_plan_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY meal_plan_entries_select_household ON public.meal_plan_entries
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY meal_plan_entries_insert_household ON public.meal_plan_entries
  FOR INSERT WITH CHECK (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY meal_plan_entries_update_household ON public.meal_plan_entries
  FOR UPDATE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY meal_plan_entries_delete_household ON public.meal_plan_entries
  FOR DELETE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

-- Grocery items: aggregated list (from meal plan or manual); supports real-time sync
CREATE TABLE IF NOT EXISTS public.grocery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity_text TEXT,
  quantity_value DECIMAL(12,4),
  quantity_unit TEXT,
  source_recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  source_meal_plan_entry_id UUID REFERENCES public.meal_plan_entries(id) ON DELETE SET NULL,
  is_checked BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS grocery_items_household_id_idx ON public.grocery_items(household_id);
CREATE INDEX IF NOT EXISTS grocery_items_household_created_idx ON public.grocery_items(household_id, created_at DESC);

COMMENT ON TABLE public.grocery_items IS 'Grocery list items; aggregated from meal plan or added manually. Real-time sync by household_id.';

ALTER TABLE public.grocery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY grocery_items_select_household ON public.grocery_items
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY grocery_items_insert_household ON public.grocery_items
  FOR INSERT WITH CHECK (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY grocery_items_update_household ON public.grocery_items
  FOR UPDATE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY grocery_items_delete_household ON public.grocery_items
  FOR DELETE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE OR REPLACE FUNCTION public.touch_grocery_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS grocery_items_set_updated_at ON public.grocery_items;
CREATE TRIGGER grocery_items_set_updated_at
BEFORE UPDATE ON public.grocery_items
FOR EACH ROW EXECUTE FUNCTION public.touch_grocery_items_updated_at();

-- Enable Realtime for grocery_items (subscription scoped by household_id in app)
ALTER PUBLICATION supabase_realtime ADD TABLE public.grocery_items;
