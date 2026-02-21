/**
 * Generate task insert payloads from active routines for a given date.
 * Used by the API route POST /api/routines/generate.
 */

export interface RoutineRow {
  id: string;
  household_id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'fortnightly' | 'monthly';
  day_of_week: number | null;
  assignment_mode: 'fixed_me' | 'fixed_partner' | 'alternating' | 'unassigned';
  effort_level: 'quick' | 'medium' | 'involved';
  last_generated_for: string | null;
  is_active: boolean;
}

export interface TaskRow {
  id: string;
  routine_id: string | null;
  due_date: string | null;
  created_at: string;
  assigned_to?: 'me' | 'partner' | 'unassigned';
  status?: string;
}

export interface TaskInsert {
  household_id: string;
  name: string;
  routine_id: string;
  assigned_to: 'me' | 'partner' | 'unassigned';
  status: 'todo';
  effort_level: 'quick' | 'medium' | 'involved';
  due_date: string;
}

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getWeekStart(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function sameWeek(a: Date, b: Date): boolean {
  const w1 = getWeekStart(a);
  const w2 = getWeekStart(b);
  return w1.getTime() === w2.getTime();
}

/**
 * For alternating assignment: who was assigned the last task for this routine.
 * Returns 'me' | 'partner' | null if no previous task.
 */
function lastAssigneeForRoutine(
  routineId: string,
  existingTasks: TaskRow[]
): 'me' | 'partner' | null {
  const withRoutine = existingTasks
    .filter((t) => t.routine_id === routineId && (t.assigned_to === 'me' || t.assigned_to === 'partner'))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const last = withRoutine[0];
  return last && (last.assigned_to === 'me' || last.assigned_to === 'partner') ? last.assigned_to : null;
}

/**
 * Generate task inserts from routines for the target date.
 * - daily: one task per day if none exists for that day
 * - weekly: one task per week if none exists for that week (use day_of_week if set)
 * - fortnightly / monthly: use last_generated_for to avoid duplicates
 */
export function generateTasksFromRoutines(
  routines: RoutineRow[],
  existingTasks: TaskRow[],
  targetDate: Date
): TaskInsert[] {
  const targetDateStr = toDateOnly(targetDate);
  const inserts: TaskInsert[] = [];
  const activeRoutines = routines.filter((r) => r.is_active);

  for (const routine of activeRoutines) {
    const existingForRoutine = existingTasks.filter((t) => t.routine_id === routine.id);

    if (routine.frequency === 'daily') {
      const hasTaskForDay = existingForRoutine.some((t) => t.due_date === targetDateStr);
      if (hasTaskForDay) continue;
      const assigned =
        routine.assignment_mode === 'fixed_me'
          ? 'me'
          : routine.assignment_mode === 'fixed_partner'
            ? 'partner'
            : routine.assignment_mode === 'alternating'
              ? lastAssigneeForRoutine(routine.id, existingTasks) === 'partner'
                ? 'me'
                : 'partner'
              : 'unassigned';
      inserts.push({
        household_id: routine.household_id,
        name: routine.name,
        routine_id: routine.id,
        assigned_to: assigned,
        status: 'todo',
        effort_level: routine.effort_level,
        due_date: targetDateStr,
      });
      continue;
    }

    if (routine.frequency === 'weekly') {
      const targetWeekStart = getWeekStart(targetDate);
      const dayOfWeek = routine.day_of_week;
      const dueDate = dayOfWeek != null
        ? (() => {
            const d = new Date(targetWeekStart);
            d.setDate(d.getDate() + dayOfWeek);
            return toDateOnly(d);
          })()
        : targetDateStr;
      const hasTaskForWeek = existingForRoutine.some((t) => t.due_date && sameWeek(new Date(t.due_date), targetDate));
      if (hasTaskForWeek) continue;
      const assigned =
        routine.assignment_mode === 'fixed_me'
          ? 'me'
          : routine.assignment_mode === 'fixed_partner'
            ? 'partner'
            : routine.assignment_mode === 'alternating'
              ? lastAssigneeForRoutine(routine.id, existingTasks) === 'partner'
                ? 'me'
                : 'partner'
              : 'unassigned';
      inserts.push({
        household_id: routine.household_id,
        name: routine.name,
        routine_id: routine.id,
        assigned_to: assigned,
        status: 'todo',
        effort_level: routine.effort_level,
        due_date: dueDate,
      });
      continue;
    }

    if (routine.frequency === 'fortnightly' || routine.frequency === 'monthly') {
      const lastGen = routine.last_generated_for
        ? new Date(routine.last_generated_for)
        : null;
      const minNext =
        routine.frequency === 'fortnightly'
          ? 14
          : 28;
      if (lastGen && (targetDate.getTime() - lastGen.getTime()) / (24 * 60 * 60 * 1000) < minNext) continue;
      const hasRecent = existingForRoutine.some((t) => {
        if (!t.due_date) return false;
        const diff = (targetDate.getTime() - new Date(t.due_date).getTime()) / (24 * 60 * 60 * 1000);
        return diff >= 0 && diff < minNext;
      });
      if (hasRecent) continue;
      const assigned =
        routine.assignment_mode === 'fixed_me'
          ? 'me'
          : routine.assignment_mode === 'fixed_partner'
            ? 'partner'
            : routine.assignment_mode === 'alternating'
              ? lastAssigneeForRoutine(routine.id, existingTasks) === 'partner'
                ? 'me'
                : 'partner'
              : 'unassigned';
      inserts.push({
        household_id: routine.household_id,
        name: routine.name,
        routine_id: routine.id,
        assigned_to: assigned,
        status: 'todo',
        effort_level: routine.effort_level,
        due_date: targetDateStr,
      });
    }
  }

  return inserts;
}
