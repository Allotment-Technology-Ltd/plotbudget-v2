-- Polar subscriptions table, keyed by household
-- Stores subscription status synced from Polar webhooks

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'trialing');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM ('free', 'pro');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  polar_subscription_id TEXT UNIQUE NOT NULL,
  polar_product_id TEXT,
  status subscription_status NOT NULL,
  current_tier subscription_tier,
  trial_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS subscriptions_household_id_idx ON public.subscriptions(household_id);
CREATE INDEX IF NOT EXISTS subscriptions_polar_subscription_id_idx ON public.subscriptions(polar_subscription_id);

COMMENT ON TABLE public.subscriptions IS 'Polar subscriptions keyed by household';
COMMENT ON COLUMN public.subscriptions.polar_subscription_id IS 'Polar subscription ID (unique)';
COMMENT ON COLUMN public.subscriptions.status IS 'Polar subscription status';
COMMENT ON COLUMN public.subscriptions.current_tier IS 'Mapped tier, e.g., pro when product matches POLAR premium';

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.touch_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subscriptions_set_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_set_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.touch_subscriptions_updated_at();
