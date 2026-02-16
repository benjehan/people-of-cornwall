import type { EventBase, EventInstance, RecurrencePattern } from './types';

function getNextOccurrence(current: Date, pattern: RecurrencePattern): Date {
  const next = new Date(current);
  switch (pattern) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'fortnightly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next;
}

/**
 * Expand a single event into all its occurrences within a date range.
 * Non-recurring events return a single-element array.
 */
export function expandEventInstances(
  event: EventBase,
  rangeStart: Date,
  rangeEnd: Date
): EventInstance[] {
  if (!event.recurring || !event.recurrence_pattern) {
    return [{
      ...event,
      original_starts_at: event.starts_at,
      instance_date: event.starts_at.split('T')[0],
      is_recurring_instance: false,
    }];
  }

  const instances: EventInstance[] = [];
  const eventStart = new Date(event.starts_at);
  const eventDuration = event.ends_at
    ? new Date(event.ends_at).getTime() - eventStart.getTime()
    : 0;

  const excludedSet = new Set(
    (event.excluded_dates || []).map(d => new Date(d).toISOString().split('T')[0])
  );

  const recurrenceEnd = event.recurrence_end_date
    ? new Date(event.recurrence_end_date + 'T23:59:59')
    : new Date(rangeEnd.getFullYear() + 1, 11, 31);

  const maxInstances = 365;
  let current = new Date(eventStart);
  let count = 0;

  while (current <= recurrenceEnd && current <= rangeEnd && count < maxInstances) {
    if (current >= rangeStart ||
        (eventDuration > 0 && new Date(current.getTime() + eventDuration) >= rangeStart)) {

      const dateKey = current.toISOString().split('T')[0];

      if (!excludedSet.has(dateKey)) {
        const instanceStart = new Date(current);
        instanceStart.setHours(eventStart.getHours(), eventStart.getMinutes(), eventStart.getSeconds());

        const instanceEnd = eventDuration > 0
          ? new Date(instanceStart.getTime() + eventDuration)
          : null;

        instances.push({
          ...event,
          starts_at: instanceStart.toISOString(),
          ends_at: instanceEnd ? instanceEnd.toISOString() : null,
          original_starts_at: event.starts_at,
          instance_date: dateKey,
          is_recurring_instance: count > 0,
        });
      }
    }

    current = getNextOccurrence(current, event.recurrence_pattern);
    count++;
  }

  return instances;
}

/**
 * Expand all events in an array into their instances for a date range.
 */
export function expandAllEvents(
  events: EventBase[],
  rangeStart: Date,
  rangeEnd: Date
): EventInstance[] {
  return events.flatMap(event => expandEventInstances(event, rangeStart, rangeEnd));
}
