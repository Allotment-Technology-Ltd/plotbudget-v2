-- Store prep and cook time (minutes) for recipes, e.g. from URL import.
ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS prep_mins INTEGER,
ADD COLUMN IF NOT EXISTS cook_mins INTEGER;

COMMENT ON COLUMN public.recipes.prep_mins IS 'Prep time in minutes (e.g. from import).';
COMMENT ON COLUMN public.recipes.cook_mins IS 'Cook time in minutes (e.g. from import).';
