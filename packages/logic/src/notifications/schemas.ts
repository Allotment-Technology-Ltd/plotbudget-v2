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

export const createNotificationSchema = z.object({
  title: z.string().min(1).max(500),
  body: z.string().max(2000).optional(),
  source_module: moduleIdSchema,
  source_entity_id: z.string().uuid().optional(),
  action_url: z.string().url().max(2000).optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

export const markNotificationReadSchema = z.object({
  id: z.string().uuid(),
});

export type MarkNotificationReadInput = z.infer<typeof markNotificationReadSchema>;

export const notificationPreferencesSchema = z.record(
  z.string(),
  z.object({
    push: z.boolean().optional(),
  })
);

export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;
