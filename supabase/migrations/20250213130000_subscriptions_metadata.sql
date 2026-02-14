-- Add metadata JSONB to subscriptions for PWYL amount, pricing_mode, etc.
-- Polar webhook will persist pwyl_amount and pricing_mode from subscription metadata

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

COMMENT ON COLUMN public.subscriptions.metadata IS 'Subscription metadata from Polar (pwyl_amount, pricing_mode, etc.)';
