-- Household currency for income and bills (Polar supports GBP, USD, EUR).
-- Used for display and for future payment localization.

DO $$ BEGIN
  CREATE TYPE household_currency AS ENUM ('GBP', 'USD', 'EUR');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.households
  ADD COLUMN IF NOT EXISTS currency household_currency NOT NULL DEFAULT 'GBP';

COMMENT ON COLUMN public.households.currency IS 'Currency for income and bills; limited to Polar-supported major currencies (GBP, USD, EUR)';
