-- Allow 'both' for joint tasks (assigned_to).
ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_assigned_to_check;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_assigned_to_check
  CHECK (assigned_to IN ('me', 'partner', 'both', 'unassigned'));
COMMENT ON COLUMN public.tasks.assigned_to IS 'Who the task is assigned to: me (owner/current user), partner, both (joint), or unassigned.';
