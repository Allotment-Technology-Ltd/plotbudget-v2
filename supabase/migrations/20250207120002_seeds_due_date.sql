-- Add optional due_date to seeds (Needs and Wants bills).
-- When due_date is past, bill can be auto-marked as paid.

ALTER TABLE public.seeds
  ADD COLUMN IF NOT EXISTS due_date DATE;

COMMENT ON COLUMN public.seeds.due_date IS 'Optional due date for need/want bills; when past, bill is auto-marked paid';
