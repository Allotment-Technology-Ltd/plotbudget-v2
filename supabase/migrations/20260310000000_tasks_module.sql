-- Tasks module: projects, project_phases, tasks, routines.
-- Phase 1 of PLOT platform expansion; RLS scoped by household.

-- Projects: household projects with optional pot/repayment links
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  start_date DATE,
  target_end_date DATE,
  linked_pot_id UUID REFERENCES public.pots(id) ON DELETE SET NULL,
  linked_repayment_id UUID REFERENCES public.repayments(id) ON DELETE SET NULL,
  estimated_budget DECIMAL(12,2),
  actual_spend DECIMAL(12,2) NOT NULL DEFAULT 0,
  cover_image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS projects_household_id_status_idx ON public.projects(household_id, status);

COMMENT ON TABLE public.projects IS 'Household projects (e.g. renovations); can link to pots/repayments.';

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY projects_select_household ON public.projects
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY projects_insert_household ON public.projects
  FOR INSERT WITH CHECK (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY projects_update_household ON public.projects
  FOR UPDATE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY projects_delete_household ON public.projects
  FOR DELETE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE OR REPLACE FUNCTION public.touch_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS projects_set_updated_at ON public.projects;
CREATE TRIGGER projects_set_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.touch_projects_updated_at();

-- Project phases: ordered phases within a project
CREATE TABLE IF NOT EXISTS public.project_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS project_phases_project_id_sort_order_idx ON public.project_phases(project_id, sort_order);

COMMENT ON TABLE public.project_phases IS 'Phases within a project; tasks can be assigned to a phase.';

ALTER TABLE public.project_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY project_phases_select_household ON public.project_phases
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY project_phases_insert_household ON public.project_phases
  FOR INSERT WITH CHECK (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY project_phases_update_household ON public.project_phases
  FOR UPDATE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY project_phases_delete_household ON public.project_phases
  FOR DELETE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

-- Routines: recurring chore templates that can auto-generate tasks
CREATE TABLE IF NOT EXISTS public.routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'fortnightly', 'monthly')),
  day_of_week INTEGER CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6)),
  assignment_mode TEXT NOT NULL DEFAULT 'unassigned' CHECK (assignment_mode IN ('fixed_me', 'fixed_partner', 'alternating', 'unassigned')),
  effort_level TEXT NOT NULL DEFAULT 'medium' CHECK (effort_level IN ('quick', 'medium', 'involved')),
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_generated_for DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS routines_household_id_is_active_idx ON public.routines(household_id, is_active);

COMMENT ON TABLE public.routines IS 'Recurring chore templates; generate tasks on schedule.';

ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY routines_select_household ON public.routines
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY routines_insert_household ON public.routines
  FOR INSERT WITH CHECK (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY routines_update_household ON public.routines
  FOR UPDATE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY routines_delete_household ON public.routines
  FOR DELETE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE OR REPLACE FUNCTION public.touch_routines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS routines_set_updated_at ON public.routines;
CREATE TRIGGER routines_set_updated_at
BEFORE UPDATE ON public.routines
FOR EACH ROW EXECUTE FUNCTION public.touch_routines_updated_at();

-- Tasks: individual work items; can belong to routines or project phases
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT NOT NULL DEFAULT 'unassigned' CHECK (assigned_to IN ('me', 'partner', 'unassigned')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('backlog', 'todo', 'in_progress', 'done', 'skipped')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES public.project_phases(id) ON DELETE SET NULL,
  routine_id UUID REFERENCES public.routines(id) ON DELETE SET NULL,
  effort_level TEXT NOT NULL DEFAULT 'medium' CHECK (effort_level IN ('quick', 'medium', 'involved')),
  kanban_order INTEGER NOT NULL DEFAULT 0,
  linked_module TEXT,
  linked_entity_id UUID,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tasks_household_id_status_idx ON public.tasks(household_id, status);
CREATE INDEX IF NOT EXISTS tasks_household_id_due_date_idx ON public.tasks(household_id, due_date);
CREATE INDEX IF NOT EXISTS tasks_project_id_idx ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS tasks_routine_id_idx ON public.tasks(routine_id);
CREATE INDEX IF NOT EXISTS tasks_phase_id_idx ON public.tasks(phase_id);

COMMENT ON TABLE public.tasks IS 'Tasks, chores, and project work items; can link to routines and project phases.';

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tasks_select_household ON public.tasks
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY tasks_insert_household ON public.tasks
  FOR INSERT WITH CHECK (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY tasks_update_household ON public.tasks
  FOR UPDATE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY tasks_delete_household ON public.tasks
  FOR DELETE USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE OR REPLACE FUNCTION public.touch_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_set_updated_at ON public.tasks;
CREATE TRIGGER tasks_set_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.touch_tasks_updated_at();
