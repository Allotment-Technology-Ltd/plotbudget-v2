-- Partner account-based access: link household to partner's auth user.
-- Partners sign up or log in, then accept invite; we set partner_user_id so RLS
-- and app can treat them as authenticated partner (no cookie-based access).

ALTER TABLE public.households
  ADD COLUMN IF NOT EXISTS partner_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_households_partner_user_id
  ON public.households(partner_user_id)
  WHERE partner_user_id IS NOT NULL;
-- RLS: allow partner to read and update their household (e.g. partner_last_login_at).
-- Owner-only policies already exist; these add partner access.
DROP POLICY IF EXISTS "Partners can read household they belong to" ON public.households;
CREATE POLICY "Partners can read household they belong to"
  ON public.households
  FOR SELECT
  TO authenticated
  USING (partner_user_id = auth.uid());
DROP POLICY IF EXISTS "Partners can update household they belong to" ON public.households;
CREATE POLICY "Partners can update household they belong to"
  ON public.households
  FOR UPDATE
  TO authenticated
  USING (partner_user_id = auth.uid())
  WITH CHECK (partner_user_id = auth.uid());
-- Paycycles: partner can read/update (no insert for partner - owner creates paycycles).
DROP POLICY IF EXISTS "Partners can read paycycles of their household" ON public.paycycles;
CREATE POLICY "Partners can read paycycles of their household"
  ON public.paycycles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = paycycles.household_id AND h.partner_user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Partners can update paycycles of their household" ON public.paycycles;
CREATE POLICY "Partners can update paycycles of their household"
  ON public.paycycles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = paycycles.household_id AND h.partner_user_id = auth.uid()
    )
  );
-- Seeds: partner can read, insert, update, delete (same as owner for shared household).
DROP POLICY IF EXISTS "Partners can insert seeds for their household" ON public.seeds;
CREATE POLICY "Partners can insert seeds for their household"
  ON public.seeds
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = seeds.household_id AND h.partner_user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Partners can read seeds of their household" ON public.seeds;
CREATE POLICY "Partners can read seeds of their household"
  ON public.seeds
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = seeds.household_id AND h.partner_user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Partners can update seeds of their household" ON public.seeds;
CREATE POLICY "Partners can update seeds of their household"
  ON public.seeds
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = seeds.household_id AND h.partner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = seeds.household_id AND h.partner_user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Partners can delete seeds of their household" ON public.seeds;
CREATE POLICY "Partners can delete seeds of their household"
  ON public.seeds
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = seeds.household_id AND h.partner_user_id = auth.uid()
    )
  );
-- Pots: partner can read, insert, update, delete.
DROP POLICY IF EXISTS "Partners can insert pots for their household" ON public.pots;
CREATE POLICY "Partners can insert pots for their household"
  ON public.pots
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = pots.household_id AND h.partner_user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Partners can read pots of their household" ON public.pots;
CREATE POLICY "Partners can read pots of their household"
  ON public.pots
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = pots.household_id AND h.partner_user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Partners can update pots of their household" ON public.pots;
CREATE POLICY "Partners can update pots of their household"
  ON public.pots
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = pots.household_id AND h.partner_user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Partners can delete pots of their household" ON public.pots;
CREATE POLICY "Partners can delete pots of their household"
  ON public.pots
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = pots.household_id AND h.partner_user_id = auth.uid()
    )
  );
-- Repayments: partner can read, insert, update, delete.
DROP POLICY IF EXISTS "Partners can insert repayments for their household" ON public.repayments;
CREATE POLICY "Partners can insert repayments for their household"
  ON public.repayments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = repayments.household_id AND h.partner_user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Partners can read repayments of their household" ON public.repayments;
CREATE POLICY "Partners can read repayments of their household"
  ON public.repayments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = repayments.household_id AND h.partner_user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Partners can update repayments of their household" ON public.repayments;
CREATE POLICY "Partners can update repayments of their household"
  ON public.repayments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = repayments.household_id AND h.partner_user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Partners can delete repayments of their household" ON public.repayments;
CREATE POLICY "Partners can delete repayments of their household"
  ON public.repayments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = repayments.household_id AND h.partner_user_id = auth.uid()
    )
  );
