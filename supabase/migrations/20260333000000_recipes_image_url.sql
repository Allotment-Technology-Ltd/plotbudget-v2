-- Store image URL only (no object storage). Recipes reference external image URLs from import;
-- we never download or host images, keeping storage and bandwidth costs minimal.
ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS image_url TEXT;
COMMENT ON COLUMN public.recipes.image_url IS 'Optional external image URL from recipe import. URL-only; no image bytes stored.';
