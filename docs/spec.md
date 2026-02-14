# PLOT: Functional Specification

> **Version:** 2.0  
> **Last Updated:** February 2026  
> **Stack:** Next.js 14 (App Router) + Supabase + TypeScript  
> **Architecture:** TurboRepo Monorepo

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Infrastructure & Integrations](#2-infrastructure--integrations)
3. [Environment Variables](#3-environment-variables)
4. [Data Entities](#4-data-entities)
5. [Database Schema (Supabase)](#5-database-schema-supabase)
6. [Authentication](#6-authentication)
7. [Server Actions & API Routes](#7-server-actions--api-routes)
8. [Key Formulas & Calculations](#8-key-formulas--calculations)
9. [Business Rules](#9-business-rules)
10. [User Flows](#10-user-flows)
11. [Client State Management](#11-client-state-management)
12. [Security & Compliance](#12-security--compliance)
13. [E2E Testing Standards (Playwright)](#13-e2e-testing-standards-playwright)

---

## 1. Product Overview

### 1.1 Vision

PLOT exists to **liberate couples from financial friction** — eliminating the exhausting cycle of awkward money conversations, mental load imbalance, and spreadsheet maintenance that corrodes relationships.

### 1.2 Core Value Proposition

- **20 Minutes Monthly, Not 5 Minutes Daily** — Budget at payday, then forget about it
- **Partnership Without Merging** — Both partners contribute; nobody becomes the "chancellor"
- **Privacy Over Profit** — No bank connections, no transaction harvesting
- **Fair Splits, Calculated Automatically** — Define ratio once, PLOT handles the math

### 1.3 Target Audience

- **Primary:** Newly cohabiting couples (25-40, UK)
- **Situation:** Dual-income, separate accounts, establishing financial routines
- **Behavior:** Budget-aware but not spreadsheet enthusiasts; value privacy

### 1.4 What PLOT Is NOT

- ❌ Transaction tracking or bank linking
- ❌ AI-powered insights or recommendations
- ❌ Social features or public sharing
- ❌ Multi-currency (UK only initially)
- ❌ Business/team accounts
- ❌ Investment or credit score tracking

---

## 2. Infrastructure & Integrations

### 2.1 Core Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 14 (App Router) | Server Components, Server Actions, SSR |
| **Styling** | Tailwind CSS + shadcn/ui | Design system, accessible components |
| **Database** | Supabase (PostgreSQL) | Primary data store with RLS |
| **Auth** | Supabase Auth | Email/password, OAuth (Google) |
| **State** | Zustand + TanStack Query | Client state + server state caching |
| **Animation** | Framer Motion | UI transitions and micro-interactions |
| **Deployment** | Vercel | Hosting, edge functions, analytics |

### 2.2 Third-Party Integrations

#### Polar.sh — Subscriptions & Checkout

| Purpose | Implementation |
|---------|----------------|
| SaaS billing | Subscription plans (Free, Pro) |
| Checkout flow | Hosted checkout pages |
| Webhooks | Sync subscription status to Supabase |
| Customer portal | Self-service billing management |

**Integration Points:**
- `POST /api/webhooks/polar` — Handle subscription events
- `subscription_tier` field on User entity
- Middleware to check subscription status for premium features

#### PostHog — Analytics & Feature Flags

| Purpose | Implementation |
|---------|----------------|
| Product analytics | Track key events (onboarding, ritual completion) |
| Feature flags | Gradual rollout of new features |
| Session replay | Debug user issues (opt-in) |
| Funnels | Monitor conversion (signup → first ritual) |

**Key Events to Track:**
- `onboarding_started`, `onboarding_completed`, `onboarding_abandoned`
- `paycycle_created`, `seed_added`, `seed_paid`
- `ritual_started`, `ritual_completed`
- `theme_toggled`, `mode_switched` (solo/couple)

#### Resend — Transactional Email

| Purpose | Implementation |
|---------|----------------|
| Welcome sequence | Post-signup onboarding emails |
| Payday reminders | "It's payday! Time for your ritual" |
| Payment alerts | Bills due, overspending warnings |
| Partner invites | Invite partner to household |

**Email Templates:**
- `welcome` — Account created
- `verify-email` — Email verification
- `payday-reminder` — Triggered by cron/scheduled function
- `partner-invite` — Household invitation
- `ritual-summary` — Monthly summary after ritual completion

### 2.3 Architecture Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                         VERCEL                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Next.js App                            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │  Marketing  │  │  Dashboard  │  │  API Routes     │   │  │
│  │  │  (public)   │  │  (authed)   │  │  /api/webhooks  │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │  │
│  │         │                │                  │             │  │
│  │         └────────────────┼──────────────────┘             │  │
│  │                          │                                │  │
│  │              ┌───────────▼───────────┐                    │  │
│  │              │    Server Actions     │                    │  │
│  │              │   (packages/logic)    │                    │  │
│  │              └───────────┬───────────┘                    │  │
│  └──────────────────────────┼────────────────────────────────┘  │
│                             │                                   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   SUPABASE   │    │   POLAR.SH   │    │   POSTHOG    │
│  - Auth      │    │  - Checkout  │    │  - Analytics │
│  - Database  │    │  - Webhooks  │    │  - Flags     │
│  - RLS       │    │  - Portal    │    │  - Replay    │
└──────────────┘    └──────────────┘    └──────────────┘
        │
        ▼
┌──────────────┐
│    RESEND    │
│  - Emails    │
│  - Templates │
└──────────────┘
```

---

## 3. Environment Variables

### 3.1 Required Variables
```bash
# apps/web/.env.local (local development)
# Vercel env (production / preview)

# ============================================
# SUPABASE
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# POLAR.SH
# ============================================
POLAR_ACCESS_TOKEN=polar_at_xxxxx
POLAR_WEBHOOK_SECRET=whsec_xxxxx
POLAR_ORGANIZATION_ID=org_xxxxx
NEXT_PUBLIC_POLAR_CHECKOUT_URL=https://polar.sh/checkout/xxxxx

# ============================================
# POSTHOG
# ============================================
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com

# ============================================
# RESEND
# ============================================
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=PLOT <hello@plotbudget.com>

# ============================================
# APPLICATION
# ============================================
NEXT_PUBLIC_APP_URL=https://plotbudget.com
NEXT_PUBLIC_APP_ENV=production
```

### 3.2 Variable Categories

| Prefix | Visibility | Usage |
|--------|------------|-------|
| `NEXT_PUBLIC_` | Client + Server | Safe for browser exposure |
| No prefix | Server only | Secrets, API keys |

### 3.3 Vercel Configuration

In Vercel Dashboard → Settings → Environment Variables:

| Variable | Environments | Sensitive |
|----------|--------------|-----------|
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | Yes |
| `POLAR_ACCESS_TOKEN` | Production, Preview | Yes |
| `POLAR_WEBHOOK_SECRET` | Production | Yes |
| `RESEND_API_KEY` | Production, Preview | Yes |
| `NEXT_PUBLIC_*` | All | No |

---

## 4. Data Entities

### 4.1 User

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Primary key (from Supabase Auth) |
| `email` | String | Yes | User's email address |
| `display_name` | String | No | User's display name |
| `avatar_url` | String | No | Profile photo URL |
| `phone_number` | String | No | Phone number |
| `created_at` | Timestamp | Yes | Account creation timestamp |
| `updated_at` | Timestamp | Yes | Last update timestamp |
| `household_id` | UUID | No | FK → Household |
| `current_paycycle_id` | UUID | No | FK → PayCycle (active) |
| `monthly_income` | Decimal | No | User's monthly take-home pay |
| `onboarding_step` | Integer | No | Current onboarding progress (1-6) |
| `has_completed_onboarding` | Boolean | No | Whether onboarding is complete |
| `subscription_tier` | Enum | Yes | 'free' \| 'pro' |
| `subscription_status` | Enum | No | 'active' \| 'cancelled' \| 'past_due' |
| `polar_customer_id` | String | No | Polar.sh customer ID |

### 4.2 Household

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `created_at` | Timestamp | Yes | Creation timestamp |
| `owner_id` | UUID | Yes | FK → User (creator) |
| `name` | String | No | Household display name |
| `is_couple` | Boolean | Yes | true = couple mode, false = solo |
| `partner_name` | String | No | Partner's display name |
| `partner_income` | Decimal | No | Partner's monthly income |
| `total_monthly_income` | Decimal | No | Combined household income |
| `needs_percent` | Integer | Yes | Target % for Needs (default: 50) |
| `wants_percent` | Integer | Yes | Target % for Wants (default: 30) |
| `savings_percent` | Integer | Yes | Target % for Savings (default: 10) |
| `repay_percent` | Integer | Yes | Target % for Repayments (default: 10) |
| `pay_day` | Integer | No | Day of month (1-31) for Specific Date |
| `pay_cycle_type` | Enum | Yes | 'specific_date' \| 'last_working_day' \| 'every_4_weeks' |
| `pay_cycle_anchor` | Date | No | Anchor date for Every 4 Weeks |
| `joint_ratio` | Decimal | Yes | Default ME/PARTNER split (0.0-1.0) |

### 4.3 PayCycle

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `household_id` | UUID | Yes | FK → Household |
| `status` | Enum | Yes | 'active' \| 'draft' \| 'completed' \| 'archived' |
| `name` | String | No | Human-readable identifier |
| `start_date` | Date | Yes | First day of cycle |
| `end_date` | Date | Yes | Last day of cycle |
| `total_income` | Decimal | Yes | Total household income for this cycle |
| `snapshot_user_income` | Decimal | Yes | User's income at cycle creation |
| `snapshot_partner_income` | Decimal | Yes | Partner's income at cycle creation |
| `total_allocated` | Decimal | Yes | Sum of all seed amounts |
| `created_at` | Timestamp | Yes | Creation timestamp |
| `updated_at` | Timestamp | Yes | Last update timestamp |

**Allocation Columns (12 total):**
- `alloc_needs_me`, `alloc_needs_partner`, `alloc_needs_joint`
- `alloc_wants_me`, `alloc_wants_partner`, `alloc_wants_joint`
- `alloc_savings_me`, `alloc_savings_partner`, `alloc_savings_joint`
- `alloc_repay_me`, `alloc_repay_partner`, `alloc_repay_joint`

**Remaining Columns (12 total):**
- `rem_needs_me`, `rem_needs_partner`, `rem_needs_joint`
- `rem_wants_me`, `rem_wants_partner`, `rem_wants_joint`
- `rem_savings_me`, `rem_savings_partner`, `rem_savings_joint`
- `rem_repay_me`, `rem_repay_partner`, `rem_repay_joint`

### 4.4 Seed

A Seed represents a single budget line item (bill, expense, savings contribution, or debt payment).

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `household_id` | UUID | Yes | FK → Household |
| `paycycle_id` | UUID | Yes | FK → PayCycle |
| `name` | String | Yes | Display name (e.g., "Electric bill") |
| `amount` | Decimal | Yes | Total amount |
| `type` | Enum | Yes | 'need' \| 'want' \| 'savings' \| 'repay' |
| `category` | String | No | Sub-category (e.g., "Utilities") |
| `payment_source` | Enum | Yes | 'me' \| 'partner' \| 'joint' |
| `is_recurring` | Boolean | Yes | Should clone to next cycle |
| `is_paid` | Boolean | Yes | Overall payment status |
| `is_paid_me` | Boolean | No | User's portion paid (couple mode) |
| `is_paid_partner` | Boolean | No | Partner's portion paid (couple mode) |
| `amount_me` | Decimal | No | User's calculated portion |
| `amount_partner` | Decimal | No | Partner's calculated portion |
| `split_ratio` | Decimal | No | Override ratio for this JOINT seed |
| `uses_joint_account` | Boolean | No | Paid from shared account |
| `linked_pot_id` | UUID | No | FK → Pot (for savings seeds) |
| `linked_repayment_id` | UUID | No | FK → Repayment (for debt seeds) |
| `created_at` | Timestamp | Yes | Creation timestamp |
| `updated_at` | Timestamp | Yes | Last update timestamp |

### 4.5 Pot (Savings Goal)

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `household_id` | UUID | Yes | FK → Household |
| `name` | String | Yes | Goal name (e.g., "Holiday fund") |
| `current_amount` | Decimal | Yes | Amount saved so far |
| `target_amount` | Decimal | Yes | Goal amount |
| `target_date` | Date | No | Target completion date |
| `status` | Enum | Yes | 'active' \| 'complete' \| 'paused' |
| `icon` | String | No | Emoji or icon identifier |
| `created_at` | Timestamp | Yes | Creation timestamp |

### 4.6 Repayment (Debt)

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `household_id` | UUID | Yes | FK → Household |
| `name` | String | Yes | Debt name (e.g., "Credit Card") |
| `starting_balance` | Decimal | Yes | Original debt amount |
| `current_balance` | Decimal | Yes | Amount still owed |
| `interest_rate` | Decimal | No | APR percentage |
| `target_date` | Date | No | Target payoff date |
| `status` | Enum | Yes | 'active' \| 'paid' \| 'paused' |
| `created_at` | Timestamp | Yes | Creation timestamp |

---

## 5. Database Schema (Supabase)

### 5.1 SQL Migration
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE subscription_tier AS ENUM ('free', 'pro');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'past_due');
CREATE TYPE pay_cycle_type AS ENUM ('specific_date', 'last_working_day', 'every_4_weeks');
CREATE TYPE paycycle_status AS ENUM ('active', 'draft', 'completed', 'archived');
CREATE TYPE seed_type AS ENUM ('need', 'want', 'savings', 'repay');
CREATE TYPE payment_source AS ENUM ('me', 'partner', 'joint');
CREATE TYPE pot_status AS ENUM ('active', 'complete', 'paused');
CREATE TYPE repayment_status AS ENUM ('active', 'paid', 'paused');

-- ============================================
-- TABLES
-- ============================================

-- Users (extends Supabase auth.users)
CREATE TABLE public.users (
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

-- Households
CREATE TABLE public.households (
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
  pay_day INTEGER CHECK (pay_day >= 1 AND pay_day <= 31),
  pay_cycle_type pay_cycle_type DEFAULT 'specific_date',
  pay_cycle_anchor DATE,
  joint_ratio DECIMAL(3,2) DEFAULT 0.50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK for household_id on users (after households table exists)
ALTER TABLE public.users 
ADD CONSTRAINT fk_user_household 
FOREIGN KEY (household_id) REFERENCES public.households(id) ON DELETE SET NULL;

-- PayCycles
CREATE TABLE public.paycycles (
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
  
  -- Allocation columns (12)
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
  
  -- Remaining columns (12)
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

-- Add FK for current_paycycle_id on users
ALTER TABLE public.users 
ADD CONSTRAINT fk_user_paycycle 
FOREIGN KEY (current_paycycle_id) REFERENCES public.paycycles(id) ON DELETE SET NULL;

-- Pots (Savings Goals)
CREATE TABLE public.pots (
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

-- Repayments (Debts)
CREATE TABLE public.repayments (
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

-- Seeds
CREATE TABLE public.seeds (
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

CREATE INDEX idx_users_household ON public.users(household_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_paycycles_household ON public.paycycles(household_id);
CREATE INDEX idx_paycycles_status ON public.paycycles(status);
CREATE INDEX idx_seeds_paycycle ON public.seeds(paycycle_id);
CREATE INDEX idx_seeds_household ON public.seeds(household_id);
CREATE INDEX idx_seeds_type ON public.seeds(type);
CREATE INDEX idx_pots_household ON public.pots(household_id);
CREATE INDEX idx_repayments_household ON public.repayments(household_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paycycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repayments ENABLE ROW LEVEL SECURITY;

-- Users: Can only access own record
CREATE POLICY "Users can view own record" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own record" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Households: Can only access if member
CREATE POLICY "Household members can view" ON public.households
  FOR SELECT USING (
    id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Household owner can update" ON public.households
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can create households" ON public.households
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- PayCycles: Can only access own household's cycles
CREATE POLICY "Users can view own household paycycles" ON public.paycycles
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert own household paycycles" ON public.paycycles
  FOR INSERT WITH CHECK (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can update own household paycycles" ON public.paycycles
  FOR UPDATE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

-- Seeds: Can only access own household's seeds
CREATE POLICY "Users can view own household seeds" ON public.seeds
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert own household seeds" ON public.seeds
  FOR INSERT WITH CHECK (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can update own household seeds" ON public.seeds
  FOR UPDATE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete own household seeds" ON public.seeds
  FOR DELETE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

-- Pots: Can only access own household's pots
CREATE POLICY "Users can view own household pots" ON public.pots
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can manage own household pots" ON public.pots
  FOR ALL USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

-- Repayments: Can only access own household's repayments
CREATE POLICY "Users can view own household repayments" ON public.repayments
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can manage own household repayments" ON public.repayments
  FOR ALL USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_households_updated_at
  BEFORE UPDATE ON public.households
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_paycycles_updated_at
  BEFORE UPDATE ON public.paycycles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_seeds_updated_at
  BEFORE UPDATE ON public.seeds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_pots_updated_at
  BEFORE UPDATE ON public.pots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_repayments_updated_at
  BEFORE UPDATE ON public.repayments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## 6. Authentication

Supported methods: **email/password**, **Google OAuth**, **Apple OAuth**, and **magic link** (passwordless email). Providers are gated by feature flags (PostHog or env). Callback: `/auth/callback`; redirect-after-auth cookie used when `?redirect=` is set. See [docs/AUTHENTICATION.md](AUTHENTICATION.md) for env vars, redirect URI setup, and testing.

### 6.1 Auth Flow (Supabase + PKCE)
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createServerSupabaseClient() {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );
}
```

### 6.2 Middleware (Route Protection)
```typescript
// middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // Protected routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect logged-in users away from auth pages
  if (['/login', '/signup'].includes(request.nextUrl.pathname)) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
};
```

---

## 7. Server Actions & API Routes

### 7.1 Server Actions (packages/logic)
```typescript
// packages/logic/src/actions/seed-actions.ts
'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { seedSchema, type SeedInput } from '../schemas/seed';

export async function createSeed(input: SeedInput) {
  const parsed = seedSchema.parse(input);
  const supabase = createServerSupabaseClient();
  
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Unauthorized');

  // Get user's household
  const { data: profile } = await supabase
    .from('users')
    .select('household_id')
    .eq('id', user.user.id)
    .single();

  if (!profile?.household_id) throw new Error('No household');

  // Calculate split amounts for JOINT seeds
  let amount_me = parsed.amount;
  let amount_partner = 0;

  if (parsed.payment_source === 'joint') {
    const { data: household } = await supabase
      .from('households')
      .select('joint_ratio')
      .eq('id', profile.household_id)
      .single();

    const ratio = parsed.split_ratio ?? household?.joint_ratio ?? 0.5;
    amount_me = parsed.amount * ratio;
    amount_partner = parsed.amount - amount_me;
  } else if (parsed.payment_source === 'partner') {
    amount_me = 0;
    amount_partner = parsed.amount;
  }

  // Insert seed
  const { data: seed, error } = await supabase
    .from('seeds')
    .insert({
      ...parsed,
      household_id: profile.household_id,
      amount_me,
      amount_partner,
      is_paid: false,
      is_paid_me: false,
      is_paid_partner: false,
    })
    .select()
    .single();

  if (error) throw error;

  // Update paycycle allocations
  await updatePaycycleAllocations(parsed.paycycle_id, parsed.type, parsed.payment_source, parsed.amount);

  revalidatePath('/dashboard/blueprint');
  return seed;
}

export async function markSeedPaid(seedId: string, payer: 'me' | 'partner') {
  const supabase = createServerSupabaseClient();
  
  const { data: seed } = await supabase
    .from('seeds')
    .select('*')
    .eq('id', seedId)
    .single();

  if (!seed) throw new Error('Seed not found');

  const updates: Record<string, boolean> = {};
  
  if (payer === 'me') {
    updates.is_paid_me = true;
  } else {
    updates.is_paid_partner = true;
  }

  // Check if fully paid
  const willBeFullyPaid = 
    (payer === 'me' && seed.is_paid_partner) ||
    (payer === 'partner' && seed.is_paid_me) ||
    seed.payment_source !== 'joint';

  if (willBeFullyPaid) {
    updates.is_paid = true;
  }

  const { error } = await supabase
    .from('seeds')
    .update(updates)
    .eq('id', seedId);

  if (error) throw error;

  // Update paycycle remaining amounts
  await updatePaycycleRemaining(seed.paycycle_id, seed.type, payer, payer === 'me' ? seed.amount_me : seed.amount_partner);

  revalidatePath('/dashboard/ritual');
}
```

### 7.2 API Routes (Webhooks)
```typescript
// app/api/webhooks/polar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const signature = request.headers.get('polar-signature');
  const body = await request.text();

  // Verify webhook signature
  const isValid = verifyPolarSignature(body, signature, process.env.POLAR_WEBHOOK_SECRET!);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(body);

  switch (event.type) {
    case 'subscription.created':
    case 'subscription.updated':
      await supabaseAdmin
        .from('users')
        .update({
          subscription_tier: event.data.plan === 'pro' ? 'pro' : 'free',
          subscription_status: event.data.status,
          polar_customer_id: event.data.customer_id,
        })
        .eq('email', event.data.customer_email);
      break;

    case 'subscription.cancelled':
      await supabaseAdmin
        .from('users')
        .update({
          subscription_status: 'cancelled',
        })
        .eq('polar_customer_id', event.data.customer_id);
      break;
  }

  return NextResponse.json({ received: true });
}
```

---

## 8. Key Formulas & Calculations

### 8.1 Income Split Calculation
```typescript
// packages/logic/src/utils/calculations.ts

export function calculateInitialSplit(myIncome: number, partnerIncome: number): number {
  const total = myIncome + partnerIncome;
  if (total <= 0) return 0.5; // 50/50 default
  return myIncome / total;
}

// Example: £3,000 / £5,000 = 0.6 (User pays 60%)
```

### 8.2 Seed Amount Split
```typescript
export function calculateSeedSplit(
  totalAmount: number,
  paymentSource: 'me' | 'partner' | 'joint',
  splitRatio: number | null,
  householdJointRatio: number
): { amountMe: number; amountPartner: number } {
  if (paymentSource === 'me') {
    return { amountMe: totalAmount, amountPartner: 0 };
  }
  
  if (paymentSource === 'partner') {
    return { amountMe: 0, amountPartner: totalAmount };
  }

  // JOINT: Use seed-specific ratio or household default
  const effectiveRatio = splitRatio ?? householdJointRatio;
  const amountMe = totalAmount * effectiveRatio;
  const amountPartner = totalAmount - amountMe;
  
  return { amountMe, amountPartner };
}
```

### 8.3 Pay Cycle Date Calculation
```typescript
import { lastDayOfMonth, subMonths, addDays, getDay, subDays } from 'date-fns';

export function getCycleStartDate(
  cycleType: 'specific_date' | 'last_working_day' | 'every_4_weeks',
  payDay?: number,
  anchorDate?: Date
): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (cycleType === 'every_4_weeks' && anchorDate) {
    return anchorDate;
  }

  if (cycleType === 'specific_date' && payDay) {
    const candidate = new Date(today.getFullYear(), today.getMonth(), payDay);
    if (candidate > today) {
      // Pay day hasn't happened yet, cycle started last month
      return new Date(today.getFullYear(), today.getMonth() - 1, payDay);
    }
    return candidate;
  }

  if (cycleType === 'last_working_day') {
    const thisMonthLWD = getLastWorkingDay(today.getFullYear(), today.getMonth());
    if (thisMonthLWD > today) {
      return getLastWorkingDay(today.getFullYear(), today.getMonth() - 1);
    }
    return thisMonthLWD;
  }

  return today;
}

function getLastWorkingDay(year: number, month: number): Date {
  const lastDay = lastDayOfMonth(new Date(year, month));
  const dayOfWeek = getDay(lastDay);
  
  if (dayOfWeek === 6) return subDays(lastDay, 1); // Saturday → Friday
  if (dayOfWeek === 0) return subDays(lastDay, 2); // Sunday → Friday
  return lastDay;
}

export function getCycleEndDate(
  cycleType: 'specific_date' | 'last_working_day' | 'every_4_weeks',
  startDate: Date,
  payDay?: number
): Date {
  if (cycleType === 'every_4_weeks') {
    return addDays(startDate, 27); // 28-day cycle
  }

  if (cycleType === 'specific_date' && payDay) {
    const nextPay = new Date(startDate.getFullYear(), startDate.getMonth() + 1, payDay);
    return subDays(nextPay, 1);
  }

  if (cycleType === 'last_working_day') {
    const nextLWD = getLastWorkingDay(startDate.getFullYear(), startDate.getMonth() + 1);
    return subDays(nextLWD, 1);
  }

  return addDays(startDate, 30);
}
```

### 8.4 Unallocated Funds
```typescript
export function calculateUnallocated(totalIncome: number, totalAllocated: number): number {
  return totalIncome - totalAllocated;
}

export function isOverAllocated(totalIncome: number, totalAllocated: number): boolean {
  return totalAllocated > totalIncome;
}
```

### 8.5 Category Progress
```typescript
export function calculateCategoryProgress(allocated: number, remaining: number): number {
  if (allocated === 0) return 0;
  const paid = allocated - remaining;
  return Math.min(Math.max((paid / allocated) * 100, 0), 100);
}
```

---

## 9. Business Rules

### 9.1 Seed Operations

#### BR-9.1.1: Create Seed
```
WHEN user creates a new Seed:
  1. Validate: name ≠ empty, amount > 0
  2. Calculate split amounts based on payment_source and split_ratio
  3. Create Seed with is_paid = false
  4. Update PayCycle:
     - INCREMENT total_allocated BY amount
     - INCREMENT alloc_{type}_{source} BY amount
     - INCREMENT rem_{type}_{source} BY amount
```

#### BR-9.1.2: Mark Seed Paid
```
WHEN user marks a Seed as paid:
  
  Solo Mode (payment_source = 'me'):
    SET is_paid = true
    DECREMENT rem_{type}_me BY amount

  Couple Mode - Joint Bill:
    IF marking ME portion:
      SET is_paid_me = true
      DECREMENT rem_{type}_me BY amount_me
    IF marking PARTNER portion:
      SET is_paid_partner = true
      DECREMENT rem_{type}_partner BY amount_partner
    IF both is_paid_me AND is_paid_partner:
      SET is_paid = true
```

#### BR-9.1.3: Delete Seed
```
WHEN user deletes a Seed:
  1. Update PayCycle:
     - DECREMENT total_allocated BY amount
     - DECREMENT alloc_{type}_{source} BY amount
     - DECREMENT rem_{type}_{source} BY unpaid portion
  2. Delete seed document
```

### 9.2 Pay Cycle Transitions

#### BR-9.2.1: Activate Draft Cycle
```
WHEN user confirms payday (activates draft):
  1. SET current cycle status = 'completed'
  2. SET draft cycle status = 'active'
  3. UPDATE user.current_paycycle_id to new active cycle
  4. Create next draft cycle with synced recurring seeds
```

### 9.3 Household Modes
```
IF household.is_couple == true:
  - Show partner income field
  - Show PARTNER option in payment_source
  - Show split_ratio controls for JOINT bills
  - Show both is_paid_me and is_paid_partner checkboxes

IF household.is_couple == false:
  - Hide partner fields
  - Only ME and JOINT payment sources
  - Single is_paid checkbox
```

---

## 10. User Flows

### 10.1 Onboarding Flow (6 Steps)
```
Step 1: WELCOME
  - Theme selection (light/dark)
  - "Get Started" CTA
  
Step 2: IDENTITY
  - Display name input
  - Avatar upload (optional)
  
Step 3: MODE
  - Solo or Couple selection
  - Creates Household record
  
Step 4: INCOME
  - User's monthly income
  - Partner's income + name (if couple)
  
Step 5: PAY CYCLE
  - Frequency type selection
  - Pay day or anchor date
  
Step 6: SPLIT RATIO (Couple only)
  - Slider to adjust joint_ratio
  - Shows calculated split preview
  
FINALIZE:
  - Create first PayCycle (status = 'active')
  - SET has_completed_onboarding = true
  - Redirect to Dashboard
```

### 10.2 Blueprint Flow (Budget Planning)
```
1. User views current PayCycle allocations
2. Adds seeds (Needs, Wants, Savings, Repay)
3. Sees unallocated funds update in real-time
4. Can toggle recurring for auto-copy to next cycle
5. Views category breakdown (50/30/10/10 targets)
```

### 10.3 Payday Ritual Flow
```
1. GREETING: Confirm income (editable)
2. RITUAL: View seeds grouped by category
   - Filter by ME / PARTNER / JOINT
   - Check off paid items
   - Progress bars update in real-time
3. COMPLETION: Victory screen when all paid
4. TRANSITION: Activate next cycle
```

---

## 11. Client State Management

### 11.1 Zustand Stores
```typescript
// packages/logic/src/stores/user-store.ts
import { create } from 'zustand';

interface UserState {
  user: User | null;
  household: Household | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setHousehold: (household: Household | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  household: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setHousehold: (household) => set({ household }),
}));
```

### 11.2 TanStack Query (Server State)
```typescript
// hooks/use-paycycle.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useCurrentPaycycle() {
  return useQuery({
    queryKey: ['paycycle', 'current'],
    queryFn: () => fetchCurrentPaycycle(),
  });
}

export function useSeeds(paycycleId: string) {
  return useQuery({
    queryKey: ['seeds', paycycleId],
    queryFn: () => fetchSeeds(paycycleId),
    enabled: !!paycycleId,
  });
}

export function useCreateSeed() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createSeed,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['seeds', variables.paycycle_id] });
      queryClient.invalidateQueries({ queryKey: ['paycycle', 'current'] });
    },
  });
}
```

---

## 12. Security & Compliance

### 12.1 OWASP Top 10 Mitigations

| Risk | Mitigation |
|------|------------|
| Injection | Supabase prepared statements, Zod validation |
| Broken Auth | Supabase Auth + PKCE, httpOnly cookies |
| Sensitive Data | No PII in URLs, encrypted at rest (Supabase) |
| XXE | JSON only, no XML parsing |
| Broken Access | RLS policies on all tables |
| Security Misconfig | Security headers in next.config.js |
| XSS | React auto-escaping, CSP headers |
| Insecure Deserial | Zod schema validation |
| Vulnerable Components | Dependabot, regular updates |
| Logging | PostHog for audit trail |

### 12.2 Security Headers (next.config.js)
```javascript
headers: [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
]
```

### 12.3 UK NCSC Guidance Compliance

| Principle | Implementation |
|-----------|----------------|
| Secure by design | RLS default-deny, Zod validation |
| Minimal privilege | Supabase anon key has no admin access |
| Defence in depth | Auth + RLS + Middleware + Validation |
| Secure defaults | Free tier has no sensitive feature access |
| Audit logging | PostHog event tracking |

### 12.4 GDPR Considerations

- User data deletion endpoint (account deletion)
- Data export endpoint (user's own data)
- Consent tracking for analytics (PostHog opt-in)
- No third-party data sharing
- UK data residency (Supabase EU region)

---

## 13. E2E Testing Standards (Playwright)

### Test ID Conventions

**Every interactive element MUST have a `data-testid` attribute:**
```tsx
// ✅ CORRECT
<Button data-testid="submit-seed-form">Save Seed</Button>
<Link data-testid="nav-dashboard" href="/dashboard">Dashboard</Link>

// ❌ WRONG
<Button>Save Seed</Button>
<Link href="/dashboard">Dashboard</Link>
```

**Naming Pattern:**
- **Action elements**: `{action}-{entity}-{context?}`
  - `submit-seed-form`, `delete-pot-123`, `cancel-onboarding`
- **Input fields**: `{field}-input`
  - `seed-name-input`, `amount-input`, `split-ratio-input`
- **Navigation**: `nav-{destination}`
  - `nav-dashboard`, `nav-blueprint`, `nav-settings`
- **Status/Display**: `{entity}-{property}`
  - `seed-card-rent`, `total-allocated`, `burn-rate-value`

**Component-Level Requirement:**
- All `packages/ui` components that accept `onClick`, `onChange`, `onSubmit` MUST expose a `data-testid` prop
- Pass through to the underlying DOM element

**Audit Rule:**
- When creating new features, add test IDs FIRST before implementing logic
- Use Cursor to verify: "Check this component for missing test IDs"

### Test Data Management

**Test Users (Hardcoded in Supabase):**
```typescript
// These users exist in production DB and are reused across tests
const TEST_USERS = {
  solo: { email: 'solo@plotbudget.test', password: 'test-password-123' },
  couple: { email: 'couple@plotbudget.test', password: 'test-password-123' }
}
```

**Test Data Lifecycle (Hybrid Approach):**
1. **Immutable Seed Data**: Test users, default categories (seeded once, never modified)
2. **Mutable Test Data**: Seeds, pots, repayments (created per test, cleaned up after)

**Cleanup Strategy:**
```sql
-- Run before each test suite
DELETE FROM seeds WHERE household_id IN (
  SELECT id FROM households WHERE owner_id IN (
    SELECT id FROM users WHERE email LIKE '%@plotbudget.test'
  )
);
-- Repeat for pots, repayments, paycycles
```

### Time-Dependent Testing

**Use Playwright's Clock API for consistent dates:**
```typescript
// Freeze time to a known payday (e.g., 2024-01-31)
await page.clock.setFixedTime(new Date('2024-01-31T12:00:00Z'));

// This ensures:
// - Pay cycle dates are predictable
// - Burn rate calculations are consistent
// - "Upcoming bills" filters show expected results
```

**Critical Test Scenarios:**
- [ ] Onboarding: First pay cycle creation with future date
- [ ] Blueprint: Draft cycle creation (next month)
- [ ] Payday Ritual: Archive current cycle, activate draft cycle
- [ ] Dashboard: Metrics recalculate after cycle switch

### Authentication State Reuse

**Setup once, reuse across tests:**
```typescript
// tests/auth.setup.ts
import { test as setup } from '@playwright/test';

setup('authenticate as solo user', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('email-input').fill('solo@plotbudget.test');
  await page.getByTestId('password-input').fill('test-password-123');
  await page.getByTestId('submit-login-form').click();
  await page.waitForURL('/');
  await page.context().storageState({ path: 'tests/.auth/solo.json' });
});
```

**Reuse in tests:**
```typescript
// tests/specs/blueprint.spec.ts
import { test } from '@playwright/test';

test.use({ storageState: 'tests/.auth/solo.json' });

test('add new seed', async ({ page }) => {
  // Already logged in as solo user
  await page.goto('/blueprint');
  // ...
});
```

### CI/CD Testing Strategy

**PR Checks (Fast - ~2 min):**
- Run against `localhost:3000` in GitHub Actions
- Parallel execution enabled
- Only critical paths: auth, onboarding, blueprint CRUD

**Pre-Merge Validation (Thorough - ~5 min):**
- Run against Vercel preview deployment
- Full test suite including edge cases
- Visual snapshots (future Phase 6+)

**Test Execution Triggers:**
```yaml
# .github/workflows/playwright.yml
on:
  pull_request:       # Fast tests on localhost
  push:
    branches: [main]  # Full tests on Vercel preview
```

### Folder Structure
```
apps/web/
├── tests/
│   ├── .auth/                  # Stored auth states (gitignored)
│   ├── fixtures/
│   │   └── test-data.ts        # Shared test data factories
│   ├── pages/                  # Page Object Models
│   │   ├── auth.page.ts
│   │   ├── onboarding.page.ts
│   │   └── blueprint.page.ts
│   ├── specs/
│   │   ├── auth.spec.ts        # Login, signup, logout
│   │   ├── onboarding.spec.ts  # 6-step wizard
│   │   └── blueprint.spec.ts   # CRUD operations
│   ├── utils/
│   │   ├── db-cleanup.ts       # SQL cleanup scripts
│   │   └── test-helpers.ts     # Custom matchers, waiters
│   └── auth.setup.ts           # Global auth setup
├── playwright.config.ts
└── package.json
```

### Development Workflow

**Before writing feature code:**
1. Add test IDs to Figma/design mockups
2. Implement UI components with `data-testid` props
3. Write failing E2E test
4. Implement feature logic
5. Verify test passes

**Local testing commands:**
```bash
# Run all tests (headless)
pnpm test:e2e

# Run specific test file (headed mode for debugging)
pnpm test:e2e tests/specs/onboarding.spec.ts --headed

# Run with Playwright UI (interactive debugging)
pnpm test:e2e:ui

# Generate test report
pnpm test:e2e --reporter=html
```

### Test Coverage Requirements

**Phase 4b (Current - Must Have):**
- [ ] Auth: Login, signup, password reset
- [ ] Onboarding: Solo mode, couple mode (full 6 steps)
- [ ] Blueprint: Add/edit/delete seeds, pots, repayments
- [ ] Dashboard: Verify metrics calculations

**Phase 5 (Payday Ritual - Future):**
- [ ] Draft cycle creation
- [ ] Mark seeds as paid
- [ ] Archive current cycle
- [ ] Activate draft as new current cycle

**Phase 6 (Partner Invitation - Future):**
- [ ] Send invite email
- [ ] Accept invite flow
- [ ] Joint household creation
- [ ] Split ratio adjustments

### Debugging Failed Tests

**Trace Viewer (after test failure):**
```bash
npx playwright show-trace test-results/*/trace.zip
```

**Console Logs:**
```typescript
test('example', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));
});
```

**Pause Execution:**
```typescript
await page.pause(); // Opens Playwright Inspector
```

### Accessibility Testing (Phase 6+)

**Future Integration:**
```typescript
import AxeBuilder from '@axe-core/playwright';

test('homepage is accessible', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

### When Adding New Features

**Cursor Prompt:**
> "I'm implementing [feature name]. Generate the component with data-testid attributes following the E2E Testing Standards in spec.md. Also create a Page Object Model in tests/pages/ and a spec file in tests/specs/ that covers the happy path and one error case."

**Example:**
> "I'm implementing the 'Add Pot' modal. Generate the component with test IDs, create a PotModal page object, and write a spec that tests adding a savings pot and validates the required name field."

---

**End of Functional Specification**