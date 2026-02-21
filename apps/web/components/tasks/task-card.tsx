'use client';

import { cn } from '@repo/ui';
import type { Task } from '@repo/supabase';
import { format, isPast, isToday } from 'date-fns';
import type { AssigneeLabels } from '@/app/dashboard/tasks/page';

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-muted',
  medium: 'bg-blue-500',
  high: 'bg-amber-500',
  urgent: 'bg-red-500',
};

function assigneeBadge(assigned_to: Task['assigned_to'], labels: AssigneeLabels): { title: string; initial: string } {
  switch (assigned_to) {
    case 'me':
      return { title: labels.me, initial: labels.me.charAt(0).toUpperCase() || 'M' };
    case 'partner':
      return { title: labels.partner, initial: labels.partner.charAt(0).toUpperCase() || 'P' };
    case 'both':
      return { title: labels.both, initial: 'B' };
    default:
      return { title: labels.unassigned, initial: '?' };
  }
}

export function TaskCard({
  task,
  showCheckbox = true,
  onToggleComplete,
  onClick,
  isDragging,
  className,
  assigneeLabels,
}: {
  task: Task;
  showCheckbox?: boolean;
  onToggleComplete?: (id: string) => void;
  onClick?: (task: Task) => void;
  isDragging?: boolean;
  className?: string;
  assigneeLabels?: AssigneeLabels;
}) {
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== 'done';
  const isDueToday = task.due_date && isToday(new Date(task.due_date));
  const labels = assigneeLabels ?? { me: 'Me', partner: 'Partner', both: 'Both of us', unassigned: 'Unassigned' };
  const assignee = assigneeBadge(task.assigned_to ?? 'unassigned', labels);
  const assigneeBg =
    task.assigned_to === 'me'
      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
      : task.assigned_to === 'partner'
        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
        : task.assigned_to === 'both'
          ? 'bg-violet-500/20 text-violet-700 dark:text-violet-400'
          : 'bg-muted text-muted-foreground';

  return (
    <div
      role={onClick ? 'button' : undefined}
      onClick={onClick ? () => onClick(task) : undefined}
      className={cn(
        'rounded-lg border border-border bg-card p-3 transition',
        onClick && 'cursor-pointer hover:border-primary/30 hover:bg-accent/30',
        isDragging && 'opacity-80 shadow-lg',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {showCheckbox && onToggleComplete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (task.status !== 'done') onToggleComplete(task.id);
            }}
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={task.status === 'done' ? 'Completed' : 'Mark complete'}
          >
            {task.status === 'done' && (
              <span className="text-xs text-primary" aria-hidden>✓</span>
            )}
          </button>
        )}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'font-medium text-foreground',
              task.status === 'done' && 'line-through text-muted-foreground'
            )}
          >
            {task.name}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {task.routine_id && (
              <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                Routine
              </span>
            )}
            {task.project_id && (
              <span className="rounded bg-violet-500/15 px-1.5 py-0.5 text-xs font-medium text-violet-600 dark:text-violet-400">
                Project
              </span>
            )}
            <span
              className={cn(
                'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                assigneeBg
              )}
              title={assignee.title}
            >
              {assignee.initial}
            </span>
            {task.due_date && (
              <span
                className={cn(
                  'text-xs',
                  isOverdue && 'text-red-600 dark:text-red-400 font-medium',
                  isDueToday && !isOverdue && 'text-amber-600 dark:text-amber-400'
                )}
              >
                {format(new Date(task.due_date), 'd MMM')}
              </span>
            )}
            <span
              className={cn('h-2 w-2 shrink-0 rounded-full', PRIORITY_COLORS[task.priority] ?? 'bg-muted')}
              title={task.priority}
              aria-hidden
            />
          </div>
        </div>
      </div>
    </div>
  );
}
