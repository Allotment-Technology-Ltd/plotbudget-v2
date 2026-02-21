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

export const createEventSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  start_at: z.string(), // ISO datetime
  end_at: z.string().optional().nullable(),
  all_day: z.boolean().optional(),
  recurrence_rule: z.string().max(500).optional().nullable(),
  source_module: moduleIdSchema.optional().nullable(),
  source_entity_id: z.string().uuid().optional().nullable(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional().nullable(),
  start_at: z.string().optional(),
  end_at: z.string().optional().nullable(),
  all_day: z.boolean().optional(),
  recurrence_rule: z.string().max(500).optional().nullable(),
  source_module: moduleIdSchema.optional().nullable(),
  source_entity_id: z.string().uuid().optional().nullable(),
});

export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export const eventRangeSchema = z.object({
  start: z.string(), // ISO date
  end: z.string(),   // ISO date
});

export type EventRangeInput = z.infer<typeof eventRangeSchema>;
