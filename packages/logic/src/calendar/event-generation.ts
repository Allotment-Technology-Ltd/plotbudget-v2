import type { CreateEventInput } from './schemas';

/**
 * Build calendar event payloads from task due dates (for cross-module sync).
 */
export function eventsFromTaskDueDates(
  tasks: { id: string; name: string; due_date: string | null }[]
): CreateEventInput[] {
  const out: CreateEventInput[] = [];
  for (const t of tasks) {
    if (!t.due_date) continue;
    const d = new Date(t.due_date);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0, 0);
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 30, 0);
    out.push({
      title: t.name,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      all_day: false,
      source_module: 'tasks',
      source_entity_id: t.id,
    });
  }
  return out;
}

/**
 * Build calendar event payloads from paycycle paydays (money module).
 */
export function eventsFromPaycyclePaydays(
  paycycles: { id: string; start_date: string; end_date: string; name: string | null }[]
): CreateEventInput[] {
  const out: CreateEventInput[] = [];
  for (const pc of paycycles) {
    const start = new Date(pc.start_date);
    const startAt = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0);
    const endAt = new Date(startAt.getTime() + 24 * 60 * 60 * 1000);
    out.push({
      title: pc.name ? `Payday: ${pc.name}` : 'Payday',
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      all_day: true,
      source_module: 'money',
      source_entity_id: pc.id,
    });
  }
  return out;
}
