'use client';

import { useState } from 'react';
import { List, LayoutGrid, Plus } from 'lucide-react';
import type { Task } from '@repo/supabase';
import { useTasks } from '@/hooks/use-tasks';
import { TaskListView } from './task-list-view';
import { TaskKanbanView } from './task-kanban-view';
import { CreateTaskDialog } from './create-task-dialog';
import { EditTaskDialog, isTaskEditable } from './edit-task-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@repo/ui';
import type { AssigneeLabels } from '@/app/dashboard/tasks/page';

export function TasksPageClient({ assigneeLabels }: { assigneeLabels: AssigneeLabels }) {
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const { data: tasks = [], isLoading, error } = useTasks();

  const handleTaskClick = (task: Task) => {
    if (isTaskEditable(task)) setEditTask(task);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 px-4 py-3">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-heading text-xl font-semibold uppercase tracking-wider text-foreground sm:text-2xl">
            Tasks
          </h1>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border bg-muted/50 p-0.5">
              <button
                type="button"
                onClick={() => setView('list')}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition',
                  view === 'list' ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:text-foreground'
                )}
                aria-pressed={view === 'list'}
              >
                <List className="mr-1.5 inline h-4 w-4" aria-hidden />
                List
              </button>
              <button
                type="button"
                onClick={() => setView('kanban')}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition',
                  view === 'kanban' ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:text-foreground'
                )}
                aria-pressed={view === 'kanban'}
              >
                <LayoutGrid className="mr-1.5 inline h-4 w-4" aria-hidden />
                Kanban
              </button>
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" aria-hidden />
              Add task
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        {error && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400">Failed to load tasks. Try again.</p>
        )}
        {isLoading ? (
          <p className="py-8 text-center text-muted-foreground">Loading…</p>
        ) : view === 'list' ? (
          <TaskListView tasks={tasks} onTaskClick={handleTaskClick} assigneeLabels={assigneeLabels} />
        ) : (
          <TaskKanbanView onTaskClick={handleTaskClick} assigneeLabels={assigneeLabels} />
        )}
      </main>
      <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} assigneeLabels={assigneeLabels} />
      <EditTaskDialog
        task={editTask}
        open={!!editTask}
        onOpenChange={(open) => !open && setEditTask(null)}
        assigneeLabels={assigneeLabels}
      />
    </div>
  );
}
