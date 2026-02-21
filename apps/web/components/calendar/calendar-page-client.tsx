'use client';

import { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isSameMonth,
  isToday,
  eachDayOfInterval,
  startOfDay,
  endOfDay,
  parseISO,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEvents } from '@/hooks/use-events';
import { useTasks } from '@/hooks/use-tasks';
import { expandEvents } from '@repo/logic';
import { Button } from '@/components/ui/button';
import { cn } from '@repo/ui';
import type { Task } from '@repo/supabase';

type ViewMode = 'month' | 'week' | 'day';

export function CalendarPageClient() {
  const [view, setView] = useState<ViewMode>('month');
  const [cursor, setCursor] = useState(() => new Date());

  const { rangeStart, rangeEnd, range } = useMemo(() => {
    if (view === 'month') {
      const start = startOfMonth(cursor);
      const end = endOfMonth(cursor);
      return {
        rangeStart: start,
        rangeEnd: end,
        range: { start: start.toISOString(), end: end.toISOString() },
      };
    }
    if (view === 'week') {
      const start = startOfWeek(cursor, { weekStartsOn: 1 });
      const end = endOfWeek(cursor, { weekStartsOn: 1 });
      return {
        rangeStart: start,
        rangeEnd: end,
        range: { start: start.toISOString(), end: end.toISOString() },
      };
    }
    const start = startOfDay(cursor);
    const end = endOfDay(cursor);
    return {
      rangeStart: start,
      rangeEnd: end,
      range: { start: start.toISOString(), end: end.toISOString() },
    };
  }, [view, cursor]);

  const { data: events = [] } = useEvents(range);
  const tasksRange = useMemo(
    () => ({
      due_after: format(rangeStart, 'yyyy-MM-dd'),
      due_before: format(rangeEnd, 'yyyy-MM-dd'),
      limit: 200,
    }),
    [rangeStart, rangeEnd]
  );
  const { data: tasks = [] } = useTasks(tasksRange);

  const occurrences = useMemo(() => {
    const eventOccurrences = expandEvents(
      events as Parameters<typeof expandEvents>[0],
      rangeStart,
      rangeEnd
    );
    const taskOccurrences = tasksWithDueInRange(tasks, rangeStart, rangeEnd);
    return [...eventOccurrences, ...taskOccurrences].sort(
      (a, b) => a.start.getTime() - b.start.getTime()
    );
  }, [events, tasks, rangeStart, rangeEnd]);

  const goPrev = () => {
    if (view === 'month') setCursor((d) => subMonths(d, 1));
    else if (view === 'week') setCursor((d) => subWeeks(d, 1));
    else setCursor((d) => subDays(d, 1));
  };
  const goNext = () => {
    if (view === 'month') setCursor((d) => addMonths(d, 1));
    else if (view === 'week') setCursor((d) => addWeeks(d, 1));
    else setCursor((d) => addDays(d, 1));
  };
  const goToday = () => setCursor(new Date());

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 px-4 py-3">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-heading text-xl font-semibold uppercase tracking-wider text-foreground sm:text-2xl">
            Calendar
          </h1>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border bg-muted/50 p-0.5">
              {(['month', 'week', 'day'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium capitalize',
                    view === v ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" className="h-9 w-9 p-0" onClick={goPrev} aria-label="Previous">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="h-9 px-3" onClick={goToday}>
                Today
              </Button>
              <Button variant="outline" className="h-9 w-9 p-0" onClick={goNext} aria-label="Next">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {view === 'month' && format(cursor, 'MMMM yyyy')}
          {view === 'week' && `Week of ${format(startOfWeek(cursor, { weekStartsOn: 1 }), 'd MMM yyyy')}`}
          {view === 'day' && format(cursor, 'EEEE, d MMMM yyyy')}
        </p>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {view === 'month' && (
          <MonthView cursor={cursor} occurrences={occurrences} onSelectDay={setCursor} />
        )}
        {view === 'week' && (
          <WeekView cursor={cursor} occurrences={occurrences} />
        )}
        {view === 'day' && (
          <DayView date={cursor} occurrences={occurrences} />
        )}
      </main>
    </div>
  );
}

type Occurrence = {
  id: string;
  eventId: string;
  title: string;
  description: string | null;
  start: Date;
  end: Date | null;
  all_day: boolean;
  source_module: string | null;
  source_entity_id: string | null;
};

function tasksWithDueInRange(
  tasks: Task[],
  rangeStart: Date,
  rangeEnd: Date
): Occurrence[] {
  const result: Occurrence[] = [];
  for (const task of tasks) {
    if (!task.due_date) continue;
    const due = parseISO(task.due_date);
    if (due < rangeStart || due > rangeEnd) continue;
    result.push({
      id: `task-${task.id}`,
      eventId: task.id,
      title: task.name,
      description: task.description ?? null,
      start: startOfDay(due),
      end: null,
      all_day: true,
      source_module: 'tasks',
      source_entity_id: task.id,
    });
  }
  return result;
}

function MonthView({
  cursor,
  occurrences,
  onSelectDay,
}: {
  cursor: Date;
  occurrences: Occurrence[];
  onSelectDay: (d: Date) => void;
}) {
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const occurrencesByDay = useMemo(() => {
    const map = new Map<string, Occurrence[]>();
    for (const o of occurrences) {
      const key = format(o.start, 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(o);
    }
    return map;
  }, [occurrences]);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border bg-muted/30">
        {weekDays.map((d) => (
          <div key={d} className="p-2 text-center text-xs font-medium uppercase text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayOccurrences = occurrencesByDay.get(key) ?? [];
          const isCurrentMonth = isSameMonth(day, cursor);
          return (
            <div
              key={key}
              className={cn(
                'min-h-24 border-b border-r border-border p-2 last:border-r-0',
                !isCurrentMonth && 'bg-muted/20'
              )}
            >
              <button
                type="button"
                onClick={() => onSelectDay(day)}
                className={cn(
                  'mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm',
                  isToday(day) && 'bg-module-calendar text-white font-semibold',
                  !isToday(day) && isCurrentMonth && 'text-foreground hover:bg-muted',
                  !isCurrentMonth && 'text-muted-foreground'
                )}
              >
                {format(day, 'd')}
              </button>
              <ul className="space-y-0.5">
                {dayOccurrences.slice(0, 3).map((o) => (
                  <li key={o.id}>
                    <span className="block truncate rounded bg-module-calendar/20 px-1 py-0.5 text-xs text-foreground">
                      {o.title}
                    </span>
                  </li>
                ))}
                {dayOccurrences.length > 3 && (
                  <li className="text-xs text-muted-foreground">+{dayOccurrences.length - 3}</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ cursor, occurrences }: { cursor: Date; occurrences: Occurrence[] }) {
  const weekStart = startOfWeek(cursor, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: endOfWeek(cursor, { weekStartsOn: 1 }) });

  const occurrencesByDay = useMemo(() => {
    const map = new Map<string, Occurrence[]>();
    for (const o of occurrences) {
      const key = format(o.start, 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(o);
    }
    return map;
  }, [occurrences]);

  return (
    <div className="space-y-4">
      {days.map((day) => {
        const key = format(day, 'yyyy-MM-dd');
        const dayOccurrences = (occurrencesByDay.get(key) ?? []).sort(
          (a, b) => a.start.getTime() - b.start.getTime()
        );
        return (
          <div key={key} className="rounded-lg border border-border bg-card p-4">
            <h2 className={cn(
              'font-heading text-sm font-medium uppercase tracking-wider',
              isToday(day) ? 'text-module-calendar' : 'text-muted-foreground'
            )}>
              {format(day, 'EEE d MMM')} {isToday(day) && '— Today'}
            </h2>
            <ul className="mt-2 space-y-2">
              {dayOccurrences.length === 0 && (
                <li className="text-sm text-muted-foreground">No events</li>
              )}
              {dayOccurrences.map((o) => (
                <li key={o.id} className="flex items-center gap-2 rounded border border-border bg-muted/30 px-3 py-2">
                  <span className="text-xs text-muted-foreground">
                    {o.all_day ? 'All day' : format(o.start, 'HH:mm')}
                  </span>
                  <span className="font-medium text-foreground">{o.title}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function DayView({ date, occurrences }: { date: Date; occurrences: Occurrence[] }) {
  const key = format(date, 'yyyy-MM-dd');
  const dayOccurrences = useMemo(() => {
    return occurrences
      .filter((o) => format(o.start, 'yyyy-MM-dd') === key)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [occurrences, key]);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <ul className="space-y-2">
        {dayOccurrences.length === 0 && (
          <li className="text-sm text-muted-foreground">No events this day.</li>
        )}
        {dayOccurrences.map((o) => (
          <li key={o.id} className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
            <span className="text-sm text-muted-foreground">
              {o.all_day ? 'All day' : `${format(o.start, 'HH:mm')}${o.end ? ' – ' + format(o.end, 'HH:mm') : ''}`}
            </span>
            <span className="font-medium text-foreground">{o.title}</span>
            {o.description && (
              <span className="truncate text-sm text-muted-foreground">{o.description}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
