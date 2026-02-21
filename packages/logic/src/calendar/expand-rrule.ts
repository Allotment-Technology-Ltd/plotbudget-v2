import { RRule } from 'rrule';
import { addMinutes, isWithinInterval, parseISO } from 'date-fns';

export interface CalendarEventRow {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  recurrence_rule: string | null;
  source_module: string | null;
  source_entity_id: string | null;
}

export interface ExpandedOccurrence {
  id: string;
  eventId: string;
  title: string;
  description: string | null;
  start: Date;
  end: Date | null;
  all_day: boolean;
  source_module: string | null;
  source_entity_id: string | null;
}

function expandOne(
  event: CalendarEventRow,
  rangeStart: Date,
  rangeEnd: Date
): ExpandedOccurrence[] {
  const startAt = parseISO(event.start_at);
  const endAt = event.end_at ? parseISO(event.end_at) : null;
  const durationMs = endAt ? endAt.getTime() - startAt.getTime() : 0;

  if (!event.recurrence_rule || !event.recurrence_rule.trim()) {
    if (!isWithinInterval(startAt, { start: rangeStart, end: rangeEnd })) return [];
    return [
      {
        id: event.id,
        eventId: event.id,
        title: event.title,
        description: event.description,
        start: startAt,
        end: endAt,
        all_day: event.all_day,
        source_module: event.source_module,
        source_entity_id: event.source_entity_id,
      },
    ];
  }

  try {
    const rrule = RRule.fromString(event.recurrence_rule);
    const dtstart = new Date(
      startAt.getFullYear(),
      startAt.getMonth(),
      startAt.getDate(),
      startAt.getHours(),
      startAt.getMinutes()
    );
    rrule.options.dtstart = dtstart;
    const rule = new RRule(rrule.options);
    const occurrences = rule.between(rangeStart, rangeEnd, true);
    return occurrences.map((occ, i) => {
      const end = durationMs > 0 ? addMinutes(occ, durationMs / 60000) : null;
      return {
        id: `${event.id}-${i}`,
        eventId: event.id,
        title: event.title,
        description: event.description,
        start: occ,
        end,
        all_day: event.all_day,
        source_module: event.source_module,
        source_entity_id: event.source_entity_id,
      };
    });
  } catch {
    return [];
  }
}

export function expandEventIntoOccurrences(
  event: CalendarEventRow,
  rangeStart: Date,
  rangeEnd: Date
): ExpandedOccurrence[] {
  return expandOne(event, rangeStart, rangeEnd);
}

export function expandEvents(
  events: CalendarEventRow[],
  rangeStart: Date,
  rangeEnd: Date
): ExpandedOccurrence[] {
  const result: ExpandedOccurrence[] = [];
  for (const event of events) {
    result.push(...expandOne(event, rangeStart, rangeEnd));
  }
  return result.sort((a, b) => a.start.getTime() - b.start.getTime());
}
