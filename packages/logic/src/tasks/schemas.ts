import { z } from 'zod';
import type { ModuleId } from '../modules/registry';

const moduleIdSchema = z.enum([
  'money',
  'tasks',
  'calendar',
  'meals',
  'holidays',
  'vault',
  'home',
  'kids',
]) as z.ZodType<ModuleId>;

const assignedToSchema = z.enum(['me', 'partner', 'both', 'unassigned']);
const taskStatusSchema = z.enum(['backlog', 'todo', 'in_progress', 'done', 'skipped']);
const prioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);
const effortLevelSchema = z.enum(['quick', 'medium', 'involved']);

export const createTaskSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  assigned_to: assignedToSchema.optional(),
  status: taskStatusSchema.optional(),
  priority: prioritySchema.optional(),
  due_date: z.string().optional(),
  project_id: z.string().uuid().optional(),
  phase_id: z.string().uuid().optional(),
  routine_id: z.string().uuid().optional(),
  effort_level: effortLevelSchema.optional(),
  linked_module: moduleIdSchema.optional(),
  linked_entity_id: z.string().uuid().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  assigned_to: assignedToSchema.optional(),
  status: taskStatusSchema.optional(),
  priority: prioritySchema.optional(),
  due_date: z.string().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  phase_id: z.string().uuid().optional().nullable(),
  routine_id: z.string().uuid().optional().nullable(),
  effort_level: effortLevelSchema.optional(),
  kanban_order: z.number().int().optional(),
  linked_module: z.string().optional().nullable(),
  linked_entity_id: z.string().uuid().optional().nullable(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

const projectStatusSchema = z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']);

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  start_date: z.string().optional().nullable(),
  target_end_date: z.string().optional().nullable(),
  linked_pot_id: z.string().uuid().optional(),
  linked_repayment_id: z.string().uuid().optional(),
  estimated_budget: z.number().positive().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  status: projectStatusSchema.optional(),
  start_date: z.string().optional().nullable(),
  target_end_date: z.string().optional().nullable(),
  linked_pot_id: z.string().uuid().optional().nullable(),
  linked_repayment_id: z.string().uuid().optional().nullable(),
  estimated_budget: z.number().positive().optional().nullable(),
  actual_spend: z.number().optional(),
  sort_order: z.number().int().optional(),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

const phaseStatusSchema = z.enum(['pending', 'active', 'completed']);

export const createPhaseSchema = z.object({
  project_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  sort_order: z.number().int().optional(),
  status: phaseStatusSchema.optional(),
});

export type CreatePhaseInput = z.infer<typeof createPhaseSchema>;

const frequencySchema = z.enum(['daily', 'weekly', 'fortnightly', 'monthly']);
const assignmentModeSchema = z.enum(['fixed_me', 'fixed_partner', 'alternating', 'unassigned']);

export const createRoutineSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  frequency: frequencySchema.optional(),
  day_of_week: z.number().int().min(0).max(6).optional().nullable(),
  assignment_mode: assignmentModeSchema.optional(),
  effort_level: effortLevelSchema.optional(),
  category: z.string().max(100).optional(),
});

export type CreateRoutineInput = z.infer<typeof createRoutineSchema>;

export const updateRoutineSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  frequency: frequencySchema.optional(),
  day_of_week: z.number().int().min(0).max(6).optional().nullable(),
  assignment_mode: assignmentModeSchema.optional(),
  effort_level: effortLevelSchema.optional(),
  category: z.string().max(100).optional().nullable(),
  is_active: z.boolean().optional(),
});

export type UpdateRoutineInput = z.infer<typeof updateRoutineSchema>;
