-- PlotBudget: Base schema (enums, tables, indexes, triggers)
-- Run in Supabase Dashboard → SQL Editor. Use on a NEW project only.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM ('free', 'pro');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'past_due');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE pay_cycle_type AS ENUM ('specific_date', 'last_working_day', 'every_4_weeks');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE paycycle_status AS ENUM ('active', 'draft', 'completed', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE seed_type AS ENUM ('need', 'want', 'savings', 'repay');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE payment_source AS ENUM ('me', 'partner', 'joint');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE pot_status AS ENUM ('active', 'complete', 'paused');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE repayment_status AS ENUM ('active', 'paid', 'paused');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  phone_number TEXT,
  household_id UUID,
  current_paycycle_id UUID,
  monthly_income DECIMAL(12,2) DEFAULT 0,
  onboarding_step INTEGER DEFAULT 1,
  has_completed_onboarding BOOLEAN DEFAULT FALSE,
  subscription_tier subscription_tier DEFAULT 'free',
  subscription_status subscription_status,
  polar_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT,
  is_couple BOOLEAN DEFAULT FALSE,
  partner_name TEXT,
  partner_income DECIMAL(12,2) DEFAULT 0,
  total_monthly_income DECIMAL(12,2) DEFAULT 0,
  needs_percent INTEGER DEFAULT 50,
  wants_percent INTEGER DEFAULT 30,
  savings_percent INTEGER DEFAULT 10,
  repay_percent INTEGER DEFAULT 10,
  pay_day INTEGER CHECK (pay_day IS NULL OR (pay_day >= 1 AND pay_day <= 31)),
  pay_cycle_type pay_cycle_type DEFAULT 'specific_date',
  pay_cycle_anchor DATE,
  joint_ratio DECIMAL(3,2) DEFAULT 0.50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_household'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT fk_user_household
      FOREIGN KEY (household_id) REFERENCES public.households(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.paycycles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  status paycycle_status DEFAULT 'draft',
  name TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_income DECIMAL(12,2) DEFAULT 0,
  snapshot_user_income DECIMAL(12,2) DEFAULT 0,
  snapshot_partner_income DECIMAL(12,2) DEFAULT 0,
  total_allocated DECIMAL(12,2) DEFAULT 0,
  alloc_needs_me DECIMAL(12,2) DEFAULT 0,
  alloc_needs_partner DECIMAL(12,2) DEFAULT 0,
  alloc_needs_joint DECIMAL(12,2) DEFAULT 0,
  alloc_wants_me DECIMAL(12,2) DEFAULT 0,
  alloc_wants_partner DECIMAL(12,2) DEFAULT 0,
  alloc_wants_joint DECIMAL(12,2) DEFAULT 0,
  alloc_savings_me DECIMAL(12,2) DEFAULT 0,
  alloc_savings_partner DECIMAL(12,2) DEFAULT 0,
  alloc_savings_joint DECIMAL(12,2) DEFAULT 0,
  alloc_repay_me DECIMAL(12,2) DEFAULT 0,
  alloc_repay_partner DECIMAL(12,2) DEFAULT 0,
  alloc_repay_joint DECIMAL(12,2) DEFAULT 0,
  rem_needs_me DECIMAL(12,2) DEFAULT 0,
  rem_needs_partner DECIMAL(12,2) DEFAULT 0,
  rem_needs_joint DECIMAL(12,2) DEFAULT 0,
  rem_wants_me DECIMAL(12,2) DEFAULT 0,
  rem_wants_partner DECIMAL(12,2) DEFAULT 0,
  rem_wants_joint DECIMAL(12,2) DEFAULT 0,
  rem_savings_me DECIMAL(12,2) DEFAULT 0,
  rem_savings_partner DECIMAL(12,2) DEFAULT 0,
  rem_savings_joint DECIMAL(12,2) DEFAULT 0,
  rem_repay_me DECIMAL(12,2) DEFAULT 0,
  rem_repay_partner DECIMAL(12,2) DEFAULT 0,
  rem_repay_joint DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_paycycle'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT fk_user_paycycle
      FOREIGN KEY (current_paycycle_id) REFERENCES public.paycycles(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.pots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  current_amount DECIMAL(12,2) DEFAULT 0,
  target_amount DECIMAL(12,2) NOT NULL,
  target_date DATE,
  status pot_status DEFAULT 'active',
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.repayments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  starting_balance DECIMAL(12,2) NOT NULL,
  current_balance DECIMAL(12,2) NOT NULL,
  interest_rate DECIMAL(5,2),
  target_date DATE,
  status repayment_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.seeds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  paycycle_id UUID NOT NULL REFERENCES public.paycycles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  type seed_type NOT NULL,
  category TEXT,
  payment_source payment_source NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  is_paid BOOLEAN DEFAULT FALSE,
  is_paid_me BOOLEAN DEFAULT FALSE,
  is_paid_partner BOOLEAN DEFAULT FALSE,
  amount_me DECIMAL(12,2) DEFAULT 0,
  amount_partner DECIMAL(12,2) DEFAULT 0,
  split_ratio DECIMAL(3,2),
  uses_joint_account BOOLEAN DEFAULT FALSE,
  linked_pot_id UUID REFERENCES public.pots(id) ON DELETE SET NULL,
  linked_repayment_id UUID REFERENCES public.repayments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_household ON public.users(household_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_paycycles_household ON public.paycycles(household_id);
CREATE INDEX IF NOT EXISTS idx_paycycles_status ON public.paycycles(status);
CREATE INDEX IF NOT EXISTS idx_seeds_paycycle ON public.seeds(paycycle_id);
CREATE INDEX IF NOT EXISTS idx_seeds_household ON public.seeds(household_id);
CREATE INDEX IF NOT EXISTS idx_seeds_type ON public.seeds(type);
CREATE INDEX IF NOT EXISTS idx_pots_household ON public.pots(household_id);
CREATE INDEX IF NOT EXISTS idx_repayments_household ON public.repayments(household_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_households_updated_at ON public.households;
CREATE TRIGGER update_households_updated_at
  BEFORE UPDATE ON public.households
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_paycycles_updated_at ON public.paycycles;
CREATE TRIGGER update_paycycles_updated_at
  BEFORE UPDATE ON public.paycycles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_seeds_updated_at ON public.seeds;
CREATE TRIGGER update_seeds_updated_at
  BEFORE UPDATE ON public.seeds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_pots_updated_at ON public.pots;
CREATE TRIGGER update_pots_updated_at
  BEFORE UPDATE ON public.pots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_repayments_updated_at ON public.repayments;
CREATE TRIGGER update_repayments_updated_at
  BEFORE UPDATE ON public.repayments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
