'use client';

import Link from 'next/link';
import { useProjects } from '@/hooks/use-tasks';
import { cn } from '@repo/ui';
import type { Project } from '@repo/supabase';

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_STYLES: Record<string, string> = {
  planning: 'bg-muted text-muted-foreground',
  active: 'bg-module-tasks/20 text-module-tasks dark:bg-module-tasks/30 dark:text-module-tasks',
  on_hold: 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
  completed: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
  cancelled: 'bg-muted text-muted-foreground line-through',
};

export function ProjectsListClient() {
  const { data: projects = [], isLoading, error } = useProjects();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/95 px-4 py-3">
        <div className="mx-auto max-w-5xl">
          <h1 className="font-heading text-xl font-semibold uppercase tracking-wider text-foreground sm:text-2xl">
            Projects
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Multi-phase household projects
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        {error && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400">Failed to load projects.</p>
        )}
        {isLoading ? (
          <p className="py-8 text-center text-muted-foreground">Loading…</p>
        ) : projects.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">No projects yet.</p>
            <Link
              href="/dashboard/tasks"
              className="mt-2 inline-block text-sm font-medium text-module-tasks hover:underline"
            >
              Back to Tasks
            </Link>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </ul>
        )}
        <div className="mt-6">
          <Link
            href="/dashboard/tasks"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            ← Back to Tasks
          </Link>
        </div>
      </main>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const status = project.status ?? 'planning';
  const hasBudget = !!(project.linked_pot_id ?? project.linked_repayment_id ?? project.estimated_budget);

  return (
    <li>
      <Link
        href={`/dashboard/tasks/projects/${project.id}`}
        className="block rounded-lg border border-border bg-card p-4 transition hover:border-module-tasks/50 hover:shadow-md"
      >
        <h2 className="font-heading font-semibold uppercase tracking-wide text-foreground">
          {project.name}
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLES[status] ?? STATUS_STYLES.planning)}>
            {STATUS_LABELS[status] ?? status}
          </span>
          {hasBudget && (
            <span className="text-xs text-muted-foreground">
              Budget linked
            </span>
          )}
        </div>
        {project.estimated_budget != null && project.estimated_budget > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            Est. £{Number(project.estimated_budget).toLocaleString()}
          </p>
        )}
      </Link>
    </li>
  );
}
