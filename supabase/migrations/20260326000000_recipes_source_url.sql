-- Add source_url to recipes for "Recipe from URL" import (Copy Me That–style).
ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS source_url TEXT;
COMMENT ON COLUMN public.recipes.source_url IS 'Original URL when recipe was imported from a link.';
