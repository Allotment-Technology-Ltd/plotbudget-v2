'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { useProject, useCreatePhase, useCreateTask } from '@/hooks/use-tasks';
import type { ProjectPhase, Task } from '@repo/supabase';
import { TaskCard } from './task-card';
import { useCompleteTask } from '@/hooks/use-tasks';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@repo/ui';

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function ProjectDetailClient({ projectId }: { projectId: string }) {
  const { data: project, isLoading, error } = useProject(projectId);
  const [expandedPhaseId, setExpandedPhaseId] = useState<string | null>(null);
  const [addPhaseOpen, setAddPhaseOpen] = useState(false);
  const [addTaskPhaseId, setAddTaskPhaseId] = useState<string | null>(null);

  if (error || (!isLoading && !project)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-red-600 dark:text-red-400">Project not found.</p>
        <Link href="/dashboard/tasks/projects" className="mt-2 inline-block text-sm text-muted-foreground hover:underline">
          ← Back to projects
        </Link>
      </div>
    );
  }

  if (isLoading || !project) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const phases = project.phases ?? [];
  const tasks = project.tasks ?? [];
  const completedPhases = phases.filter((p) => p.status === 'completed').length;
  const progressPct = phases.length > 0 ? Math.round((completedPhases / phases.length) * 100) : 0;
  const activePhaseId = phases.find((p) => p.status === 'active')?.id ?? phases[0]?.id;
  const effectiveExpanded = expandedPhaseId ?? activePhaseId;

  return (
    <div className="min-h-screen bg-background">
      {/* Cover + title */}
      <div
        className="relative h-32 bg-gradient-to-br from-module-tasks/30 to-module-tasks/10 sm:h-40"
        style={project.cover_image_url ? { backgroundImage: `url(${project.cover_image_url})`, backgroundSize: 'cover' } : undefined}
      >
        <div className="absolute inset-0 flex items-end p-4">
          <h1 className="font-heading text-2xl font-semibold uppercase tracking-wider text-foreground drop-shadow sm:text-3xl">
            {project.name}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-sm font-medium text-muted-foreground">
            {STATUS_LABELS[project.status ?? 'planning']}
          </span>
          {phases.length > 0 && (
            <span className="text-sm text-muted-foreground">
              Phase {completedPhases + (phases.some((p) => p.status === 'active') ? 1 : 0)} of {phases.length}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {phases.length > 0 && (
          <div className="mb-6">
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-module-tasks transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Budget */}
        {(project.linked_pot_id ?? project.linked_repayment_id ?? (project.estimated_budget != null && project.estimated_budget > 0)) && (
          <section className="mb-6 rounded-lg border border-border bg-card p-4">
            <h2 className="font-heading text-sm uppercase tracking-wider text-muted-foreground">Budget</h2>
            {project.linked_pot_id && (
              <Link href="/dashboard/money/blueprint" className="mt-1 block text-sm text-module-tasks hover:underline">
                Linked pot → Blueprint
              </Link>
            )}
            {project.linked_repayment_id && (
              <Link href="/dashboard/money/blueprint" className="mt-1 block text-sm text-module-tasks hover:underline">
                Linked repayment → Blueprint
              </Link>
            )}
            {project.estimated_budget != null && project.estimated_budget > 0 && (
              <p className="mt-1 text-sm text-foreground">
                Est. £{Number(project.estimated_budget).toLocaleString()}
              </p>
            )}
          </section>
        )}

        {/* Phase timeline */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-sm uppercase tracking-wider text-muted-foreground">Phases</h2>
            <Button variant="outline" className="h-8 px-3 text-sm" onClick={() => setAddPhaseOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Add phase
            </Button>
          </div>

          {phases.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              No phases yet. Add one to get started.
            </p>
          ) : (
            <ul className="space-y-2">
              {phases.map((phase) => (
                <PhaseBlock
                  key={phase.id}
                  phase={phase}
                  tasks={tasks.filter((t) => t.phase_id === phase.id)}
                  isExpanded={effectiveExpanded === phase.id}
                  onToggle={() => setExpandedPhaseId((id) => (id === phase.id ? null : phase.id))}
                  onAddTask={() => setAddTaskPhaseId(phase.id)}
                />
              ))}
            </ul>
          )}
        </section>

        <div className="mt-8">
          <Link href="/dashboard/tasks/projects" className="text-sm text-muted-foreground hover:underline">
            ← Back to projects
          </Link>
        </div>
      </div>

      <AddPhaseDialog projectId={projectId} open={addPhaseOpen} onOpenChange={setAddPhaseOpen} />
      <AddTaskDialog
        projectId={projectId}
        phaseId={addTaskPhaseId}
        open={!!addTaskPhaseId}
        onOpenChange={(open) => !open && setAddTaskPhaseId(null)}
      />
    </div>
  );
}

function PhaseBlock({
  phase,
  tasks,
  isExpanded,
  onToggle,
  onAddTask,
}: {
  phase: ProjectPhase;
  tasks: Task[];
  isExpanded: boolean;
  onToggle: () => void;
  onAddTask: () => void;
}) {
  const isCompleted = phase.status === 'completed';
  const isActive = phase.status === 'active';
  const completeTask = useCompleteTask();

  return (
    <li
      className={cn(
        'rounded-lg border bg-card transition',
        isActive && 'border-module-tasks/50 ring-1 ring-module-tasks/20'
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 p-3 text-left"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className={cn('font-heading font-medium uppercase tracking-wide', isCompleted && 'text-muted-foreground')}>
          {phase.name}
        </span>
        {isCompleted && <span className="text-muted-foreground">✓</span>}
      </button>
      {isExpanded && (
        <div className="border-t border-border px-3 pb-3 pt-2">
          <div className="mb-2 flex justify-end">
            <Button variant="ghost" className="h-8 px-2 text-sm" onClick={onAddTask}>
              <Plus className="mr-1 h-3 w-3" />
              Add task
            </Button>
          </div>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks in this phase.</p>
          ) : (
            <ul className="space-y-2">
              {tasks.map((task) => (
                <li key={task.id}>
                  <TaskCard
                    task={task}
                    onToggleComplete={(id, completed) => completeTask.mutate({ id, completed })}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

function AddPhaseDialog({
  projectId,
  open,
  onOpenChange,
}: {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState('');
  const createPhase = useCreatePhase(projectId);

  const submit = () => {
    if (!name.trim()) return;
    createPhase.mutate({ name: name.trim() }, {
      onSuccess: () => {
        setName('');
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogTitle className="font-heading text-lg uppercase tracking-wider">Add phase</DialogTitle>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="phase-name" className="mb-1 block text-sm font-medium text-foreground">Name</label>
            <input
              id="phase-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
              placeholder="e.g. Planning"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={submit} isLoading={createPhase.isPending} disabled={!name.trim()}>
              Add phase
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddTaskDialog({
  projectId,
  phaseId,
  open,
  onOpenChange,
}: {
  projectId: string;
  phaseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState('');
  const createTask = useCreateTask();

  const submit = () => {
    if (!name.trim()) return;
    createTask.mutate(
      { name: name.trim(), project_id: projectId, phase_id: phaseId ?? undefined },
      {
        onSuccess: () => {
          setName('');
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogTitle className="font-heading text-lg uppercase tracking-wider">Add task to phase</DialogTitle>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="task-name" className="mb-1 block text-sm font-medium text-foreground">Task name</label>
            <input
              id="task-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
              placeholder="e.g. Book contractor"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={submit} isLoading={createTask.isPending} disabled={!name.trim()}>
              Add task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
