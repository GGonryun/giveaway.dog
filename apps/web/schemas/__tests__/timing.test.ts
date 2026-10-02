import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { timingSchema } from '../timing';

const NOW = new Date('2026-06-15T12:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

const at = (offsetMs: number) => new Date(NOW.getTime() + offsetMs);

const issuesFor = (
  schema: ReturnType<typeof timingSchema>,
  input: Record<string, unknown>
) => {
  const result = schema.safeParse(input);
  return result.success
    ? []
    : result.error.issues.map((issue) => ({
        message: issue.message,
        path: issue.path
      }));
};

describe('timingSchema', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('without validation', () => {
    const schema = timingSchema({ validate: false, maxDurationDays: 30 });

    it('coerces ISO strings into dates', () => {
      expect(
        schema.parse({
          startDate: '2026-06-01T00:00:00.000Z',
          endDate: '2026-06-02T00:00:00.000Z',
          timeZone: 'America/Toronto'
        })
      ).toEqual({
        startDate: new Date('2026-06-01T00:00:00.000Z'),
        endDate: new Date('2026-06-02T00:00:00.000Z'),
        timeZone: 'America/Toronto'
      });
    });

    it('accepts an end date in the past', () => {
      expect(
        issuesFor(schema, {
          startDate: at(-10 * DAY_MS),
          endDate: at(-5 * DAY_MS),
          timeZone: 'UTC'
        })
      ).toEqual([]);
    });

    it('accepts an end date before the start date', () => {
      expect(
        issuesFor(schema, {
          startDate: at(5 * DAY_MS),
          endDate: at(DAY_MS),
          timeZone: 'UTC'
        })
      ).toEqual([]);
    });

    it('accepts a duration longer than the maximum', () => {
      expect(
        issuesFor(schema, {
          startDate: NOW,
          endDate: at(400 * DAY_MS),
          timeZone: 'UTC'
        })
      ).toEqual([]);
    });

    it('rejects an unparseable date', () => {
      expect(
        issuesFor(schema, {
          startDate: 'tomorrow',
          endDate: at(DAY_MS),
          timeZone: 'UTC'
        })
      ).toEqual([{ message: 'Invalid date', path: ['startDate'] }]);
    });

    it('requires a time zone', () => {
      expect(
        issuesFor(schema, { startDate: NOW, endDate: at(DAY_MS) })
      ).toEqual([{ message: 'Required', path: ['timeZone'] }]);
    });
  });

  describe('with validation', () => {
    const schema = timingSchema({ validate: true, maxDurationDays: 30 });

    it('accepts a future end date within the maximum duration', () => {
      expect(
        schema.parse({
          startDate: NOW.toISOString(),
          endDate: at(10 * DAY_MS).toISOString(),
          timeZone: 'UTC'
        })
      ).toEqual({ startDate: NOW, endDate: at(10 * DAY_MS), timeZone: 'UTC' });
    });

    it('accepts a start date in the past', () => {
      expect(
        issuesFor(schema, {
          startDate: at(-5 * DAY_MS),
          endDate: at(5 * DAY_MS),
          timeZone: 'UTC'
        })
      ).toEqual([]);
    });

    it('rejects an end date in the past', () => {
      expect(
        issuesFor(schema, {
          startDate: at(-10 * DAY_MS),
          endDate: at(-1),
          timeZone: 'UTC'
        })
      ).toEqual([
        { message: 'End date must be in the future', path: ['endDate'] }
      ]);
    });

    it('rejects an end date of exactly now', () => {
      expect(
        issuesFor(schema, {
          startDate: at(-DAY_MS),
          endDate: NOW,
          timeZone: 'UTC'
        })
      ).toEqual([
        { message: 'End date must be in the future', path: ['endDate'] }
      ]);
    });

    it('rejects an end date before the start date', () => {
      expect(
        issuesFor(schema, {
          startDate: at(5 * DAY_MS),
          endDate: at(2 * DAY_MS),
          timeZone: 'UTC'
        })
      ).toEqual([
        { message: 'End date must be after start date', path: ['endDate'] }
      ]);
    });

    it('rejects an end date equal to the start date', () => {
      expect(
        issuesFor(schema, {
          startDate: at(DAY_MS),
          endDate: at(DAY_MS),
          timeZone: 'UTC'
        })
      ).toEqual([
        { message: 'End date must be after start date', path: ['endDate'] }
      ]);
    });

    it('accepts a duration of exactly the maximum', () => {
      expect(
        issuesFor(schema, {
          startDate: NOW,
          endDate: at(30 * DAY_MS),
          timeZone: 'UTC'
        })
      ).toEqual([]);
    });

    it('rejects a duration one millisecond over the maximum', () => {
      expect(
        issuesFor(schema, {
          startDate: NOW,
          endDate: at(30 * DAY_MS + 1),
          timeZone: 'UTC'
        })
      ).toEqual([
        { message: 'Duration cannot exceed 30 days', path: ['endDate'] }
      ]);
    });

    it('uses the configured maximum in the duration message', () => {
      const weekLimit = timingSchema({ validate: true, maxDurationDays: 7 });

      expect(
        issuesFor(weekLimit, {
          startDate: NOW,
          endDate: at(8 * DAY_MS),
          timeZone: 'UTC'
        })
      ).toEqual([
        { message: 'Duration cannot exceed 7 days', path: ['endDate'] }
      ]);
    });

    it('reports both the past and ordering errors together', () => {
      expect(
        issuesFor(schema, {
          startDate: at(-DAY_MS),
          endDate: at(-2 * DAY_MS),
          timeZone: 'UTC'
        })
      ).toEqual([
        { message: 'End date must be in the future', path: ['endDate'] },
        { message: 'End date must be after start date', path: ['endDate'] }
      ]);
    });

    it('reports the past and duration errors together', () => {
      expect(
        issuesFor(schema, {
          startDate: at(-100 * DAY_MS),
          endDate: at(-DAY_MS),
          timeZone: 'UTC'
        })
      ).toEqual([
        { message: 'End date must be in the future', path: ['endDate'] },
        { message: 'Duration cannot exceed 30 days', path: ['endDate'] }
      ]);
    });

    it('skips the cross-field checks when a field is missing', () => {
      expect(
        issuesFor(schema, {
          startDate: at(5 * DAY_MS),
          endDate: at(2 * DAY_MS)
        })
      ).toEqual([{ message: 'Required', path: ['timeZone'] }]);
    });
  });
});
