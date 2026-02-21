import { addDays, endOfWeek, format, parseISO } from 'date-fns';
import { getCachedDashboardAuth, getCachedSupabase } from '@/lib/auth/server-auth-cache';
import { redirect } from 'next/navigation';
import { LauncherClient } from '@/components/dashboard/launcher-client';

type DateBucket = 'today' | 'tomorrow' | 'this_week';

export type LauncherTaskItem = { id: string; name: string; due_date: string };
export type LauncherEventItem = { id: string; title: string; start_at: string };

export type LauncherTaskGroups = {
  today: LauncherTaskItem[];
  tomorrow: LauncherTaskItem[];
  this_week: LauncherTaskItem[];
};

export type LauncherEventGroups = {
  today: LauncherEventItem[];
  tomorrow: LauncherEventItem[];
  this_week: LauncherEventItem[];
};

function bucketTask(task: LauncherTaskItem, todayStr: string, tomorrowStr: string): DateBucket {
  if (task.due_date === todayStr) return 'today';
  if (task.due_date === tomorrowStr) return 'tomorrow';
  return 'this_week';
}

function bucketEvent(event: LauncherEventItem, todayStr: string, tomorrowStr: string): DateBucket {
  const date = event.start_at.slice(0, 10);
  if (date === todayStr) return 'today';
  if (date === tomorrowStr) return 'tomorrow';
  return 'this_week';
}

/**
 * Module Launcher (PLOT home). Shown after essential setup (household).
 * Money tile: /dashboard/money if onboarded (or partner), else /onboarding.
 */
export default async function LauncherPage() {
  const { user, profile, owned, partnerOf } = await getCachedDashboardAuth();
  if (!user) redirect('/login');

  const isPartner = !owned && !!partnerOf;
  const householdId = profile?.household_id ?? partnerOf?.id ?? null;
  if (!householdId) redirect('/onboarding');

  const hasCompletedMoneyOnboarding = !!(profile?.has_completed_onboarding ?? isPartner);

  const supabase = await getCachedSupabase();
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const tomorrowDate = addDays(parseISO(`${todayStr}T00:00:00.000Z`), 1);
  const tomorrowStr = format(tomorrowDate, 'yyyy-MM-dd');
  const endOfWeekDate = endOfWeek(now, { weekStartsOn: 1 });
  const endOfWeekStr = format(endOfWeekDate, 'yyyy-MM-dd');

  const weekStart = `${todayStr}T00:00:00.000Z`;
  const weekEndExclusive = format(addDays(endOfWeekDate, 1), "yyyy-MM-dd'T00:00:00.000Z");

  const [tasksRes, eventsRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, name, due_date')
      .eq('household_id', householdId)
      .gte('due_date', todayStr)
      .lte('due_date', endOfWeekStr)
      .in('status', ['backlog', 'todo', 'in_progress'])
      .order('due_date', { ascending: true })
      .limit(30),
    supabase
      .from('events')
      .select('id, title, start_at')
      .eq('household_id', householdId)
      .gte('start_at', weekStart)
      .lt('start_at', weekEndExclusive)
      .order('start_at', { ascending: true })
      .limit(30),
  ]);

  const tasks = (tasksRes.data ?? []) as LauncherTaskItem[];
  const events = (eventsRes.data ?? []) as LauncherEventItem[];

  const taskGroups: LauncherTaskGroups = {
    today: [],
    tomorrow: [],
    this_week: [],
  };
  for (const t of tasks) {
    const bucket = bucketTask(t, todayStr, tomorrowStr);
    taskGroups[bucket].push(t);
  }

  const eventGroups: LauncherEventGroups = {
    today: [],
    tomorrow: [],
    this_week: [],
  };
  for (const e of events) {
    const bucket = bucketEvent(e, todayStr, tomorrowStr);
    eventGroups[bucket].push(e);
  }

  return (
    <LauncherClient
      hasCompletedMoneyOnboarding={hasCompletedMoneyOnboarding}
      isPartner={isPartner}
      taskGroups={taskGroups}
      eventGroups={eventGroups}
    />
  );
}
