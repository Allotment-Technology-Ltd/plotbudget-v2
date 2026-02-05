-- PlotBudget: Row Level Security policies for onboarding and app access
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor) if you see
-- "new row violates row-level security policy" on households, paycycles, users,
-- seeds, pots, or repayments.
--
-- If you get "policy already exists", drop the existing policy first, e.g.:
--   DROP POLICY IF EXISTS "Users can insert own household" ON public.households;
-- Then run the corresponding CREATE POLICY again.

-- =============================================================================
-- HOUSEHOLDS
-- =============================================================================
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

-- Authenticated users may insert a household when they are the owner
CREATE POLICY "Users can insert own household"
  ON public.households
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Users may read households they own
CREATE POLICY "Users can read own household"
  ON public.households
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

-- Users may update their own household
CREATE POLICY "Users can update own household"
  ON public.households
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- =============================================================================
-- PAYCYCLES
-- =============================================================================
ALTER TABLE public.paycycles ENABLE ROW LEVEL SECURITY;

-- Users may insert a paycycle only for a household they own
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

-- Users may read paycycles for their household
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

-- Users may update paycycles for their household
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
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users may read their own row
CREATE POLICY "Users can read own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users may update their own row (e.g. onboarding: household_id, has_completed_onboarding)
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow insert when a new auth user is created (e.g. from trigger or app)
CREATE POLICY "Users can insert own profile"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =============================================================================
-- SEEDS
-- =============================================================================
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
