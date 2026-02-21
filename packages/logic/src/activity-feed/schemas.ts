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

export const createActivitySchema = z.object({
  actor_type: z.enum(['user', 'partner', 'system']),
  action: z.string().min(1).max(500),
  object_name: z.string().min(1).max(500),
  object_detail: z.string().max(2000).optional(),
  source_module: moduleIdSchema,
  source_entity_id: z.string().uuid().optional(),
  action_url: z.string().url().max(2000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
