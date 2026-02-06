-- Track who added each seed (owner vs partner) for display in the UI
-- Run after 03_rls_policies.sql. Same as supabase/migrations/20240206_seeds_created_by.sql
ALTER TABLE public.seeds
  ADD COLUMN IF NOT EXISTS created_by_owner BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.seeds.created_by_owner IS 'True when the account owner added this seed, false when the partner did';
