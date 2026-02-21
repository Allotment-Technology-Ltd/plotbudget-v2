'use client';

import { useMemo, useState } from 'react';
import { isPast, isToday, isThisWeek } from 'date-fns';
import type { Task } from '@repo/supabase';
import { cn } from '@repo/ui';
import { TaskCard } from './task-card';
import { useCompleteTask } from '@/hooks/use-tasks';
import type { AssigneeLabels } from '@/app/dashboard/tasks/page';

function groupTasks(tasks: Task[]) {
  const overdue: Task[] = [];
  const today: Task[] = [];
  const thisWeek: Task[] = [];
  const later: Task[] = [];
  const done: Task[] = [];

  for (const t of tasks) {
    if (t.status === 'done') {
      done.push(t);
      continue;
    }
    if (!t.due_date) {
      later.push(t);
      continue;
    }
    const d = new Date(t.due_date);
    if (isPast(d) && !isToday(d)) overdue.push(t);
    else if (isToday(d)) today.push(t);
    else if (isThisWeek(d)) thisWeek.push(t);
    else later.push(t);
  }

  return { overdue, today, thisWeek, later, done };
}

export function TaskListView({
  tasks,
  onTaskClick,
  assigneeLabels,
}: {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  assigneeLabels?: AssigneeLabels;
}) {
  const completeTask = useCompleteTask();
  const { overdue, today, thisWeek, later, done } = useMemo(() => groupTasks(tasks), [tasks]);
  const [showDone, setShowDone] = useState(false);
  const handleToggleComplete = (id: string, completed?: boolean) => {
    if (completed) setShowDone(true);
    completeTask.mutate({ id, completed });
  };
  const sections = [
    { title: 'Overdue', items: overdue, accent: 'text-red-600 dark:text-red-400' },
    { title: 'Today', items: today, accent: '' },
    { title: 'This week', items: thisWeek, accent: '' },
    { title: 'Later', items: later, accent: '' },
  ];

  return (
    <div className="space-y-6">
      {sections.map(
        (s) =>
          s.items.length > 0 && (
            <section key={s.title}>
              <h2 className={cn('mb-2 font-heading text-sm uppercase tracking-wider text-muted-foreground', s.accent)}>
                {s.title}
              </h2>
              <ul className="space-y-2">
                {s.items.map((task) => (
                  <li key={task.id}>
                    <TaskCard
                      task={task}
                      onToggleComplete={handleToggleComplete}
                      onClick={onTaskClick}
                      assigneeLabels={assigneeLabels}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )
      )}
      {done.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setShowDone((x) => !x)}
            className="mb-2 font-heading text-sm uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            Done ({done.length}) {showDone ? '▼' : '▶'}
          </button>
          {showDone && (
            <ul className="space-y-2">
              {done.map((task) => (
                <li key={task.id}>
                  <TaskCard
                    task={task}
                    onToggleComplete={handleToggleComplete}
                    onClick={onTaskClick}
                    assigneeLabels={assigneeLabels}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      {tasks.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">No tasks yet. Add one to get started.</p>
      )}
    </div>
  );
}
