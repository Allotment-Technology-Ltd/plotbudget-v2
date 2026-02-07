-- Ritual close: user-triggered "close cycle" locks the budget for the month.
-- When set, blueprint is read-only for this cycle until user unlocks.

ALTER TABLE public.paycycles
  ADD COLUMN IF NOT EXISTS ritual_closed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.paycycles.ritual_closed_at IS 'When the user completed the close-cycle ritual; budget is locked until unlocked';
