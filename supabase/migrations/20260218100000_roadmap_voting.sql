-- Roadmap voting: features (modules) and one vote per household per feature.
-- Features are public; vote counts are public; only authenticated users with a household can vote.

CREATE TABLE IF NOT EXISTS public.roadmap_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  module_key TEXT NOT NULL UNIQUE,
  icon_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('now', 'next', 'later', 'shipped')),
  display_order INTEGER NOT NULL DEFAULT 0,
  key_features TEXT[] NOT NULL DEFAULT '{}',
  estimated_timeline TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roadmap_features_status_order ON public.roadmap_features(status, display_order);

COMMENT ON TABLE public.roadmap_features IS 'Roadmap modules; public read. Used for voting and marketing roadmap page.';

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_roadmap_features_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS update_roadmap_features_updated_at ON public.roadmap_features;
CREATE TRIGGER update_roadmap_features_updated_at
  BEFORE UPDATE ON public.roadmap_features
  FOR EACH ROW EXECUTE FUNCTION public.touch_roadmap_features_updated_at();

ALTER TABLE public.roadmap_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY roadmap_features_select_all ON public.roadmap_features
  FOR SELECT TO anon, authenticated
  USING (true);

-- Votes: one per household per feature
CREATE TABLE IF NOT EXISTS public.roadmap_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID NOT NULL REFERENCES public.roadmap_features(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (feature_id, household_id)
);

CREATE INDEX IF NOT EXISTS idx_roadmap_votes_feature ON public.roadmap_votes(feature_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_votes_household ON public.roadmap_votes(household_id);

COMMENT ON TABLE public.roadmap_votes IS 'One vote per household per feature; used for roadmap prioritisation.';

ALTER TABLE public.roadmap_votes ENABLE ROW LEVEL SECURITY;

-- Anyone can read votes (for public counts)
CREATE POLICY roadmap_votes_select_all ON public.roadmap_votes
  FOR SELECT TO anon, authenticated
  USING (true);

-- Authenticated users can insert only for their own household
CREATE POLICY roadmap_votes_insert_own_household ON public.roadmap_votes
  FOR INSERT TO authenticated
  WITH CHECK (
    household_id = (SELECT household_id FROM public.users WHERE id = auth.uid())
    AND (SELECT household_id FROM public.users WHERE id = auth.uid()) IS NOT NULL
    AND user_id = auth.uid()
  );

-- Users can delete only votes for their household
CREATE POLICY roadmap_votes_delete_own_household ON public.roadmap_votes
  FOR DELETE TO authenticated
  USING (
    household_id = (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

-- Seed 9 modules
INSERT INTO public.roadmap_features (
  title, description, module_key, icon_name, status, display_order, key_features, estimated_timeline
) VALUES
(
  'Money',
  'Budget planning and the 15-minute payday ritual',
  'money',
  'DollarSign',
  'now',
  1,
  ARRAY[
    'Monthly payday ritual (15-minute guided ceremony)',
    'Blueprint planning (allocate income across categories)',
    'Seed tracking (bills, savings, wants, repayments)',
    'Fair split calculator (for couples with separate accounts)',
    'Pay cycle management (solo or couple mode)',
    '50/30/10/10 framework with visual breakdowns'
  ],
  'Live in Beta'
),
(
  'Platform Foundation',
  'Core infrastructure for the module ecosystem',
  'platform',
  'Layers',
  'next',
  2,
  ARRAY[
    'Notification engine (in-app + email digests)',
    'Activity feed (household timeline of all actions)',
    'Module navigation (mobile bottom tabs + web sidebar)',
    'Global search (across all modules)',
    'Subscription tier gating (Free vs Pro)'
  ],
  'In Development'
),
(
  'Tasks & Projects',
  'Chores, to-dos, and multi-phase household projects',
  'tasks',
  'CheckSquare',
  'next',
  3,
  ARRAY[
    'Weekly Reset ceremony (10-minute Sunday ritual)',
    'Recurring chore templates (auto-generate weekly tasks)',
    'Project planning (phases, kanban boards, timelines)',
    'Fairness tracking (task distribution over time)',
    'Cross-module linking (project → repayment, meal → shopping task)'
  ],
  'Q1 2026'
),
(
  'Calendar',
  'Shared household calendar, not individual schedules',
  'calendar',
  'Calendar',
  'next',
  4,
  ARRAY[
    'Household view (everyone''s commitments visible)',
    'Event categories (work, personal, family, home maintenance)',
    'Weekly Lookahead integration with Weekly Reset',
    'iCal sync (import external calendars)',
    'Reminder system (integrated with notifications)'
  ],
  'Q2 2026'
),
(
  'Meals & Groceries',
  'Meal planning and shopping list management',
  'meals',
  'Utensils',
  'later',
  5,
  ARRAY[
    'Meal planning interface (weekly grid)',
    'Recipe library (with ingredient lists)',
    'Auto-generated shopping lists (from meal selections)',
    'Budget integration (grocery seed tracking)',
    'Rotation suggestions (based on past meals)'
  ],
  'Q2 2026'
),
(
  'Holidays & Trips',
  'Trip planning from idea to packing list',
  'holidays',
  'Plane',
  'later',
  6,
  ARRAY[
    'Trip Planning ceremony (20-minute guided session)',
    'Itinerary builder (days, activities, bookings)',
    'Budget integration (auto-create savings pot + spend tracking)',
    'Packing list generator (with weather integration)',
    'Document links (passports, tickets, insurance)'
  ],
  'Q3 2026'
),
(
  'Vault',
  'Secure document storage and renewal tracking',
  'vault',
  'Lock',
  'later',
  7,
  ARRAY[
    'Document upload and categorisation',
    'Expiry/renewal reminders (passports, insurance, MOT)',
    'Emergency card (critical info in one place)',
    'Secure sharing (within household only)',
    'Search and tag system'
  ],
  'Q3 2026'
),
(
  'Home Maintenance',
  'Track maintenance, repairs, and seasonal tasks',
  'home',
  'Home',
  'later',
  8,
  ARRAY[
    'Maintenance log (appliances, utilities, structure)',
    'Quarterly Health Check ceremony (seasonal checklist)',
    'Contractor tracking (contact info, past work, costs)',
    'Warranty/manual storage (links to Vault)',
    'Task integration (maintenance → auto-create task)'
  ],
  'Q4 2026'
),
(
  'Kids',
  'Child profiles, activities, and school calendar',
  'kids',
  'Baby',
  'later',
  9,
  ARRAY[
    'Child profiles (sizes, medical info, documents)',
    'School calendar (term view, events, holidays)',
    'Activities manager (weekly timetable, costs)',
    'Childcare rota (pickup/dropoff assignments)',
    'Growth log (height, weight, milestones)'
  ],
  'Conditional - based on demand'
)
ON CONFLICT (module_key) DO NOTHING;
