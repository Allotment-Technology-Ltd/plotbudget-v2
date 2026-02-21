'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTaskSchema, type CreateTaskInput } from '@repo/logic';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCreateTask, useProjects } from '@/hooks/use-tasks';
import type { AssigneeLabels } from '@/app/dashboard/tasks/page';

export function CreateTaskDialog({
  open,
  onOpenChange,
  assigneeLabels,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assigneeLabels?: AssigneeLabels;
}) {
  const createTask = useCreateTask();
  const { data: projects = [] } = useProjects();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      name: '',
      description: '',
      assigned_to: 'unassigned',
      priority: 'medium',
      effort_level: 'medium',
    },
  });

  const onSubmit = (data: CreateTaskInput) => {
    const payload = { ...data };
    if (payload.project_id === '') delete (payload as { project_id?: string }).project_id;
    if (payload.due_date === '') delete (payload as { due_date?: string }).due_date;
    createTask.mutate(payload, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle className="font-heading text-lg uppercase tracking-wider">
          Add task
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div>
            <label htmlFor="task-name" className="mb-1 block text-sm font-medium text-foreground">
              Name
            </label>
            <input
              id="task-name"
              {...register('name')}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
              placeholder="e.g. Buy groceries"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="task-desc" className="mb-1 block text-sm font-medium text-muted-foreground">
              Description (optional)
            </label>
            <textarea
              id="task-desc"
              {...register('description')}
              rows={2}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Assigned</label>
              <select {...register('assigned_to')} className="w-full rounded-md border border-border bg-background px-3 py-2">
                <option value="unassigned">{assigneeLabels?.unassigned ?? 'Unassigned'}</option>
                <option value="me">{assigneeLabels?.me ?? 'Me'}</option>
                <option value="partner">{assigneeLabels?.partner ?? 'Partner'}</option>
                <option value="both">{assigneeLabels?.both ?? 'Both of us'}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Priority</label>
              <select {...register('priority')} className="w-full rounded-md border border-border bg-background px-3 py-2">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="task-due" className="mb-1 block text-sm font-medium text-muted-foreground">
              Due date (optional)
            </label>
            <input
              id="task-due"
              type="date"
              {...register('due_date')}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
            />
          </div>
          {projects.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Project (optional)</label>
              <select {...register('project_id')} className="w-full rounded-md border border-border bg-background px-3 py-2">
                <option value="">None</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createTask.isPending}>
              Add task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
