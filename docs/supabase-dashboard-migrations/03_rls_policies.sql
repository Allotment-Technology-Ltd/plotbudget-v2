-- PlotBudget: Row Level Security policies (owner-based access)
-- Run after 01_base_schema.sql and 02_partner_invitation.sql.
-- Idempotent: drops existing policies then recreates.

-- =============================================================================
-- HOUSEHOLDS
-- =============================================================================
DROP POLICY IF EXISTS "Users can insert own household" ON public.households;
DROP POLICY IF EXISTS "Users can read own household" ON public.households;
DROP POLICY IF EXISTS "Users can update own household" ON public.households;

ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own household"
  ON public.households
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can read own household"
  ON public.households
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can update own household"
  ON public.households
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- =============================================================================
-- PAYCYCLES
-- =============================================================================
DROP POLICY IF EXISTS "Users can insert paycycle for own household" ON public.paycycles;
DROP POLICY IF EXISTS "Users can read paycycles of own household" ON public.paycycles;
DROP POLICY IF EXISTS "Users can update paycycles of own household" ON public.paycycles;

ALTER TABLE public.paycycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert paycycle for own household"
  ON public.paycycles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = paycycles.household_id AND h.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can read paycycles of own household"
  ON public.paycycles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = paycycles.household_id AND h.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update paycycles of own household"
  ON public.paycycles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = paycycles.household_id AND h.owner_id = auth.uid()
    )
  );

-- =============================================================================
-- USERS (public.users profile table)
-- =============================================================================
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =============================================================================
-- SEEDS
-- =============================================================================
DROP POLICY IF EXISTS "Users can insert seeds for own household" ON public.seeds;
DROP POLICY IF EXISTS "Users can read seeds of own household" ON public.seeds;
DROP POLICY IF EXISTS "Users can update seeds of own household" ON public.seeds;
DROP POLICY IF EXISTS "Users can delete seeds of own household" ON public.seeds;

ALTER TABLE public.seeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert seeds for own household"
  ON public.seeds
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = seeds.household_id AND h.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can read seeds of own household"
  ON public.seeds
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = seeds.household_id AND h.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update seeds of own household"
  ON public.seeds
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = seeds.household_id AND h.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = seeds.household_id AND h.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete seeds of own household"
  ON public.seeds
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = seeds.household_id AND h.owner_id = auth.uid()
    )
  );

-- =============================================================================
-- POTS
-- =============================================================================
DROP POLICY IF EXISTS "Users can insert pots for own household" ON public.pots;
DROP POLICY IF EXISTS "Users can read pots of own household" ON public.pots;
DROP POLICY IF EXISTS "Users can update pots of own household" ON public.pots;
DROP POLICY IF EXISTS "Users can delete pots of own household" ON public.pots;

ALTER TABLE public.pots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert pots for own household"
  ON public.pots
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = pots.household_id AND h.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can read pots of own household"
  ON public.pots
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = pots.household_id AND h.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update pots of own household"
  ON public.pots
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = pots.household_id AND h.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete pots of own household"
  ON public.pots
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = pots.household_id AND h.owner_id = auth.uid()
    )
  );

-- =============================================================================
-- REPAYMENTS
-- =============================================================================
DROP POLICY IF EXISTS "Users can insert repayments for own household" ON public.repayments;
DROP POLICY IF EXISTS "Users can read repayments of own household" ON public.repayments;
DROP POLICY IF EXISTS "Users can update repayments of own household" ON public.repayments;
DROP POLICY IF EXISTS "Users can delete repayments of own household" ON public.repayments;

ALTER TABLE public.repayments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert repayments for own household"
  ON public.repayments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = repayments.household_id AND h.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can read repayments of own household"
  ON public.repayments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = repayments.household_id AND h.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update repayments of own household"
  ON public.repayments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = repayments.household_id AND h.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete repayments of own household"
  ON public.repayments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = repayments.household_id AND h.owner_id = auth.uid()
    )
  );
