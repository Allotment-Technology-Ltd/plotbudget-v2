'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PoundSterling, CheckSquare, Calendar, Search, RotateCcw, UtensilsCrossed } from 'lucide-react';
import { cn } from '@repo/ui';
import { useModuleFlags } from '@/contexts/module-flags-context';
import type { LauncherTaskGroups, LauncherEventGroups } from '@/app/dashboard/page';

type LauncherClientProps = {
  hasCompletedMoneyOnboarding: boolean;
  isPartner: boolean;
  taskGroups: LauncherTaskGroups;
  eventGroups: LauncherEventGroups;
};

const moneyHref = (hasCompleted: boolean, isPartner: boolean) =>
  hasCompleted || isPartner ? '/dashboard/money' : '/onboarding';

type SearchResult =
  | { type: 'module'; id: string; label: string; href: string }
  | { type: 'task'; id: string; label: string; href: string }
  | { type: 'event'; id: string; label: string; href: string };

function LauncherSearch({
  taskGroups,
  eventGroups,
  moneyLink,
}: {
  taskGroups: LauncherTaskGroups;
  eventGroups: LauncherEventGroups;
  moneyLink: string;
}) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const scheduleBlur = () => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    blurTimeoutRef.current = setTimeout(() => setFocused(false), 150);
  };
  const cancelBlur = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  };

  const moduleFlags = useModuleFlags();
  const modules: SearchResult[] = useMemo(
    () => {
      const list: SearchResult[] = [
        { type: 'module', id: 'money', label: 'Money', href: moneyLink },
        { type: 'module', id: 'tasks', label: 'Tasks', href: '/dashboard/tasks' },
        { type: 'module', id: 'calendar', label: 'Calendar', href: '/dashboard/calendar' },
        { type: 'module', id: 'weekly-reset', label: 'Weekly Reset', href: '/dashboard/tasks/weekly-reset' },
      ];
      if (moduleFlags.meals) list.push({ type: 'module', id: 'meals', label: 'Meals', href: '/dashboard/meals' });
      return list;
    },
    [moneyLink, moduleFlags.meals]
  );

  const allTasks = useMemo(
    () => [
      ...taskGroups.today,
      ...taskGroups.tomorrow,
      ...taskGroups.this_week,
    ],
    [taskGroups]
  );
  const allEvents = useMemo(
    () => [
      ...eventGroups.today,
      ...eventGroups.tomorrow,
      ...eventGroups.this_week,
    ],
    [eventGroups]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return [];
    const out: SearchResult[] = [];
    for (const m of modules) {
      if (m.label.toLowerCase().includes(q)) out.push(m);
    }
    for (const t of allTasks) {
      if ((t.name ?? '').toLowerCase().includes(q)) {
        out.push({ type: 'task', id: t.id, label: t.name ?? 'Untitled', href: '/dashboard/tasks' });
      }
    }
    for (const e of allEvents) {
      if ((e.title ?? '').toLowerCase().includes(q)) {
        out.push({ type: 'event', id: e.id, label: e.title ?? 'Untitled', href: '/dashboard/calendar' });
      }
    }
    return out.slice(0, 8);
  }, [query, modules, allTasks, allEvents]);

  const showResults = focused && query.trim().length > 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setQuery('');
      setFocused(false);
      inputRef.current?.blur();
    }
    if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      router.push(results[0]!.href);
      setQuery('');
      setFocused(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-muted/30 px-4 py-3 text-muted-foreground focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background focus-within:text-foreground transition-colors">
        <Search className="h-5 w-5 shrink-0" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { cancelBlur(); setFocused(true); }}
          onBlur={scheduleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Search modules, tasks, events…"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          aria-label="Search"
          aria-autocomplete="list"
          aria-expanded={showResults}
          aria-controls="launcher-search-results"
          role="combobox"
        />
      </div>
      {showResults && (
        <ul
          id="launcher-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-auto rounded-xl border border-border bg-card py-1 shadow-lg"
        >
          {results.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted-foreground">No results</li>
          ) : (
            results.map((r) => (
              <li key={`${r.type}-${r.id}`} role="option">
                <Link
                  href={r.href}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted focus:bg-muted focus:outline-none"
                  onClick={() => { cancelBlur(); setQuery(''); setFocused(false); }}
                >
                  {r.type === 'module' && <span className="text-muted-foreground">Module</span>}
                  {r.type === 'task' && <span className="text-muted-foreground">Task</span>}
                  {r.type === 'event' && <span className="text-muted-foreground">Event</span>}
                  <span className="truncate font-medium">{r.label}</span>
                </Link>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

function UpcomingList({
  today,
  tomorrow,
  thisWeek,
  titleKey,
  emptyLabel,
}: {
  today: { id: string; name?: string; title?: string }[];
  tomorrow: { id: string; name?: string; title?: string }[];
  thisWeek: { id: string; name?: string; title?: string }[];
  titleKey: 'name' | 'title';
  emptyLabel: string;
}) {
  const getTitle = (item: { id: string; name?: string; title?: string }) =>
    (titleKey === 'name' ? item.name : item.title) ?? 'Untitled';
  const hasAny = today.length + tomorrow.length + thisWeek.length > 0;
  if (!hasAny) return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;

  const parts: string[] = [];
  if (today.length) parts.push(`Today: ${today.map(getTitle).join(', ')}`);
  if (tomorrow.length) parts.push(`Tomorrow: ${tomorrow.map(getTitle).join(', ')}`);
  if (thisWeek.length) parts.push(`This week: ${thisWeek.map(getTitle).join(', ')}`);
  return (
    <p className="text-sm text-muted-foreground line-clamp-3" title={parts.join(' · ')}>
      {parts.join(' · ')}
    </p>
  );
}

export function LauncherClient({
  hasCompletedMoneyOnboarding,
  isPartner,
  taskGroups,
  eventGroups,
}: LauncherClientProps) {
  const moneyLink = moneyHref(hasCompletedMoneyOnboarding, isPartner);
  const moduleFlags = useModuleFlags();

  const modules = useMemo(() => {
    const list: {
      id: string;
      name: string;
      href: string;
      icon: typeof PoundSterling;
      available: boolean;
      accent: string;
    }[] = [
      {
        id: 'money',
        name: 'Money',
        href: moneyLink,
        icon: PoundSterling,
        available: true,
        accent: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
      },
      {
        id: 'tasks',
        name: 'Tasks',
        href: '/dashboard/tasks',
        icon: CheckSquare,
        available: true,
        accent: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
      },
      {
        id: 'calendar',
        name: 'Calendar',
        href: '/dashboard/calendar',
        icon: Calendar,
        available: true,
        accent: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
      },
    ];
    if (moduleFlags.meals) {
      list.push({
        id: 'meals',
        name: 'Meals',
        href: '/dashboard/meals',
        icon: UtensilsCrossed,
        available: true,
        accent: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
      });
    }
    return list;
  }, [moneyLink, moduleFlags.meals]);

  const now = new Date();
  const monthLabel = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <div className="flex min-h-screen flex-col bg-background pb-8" data-testid="dashboard-launcher">
      {/* Widgets row — Calendar, Tasks, Weekly Reset (always link so user can drill down or add) */}
      <section className="px-4 pt-4 sm:pt-6" aria-label="Widgets">
        <div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-3">
          <Link
            href="/dashboard/calendar"
            className="flex flex-col gap-2 rounded-2xl border border-border/80 bg-card/80 p-4 backdrop-blur-sm transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400">
                <Calendar className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Calendar
              </span>
            </div>
            <p className="font-semibold text-foreground">{monthLabel}</p>
            <UpcomingList
              today={[
                ...eventGroups.today.map((e) => ({ id: e.id, title: e.title })),
                ...taskGroups.today.map((t) => ({ id: t.id, name: t.name, title: t.name })),
              ]}
              tomorrow={[
                ...eventGroups.tomorrow.map((e) => ({ id: e.id, title: e.title })),
                ...taskGroups.tomorrow.map((t) => ({ id: t.id, name: t.name, title: t.name })),
              ]}
              thisWeek={[
                ...eventGroups.this_week.map((e) => ({ id: e.id, title: e.title })),
                ...taskGroups.this_week.map((t) => ({ id: t.id, name: t.name, title: t.name })),
              ]}
              titleKey="title"
              emptyLabel="No events or tasks — open calendar"
            />
          </Link>
          <Link
            href="/dashboard/tasks"
            className="flex flex-col gap-2 rounded-2xl border border-border/80 bg-card/80 p-4 backdrop-blur-sm transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <CheckSquare className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Tasks
              </span>
            </div>
            <p className="font-semibold text-foreground">
              {taskGroups.today.length + taskGroups.tomorrow.length + taskGroups.this_week.length > 0
                ? `${taskGroups.today.length + taskGroups.tomorrow.length + taskGroups.this_week.length} due soon`
                : 'No tasks'}
            </p>
            <UpcomingList
              today={taskGroups.today}
              tomorrow={taskGroups.tomorrow}
              thisWeek={taskGroups.this_week}
              titleKey="name"
              emptyLabel="Chores & routines"
            />
          </Link>
          <Link
            href="/dashboard/tasks/weekly-reset"
            className="flex flex-col gap-2 rounded-2xl border border-border/80 bg-card/80 p-4 backdrop-blur-sm transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <RotateCcw className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Weekly Reset
              </span>
            </div>
            <p className="font-semibold text-foreground">Sort out the week</p>
            <p className="text-sm text-muted-foreground">Review routines, claim tasks, set deadlines</p>
          </Link>
        </div>
      </section>

      {/* Search — modules, tasks, events */}
      <section className="px-4 pt-4 sm:pt-6" aria-label="Search">
        <div className="mx-auto max-w-4xl">
          <LauncherSearch
            taskGroups={taskGroups}
            eventGroups={eventGroups}
            moneyLink={moneyLink}
          />
        </div>
      </section>

      {/* App grid — icon-first, 4 columns like iOS home screen */}
      <section className="flex-1 px-4 pt-6 sm:pt-8" aria-label="Modules">
        <div className="mx-auto max-w-4xl">
          <ul
            className="grid grid-cols-3 gap-4 sm:gap-6"
            role="list"
          >
            {modules.map((mod) => {
              const Icon = mod.icon;
              const isComingSoon = !mod.available;
              return (
                <li key={mod.id} className="flex flex-col items-center">
                  {isComingSoon ? (
                    <div
                      className="flex flex-col items-center gap-2 opacity-50"
                      aria-disabled="true"
                    >
                      <span
                        className={cn(
                          'flex h-14 w-14 items-center justify-center rounded-2xl sm:h-16 sm:w-16',
                          mod.accent
                        )}
                      >
                        <Icon className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden />
                      </span>
                      <span className="text-center text-xs font-medium text-muted-foreground sm:text-sm">
                        {mod.name}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80 sm:text-xs">
                        Soon
                      </span>
                    </div>
                  ) : (
                    <Link
                      href={mod.href}
                      className="flex flex-col items-center gap-2 transition opacity-100 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-2xl"
                    >
                      <span
                        className={cn(
                          'flex h-14 w-14 items-center justify-center rounded-2xl sm:h-16 sm:w-16',
                          mod.accent
                        )}
                      >
                        <Icon className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden />
                      </span>
                      <span className="text-center text-xs font-medium text-foreground sm:text-sm">
                        {mod.name}
                      </span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}
