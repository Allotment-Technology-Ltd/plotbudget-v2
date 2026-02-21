'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Task } from '@repo/supabase';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUpdateTask, useProjects } from '@/hooks/use-tasks';
import type { AssigneeLabels } from '@/app/dashboard/tasks/page';

const editTaskFormSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  assigned_to: z.enum(['me', 'partner', 'both', 'unassigned']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  due_date: z.string().optional(),
  project_id: z.string().uuid().optional().or(z.literal('')),
  status: z.enum(['backlog', 'todo', 'in_progress']),
});
type EditTaskFormValues = z.infer<typeof editTaskFormSchema>;

const EDITABLE_STATUSES = ['backlog', 'todo', 'in_progress'] as const;
export function isTaskEditable(task: Task): boolean {
  return EDITABLE_STATUSES.includes(task.status as (typeof EDITABLE_STATUSES)[number]);
}

export function EditTaskDialog({
  task,
  open,
  onOpenChange,
  assigneeLabels,
}: {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assigneeLabels?: AssigneeLabels;
}) {
  const updateTask = useUpdateTask();
  const { data: projects = [] } = useProjects();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<EditTaskFormValues>({
    resolver: zodResolver(editTaskFormSchema),
    defaultValues: {
      name: '',
      description: '',
      assigned_to: 'unassigned',
      priority: 'medium',
      due_date: '',
      project_id: '',
      status: 'todo',
    },
  });

  useEffect(() => {
    if (task && open) {
      setValue('name', task.name);
      setValue('description', task.description ?? '');
      setValue('assigned_to', (task.assigned_to === 'me' || task.assigned_to === 'partner' || task.assigned_to === 'both' ? task.assigned_to : 'unassigned') as EditTaskFormValues['assigned_to']);
      setValue('priority', task.priority ?? 'medium');
      setValue('due_date', task.due_date ?? '');
      setValue('project_id', task.project_id ?? '');
      setValue(
        'status',
        EDITABLE_STATUSES.includes(task.status as (typeof EDITABLE_STATUSES)[number])
          ? (task.status as EditTaskFormValues['status'])
          : 'todo'
      );
    }
  }, [task, open, setValue]);

  const onSubmit = (data: EditTaskFormValues) => {
    if (!task) return;
    const payload = {
      id: task.id,
      name: data.name,
      description: data.description || null,
      assigned_to: data.assigned_to,
      priority: data.priority,
      due_date: data.due_date || null,
      project_id: data.project_id || null,
      status: data.status,
    };
    updateTask.mutate(payload, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
    });
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle className="font-heading text-lg uppercase tracking-wider">
          Edit task
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div>
            <label htmlFor="edit-task-name" className="mb-1 block text-sm font-medium text-foreground">
              Name
            </label>
            <input
              id="edit-task-name"
              {...register('name')}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
              placeholder="e.g. Buy groceries"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="edit-task-desc" className="mb-1 block text-sm font-medium text-muted-foreground">
              Description (optional)
            </label>
            <textarea
              id="edit-task-desc"
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
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Status</label>
              <select {...register('status')} className="w-full rounded-md border border-border bg-background px-3 py-2">
                <option value="backlog">Backlog</option>
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
              </select>
            </div>
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
          <div>
            <label htmlFor="edit-task-due" className="mb-1 block text-sm font-medium text-muted-foreground">
              Due date (optional)
            </label>
            <input
              id="edit-task-due"
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
            <Button type="submit" isLoading={updateTask.isPending}>
              Save changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
