-- Add instructions (cooking steps) to recipes for URL import and manual entry.
ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS instructions TEXT;
COMMENT ON COLUMN public.recipes.instructions IS 'Step-by-step cooking instructions; may be imported from recipe URLs.';
