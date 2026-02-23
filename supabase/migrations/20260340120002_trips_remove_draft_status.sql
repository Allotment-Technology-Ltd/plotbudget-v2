-- Remove 'draft' status and keep 'planning' as default
-- Update trips status enum

-- First, update any existing 'draft' trips to 'planning'
UPDATE public.trips SET status = 'planning' WHERE status = 'draft';

-- Drop the old constraint
ALTER TABLE public.trips DROP CONSTRAINT IF EXISTS trips_status_check;

-- Add the new constraint without 'draft'
ALTER TABLE public.trips ADD CONSTRAINT trips_status_check 
  CHECK (status IN ('planning', 'booked', 'in_progress', 'completed', 'cancelled'));

-- Update the default value to 'planning'
ALTER TABLE public.trips ALTER COLUMN status SET DEFAULT 'planning';

COMMENT ON COLUMN public.trips.status IS 'Trip status: planning (default), booked, in_progress, completed, or cancelled';
