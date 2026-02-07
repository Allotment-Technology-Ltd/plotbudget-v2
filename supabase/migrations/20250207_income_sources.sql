-- Income sources: independent streams per household (decoupled from budget cycle).
-- Each source has its own frequency rule and amount; projection engine sums events in cycle window.

CREATE TABLE public.income_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
  frequency_rule pay_cycle_type NOT NULL DEFAULT 'specific_date',
  day_of_month INTEGER CHECK (day_of_month IS NULL OR (day_of_month >= 1 AND day_of_month <= 31)),
  anchor_date DATE,
  payment_source payment_source NOT NULL DEFAULT 'me',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT income_sources_specific_date_day CHECK (
    frequency_rule != 'specific_date' OR day_of_month IS NOT NULL
  ),
  CONSTRAINT income_sources_every_4_weeks_anchor CHECK (
    frequency_rule != 'every_4_weeks' OR anchor_date IS NOT NULL
  )
);

CREATE INDEX idx_income_sources_household ON public.income_sources(household_id);
CREATE INDEX idx_income_sources_household_active ON public.income_sources(household_id) WHERE is_active = true;

COMMENT ON TABLE public.income_sources IS 'Per-household income streams with independent frequency; used by projection engine for cycle total_income';
COMMENT ON COLUMN public.income_sources.frequency_rule IS 'specific_date = day_of_month each month; last_working_day = LWD of month; every_4_weeks = anchor_date + 28n';
COMMENT ON COLUMN public.income_sources.anchor_date IS 'Required for every_4_weeks; first payment date, then +28 days each time';

DROP TRIGGER IF EXISTS update_income_sources_updated_at ON public.income_sources;
CREATE TRIGGER update_income_sources_updated_at
  BEFORE UPDATE ON public.income_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS: owner and partner can manage income sources for their household
ALTER TABLE public.income_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert income_sources for own household"
  ON public.income_sources
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = income_sources.household_id AND h.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can read income_sources of own household"
  ON public.income_sources
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = income_sources.household_id AND h.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update income_sources of own household"
  ON public.income_sources
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = income_sources.household_id AND h.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = income_sources.household_id AND h.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete income_sources of own household"
  ON public.income_sources
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = income_sources.household_id AND h.owner_id = auth.uid()
    )
  );

CREATE POLICY "Partners can insert income_sources for their household"
  ON public.income_sources
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = income_sources.household_id AND h.partner_user_id = auth.uid()
    )
  );

CREATE POLICY "Partners can read income_sources of their household"
  ON public.income_sources
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = income_sources.household_id AND h.partner_user_id = auth.uid()
    )
  );

CREATE POLICY "Partners can update income_sources of their household"
  ON public.income_sources
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = income_sources.household_id AND h.partner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = income_sources.household_id AND h.partner_user_id = auth.uid()
    )
  );

CREATE POLICY "Partners can delete income_sources of their household"
  ON public.income_sources
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = income_sources.household_id AND h.partner_user_id = auth.uid()
    )
  );
