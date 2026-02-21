'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { computeFairness } from '@repo/logic';
import type { Task, Project, ProjectPhase, Routine } from '@repo/supabase';
import type { CreateTaskInput, UpdateTaskInput, CreateProjectInput, UpdateProjectInput, CreatePhaseInput, CreateRoutineInput, UpdateRoutineInput } from '@repo/logic';

export type TaskFilters = {
  status?: string;
  assigned_to?: string;
  project_id?: string;
  due_before?: string;
  due_after?: string;
  limit?: number;
};

function buildTasksQuery(filters?: TaskFilters) {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.assigned_to) params.set('assigned_to', filters.assigned_to);
  if (filters?.project_id) params.set('project_id', filters.project_id);
  if (filters?.due_before) params.set('due_before', filters.due_before);
  if (filters?.due_after) params.set('due_after', filters.due_after);
  if (filters?.limit) params.set('limit', String(filters.limit));
  const q = params.toString();
  return `/api/tasks${q ? `?${q}` : ''}`;
}

export function useTasks(filters?: TaskFilters) {
  return useQuery({
    queryKey: ['tasks', filters ?? {}],
    queryFn: async () => {
      const res = await fetch(buildTasksQuery(filters));
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Task[]>;
    },
  });
}

export function useTask(id: string | null) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${id}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Task>;
    },
    enabled: !!id,
  });
}

export function useProjects(filters?: { status?: string }) {
  return useQuery({
    queryKey: ['projects', filters ?? {}],
    queryFn: async () => {
      const params = filters?.status ? `?status=${encodeURIComponent(filters.status)}` : '';
      const res = await fetch(`/api/projects${params}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Project[]>;
    },
  });
}

export type ProjectWithPhasesAndTasks = Project & { phases: ProjectPhase[]; tasks: Task[] };

export function useProject(id: string | null) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<ProjectWithPhasesAndTasks>;
    },
    enabled: !!id,
  });
}

export function useRoutines(filters?: { active?: boolean }) {
  return useQuery({
    queryKey: ['routines', filters ?? {}],
    queryFn: async () => {
      const params = filters?.active === true ? '?active=true' : '';
      const res = await fetch(`/api/routines${params}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Routine[]>;
    },
  });
}

export function useFairness(periodDays = 30) {
  const { data: tasks } = useTasks({ limit: 200 });
  return useMemo(() => {
    if (!tasks?.length) return { myPercentage: 0, partnerPercentage: 0, myCount: 0, partnerCount: 0, myWeightedScore: 0, partnerWeightedScore: 0, isBalanced: true };
    return computeFairness({
      tasks: tasks.map((t) => ({ assigned_to: t.assigned_to, status: t.status, effort_level: t.effort_level, completed_at: t.completed_at })),
      periodDays,
    });
  }, [tasks, periodDays]);
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Task>;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); qc.invalidateQueries({ queryKey: ['project'] }); },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateTaskInput) => {
      const res = await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Task>;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['task', data.id] });
      qc.invalidateQueries({ queryKey: ['project'] });
    },
  });
}

export function useCompleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${id}/complete`, { method: 'PATCH' });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Task>;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['tasks'] });
      const prev = qc.getQueryData<Task[]>(['tasks']);
      qc.setQueryData<Task[]>(['tasks'], (old) =>
        old?.map((t) => (t.id === id ? { ...t, status: 'done' as const, completed_at: new Date().toISOString() } : t)) ?? []
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => { if (ctx?.prev) qc.setQueryData(['tasks'], ctx.prev); },
    onSettled: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.removeQueries({ queryKey: ['task', id] });
      qc.invalidateQueries({ queryKey: ['project'] });
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Project>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateProjectInput) => {
      const res = await fetch(`/api/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Project>;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['project', data.id] });
    },
  });
}

export function useCreatePhase(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<CreatePhaseInput, 'project_id'>) => {
      const res = await fetch(`/api/projects/${projectId}/phases`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...input, project_id: projectId }) });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project', projectId] }); qc.invalidateQueries({ queryKey: ['projects'] }); },
  });
}

export function useCreateRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateRoutineInput) => {
      const res = await fetch('/api/routines', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Routine>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routines'] }),
  });
}

export function useUpdateRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateRoutineInput) => {
      const res = await fetch(`/api/routines/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Routine>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routines'] }),
  });
}

export function useGenerateRoutineTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (date?: string) => {
      const res = await fetch('/api/routines/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: date ?? new Date().toISOString().slice(0, 10) }) });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<{ count: number; taskIds: string[] }>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}
