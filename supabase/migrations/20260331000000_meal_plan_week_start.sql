-- Meal plan and shopping week configuration.
-- Users who plan and shop on Saturday or Sunday need their "week" to start on that day
-- so "this week" in the meal plan view matches when they do their ritual.

ALTER TABLE public.households
  ADD COLUMN IF NOT EXISTS meal_plan_week_start_day SMALLINT NOT NULL DEFAULT 0;

ALTER TABLE public.households
  DROP CONSTRAINT IF EXISTS households_meal_plan_week_start_day_check;

ALTER TABLE public.households
  ADD CONSTRAINT households_meal_plan_week_start_day_check
  CHECK (meal_plan_week_start_day >= 0 AND meal_plan_week_start_day <= 6);

COMMENT ON COLUMN public.households.meal_plan_week_start_day IS 'Day of week the meal plan week starts: 0=Sunday, 1=Monday, ..., 6=Saturday. Set to the day you do planning/shopping (e.g. 0 for Sunday, 6 for Saturday).';
