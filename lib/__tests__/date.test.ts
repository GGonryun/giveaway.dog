import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { date, datetime } from '../date';

const localDate = new Date(2024, 2, 5, 14, 7);

describe('date', () => {
  describe('now', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns the current system time', () => {
      expect(date.now().toISOString()).toBe('2025-01-15T12:00:00.000Z');
    });

    it('returns a new Date instance on every call', () => {
      expect(date.now()).not.toBe(date.now());
    });
  });

  describe('hasExpired', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it.each([
      ['null', null],
      ['undefined', undefined],
      ['an empty string', '']
    ])('returns false for %s', (_label, value) => {
      expect(date.hasExpired(value)).toBe(false);
    });

    it('returns false when called without arguments', () => {
      expect(date.hasExpired()).toBe(false);
    });

    it('returns true for a Date in the past', () => {
      expect(date.hasExpired(new Date('2025-01-15T11:59:59.999Z'))).toBe(true);
    });

    it('returns false for a Date in the future', () => {
      expect(date.hasExpired(new Date('2025-01-15T12:00:00.001Z'))).toBe(false);
    });

    it('returns false for a Date equal to the current time', () => {
      expect(date.hasExpired(new Date('2025-01-15T12:00:00.000Z'))).toBe(false);
    });

    it('parses an ISO string in the past as expired', () => {
      expect(date.hasExpired('2024-12-31T00:00:00.000Z')).toBe(true);
    });

    it('parses an ISO string in the future as not expired', () => {
      expect(date.hasExpired('2026-01-01T00:00:00.000Z')).toBe(false);
    });

    it('returns false for an unparseable string', () => {
      expect(date.hasExpired('not a date')).toBe(false);
    });
  });

  describe('format', () => {
    it('uses the short format by default', () => {
      expect(date.format(localDate)).toBe('Mar 5, 2024');
    });

    it('formats with the short format', () => {
      expect(date.format(localDate, 'short')).toBe('Mar 5, 2024');
    });

    it('formats with the long format', () => {
      expect(date.format(localDate, 'long')).toBe('March 5, 2024');
    });

    it('formats with the dashed format', () => {
      expect(date.format(localDate, 'dashed')).toBe('2024-03-05');
    });

    it('formats with the slashed format', () => {
      expect(date.format(localDate, 'slashed')).toBe('2024/03/05');
    });

    it('accepts a numeric timestamp', () => {
      expect(date.format(localDate.getTime(), 'dashed')).toBe('2024-03-05');
    });

    it('accepts a date string', () => {
      expect(date.format('2024-03-05T14:07:00', 'dashed')).toBe('2024-03-05');
    });

    it('throws a RangeError for an invalid date', () => {
      expect(() => date.format('garbage')).toThrow(
        new RangeError('Invalid time value')
      );
    });

    it('throws for an unsupported format', () => {
      expect(() =>
        date.format(
          localDate,
          'iso' as unknown as Parameters<typeof date.format>[1]
        )
      ).toThrow(new Error('Unexpected value: iso'));
    });
  });
});

describe('datetime', () => {
  describe('format', () => {
    it('uses the short format by default', () => {
      expect(datetime.format(localDate)).toBe('Mar 5, 2024, 02:07 PM');
    });

    it('formats with the tiny format', () => {
      expect(datetime.format(localDate, 'tiny')).toBe('Mar 5, 02:07 PM');
    });

    it('formats with the short format', () => {
      expect(datetime.format(localDate, 'short')).toBe('Mar 5, 2024, 02:07 PM');
    });

    it('formats with the long format', () => {
      expect(datetime.format(localDate, 'long')).toBe('Mar 5, 2024 at 2:07 PM');
    });

    it('renders midnight as 12 AM', () => {
      expect(datetime.format(new Date(2024, 0, 1, 0, 5), 'long')).toBe(
        'Jan 1, 2024 at 12:05 AM'
      );
    });

    it('accepts a numeric timestamp', () => {
      expect(datetime.format(localDate.getTime(), 'tiny')).toBe(
        'Mar 5, 02:07 PM'
      );
    });

    it('throws a RangeError for an invalid date', () => {
      expect(() => datetime.format('garbage', 'tiny')).toThrow(
        new RangeError('Invalid time value')
      );
    });

    it('throws for an unsupported format', () => {
      expect(() =>
        datetime.format(
          localDate,
          'huge' as unknown as Parameters<typeof datetime.format>[1]
        )
      ).toThrow(new Error('Unexpected value: huge'));
    });
  });

  describe('relative helpers', () => {
    const NOW = new Date('2025-01-15T12:00:00.000Z');

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(NOW);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('secondsFromNow adds seconds to the current time', () => {
      expect(datetime.secondsFromNow(30).toISOString()).toBe(
        '2025-01-15T12:00:30.000Z'
      );
    });

    it('secondsFromNow subtracts time for negative input', () => {
      expect(datetime.secondsFromNow(-1).toISOString()).toBe(
        '2025-01-15T11:59:59.000Z'
      );
    });

    it('secondsFromNow with zero returns the current time', () => {
      expect(datetime.secondsFromNow(0).getTime()).toBe(NOW.getTime());
    });

    it('minutesFromNow adds minutes to the current time', () => {
      expect(datetime.minutesFromNow(90).toISOString()).toBe(
        '2025-01-15T13:30:00.000Z'
      );
    });

    it('hoursFromNow adds hours to the current time', () => {
      expect(datetime.hoursFromNow(36).toISOString()).toBe(
        '2025-01-17T00:00:00.000Z'
      );
    });

    it('hoursFromNow supports fractional hours', () => {
      expect(datetime.hoursFromNow(0.5).toISOString()).toBe(
        '2025-01-15T12:30:00.000Z'
      );
    });

    it('daysFromNow adds whole days in milliseconds', () => {
      expect(datetime.daysFromNow(20).toISOString()).toBe(
        '2025-02-04T12:00:00.000Z'
      );
    });

    it('daysAgo subtracts whole days in milliseconds', () => {
      expect(datetime.daysAgo(15).toISOString()).toBe(
        '2024-12-31T12:00:00.000Z'
      );
    });

    it('daysAgo with a negative value moves into the future', () => {
      expect(datetime.daysAgo(-1).toISOString()).toBe(
        '2025-01-16T12:00:00.000Z'
      );
    });
  });

  describe('yearsAgo', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns the same calendar day the given number of years earlier', () => {
      vi.setSystemTime(new Date(2025, 5, 10, 8, 30));

      const result = datetime.yearsAgo(18);

      expect(result.getTime()).toBe(new Date(2007, 5, 10, 8, 30).getTime());
    });

    it('rolls a leap day forward to March 1st in a non leap year', () => {
      vi.setSystemTime(new Date(2024, 1, 29, 9, 0));

      const result = datetime.yearsAgo(1);

      expect(result.getTime()).toBe(new Date(2023, 2, 1, 9, 0).getTime());
    });

    it('returns the current time for zero years', () => {
      vi.setSystemTime(new Date(2025, 0, 1));

      expect(datetime.yearsAgo(0).getTime()).toBe(
        new Date(2025, 0, 1).getTime()
      );
    });
  });

  describe('monthsSince', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(2025, 2, 15));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns zero for a date in the current month', () => {
      expect(datetime.monthsSince(new Date(2025, 2, 1))).toBe(0);
    });

    it('counts months across a year boundary', () => {
      expect(datetime.monthsSince(new Date(2024, 10, 30))).toBe(4);
    });

    it('ignores the day of month when counting', () => {
      expect(datetime.monthsSince(new Date(2025, 1, 28))).toBe(1);
    });

    it('counts whole years as twelve months each', () => {
      expect(datetime.monthsSince(new Date(2023, 2, 15))).toBe(24);
    });

    it('returns a negative number for a future date', () => {
      expect(datetime.monthsSince(new Date(2025, 5, 1))).toBe(-3);
    });
  });

  describe('toTimeZoneDisplay', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it('formats a negative offset with the long standard time name', () => {
      expect(datetime.toTimeZoneDisplay('America/Los_Angeles')).toBe(
        '(GMT-08:00) Pacific Standard Time'
      );
    });

    it('uses the offset in effect at the current time', () => {
      vi.setSystemTime(new Date('2025-07-15T12:00:00.000Z'));

      expect(datetime.toTimeZoneDisplay('America/Los_Angeles')).toBe(
        '(GMT-07:00) Pacific Daylight Time'
      );
    });

    it('formats a positive offset with minutes', () => {
      expect(datetime.toTimeZoneDisplay('Asia/Kolkata')).toBe(
        '(GMT+05:30) India Standard Time'
      );
    });

    it('formats a negative offset with minutes', () => {
      expect(datetime.toTimeZoneDisplay('America/St_Johns')).toBe(
        '(GMT-03:30) Newfoundland Standard Time'
      );
    });

    it('formats a zero offset with a plus sign', () => {
      expect(datetime.toTimeZoneDisplay('UTC')).toBe(
        '(GMT+00:00) Coordinated Universal Time'
      );
    });

    it('returns the input when the time zone is invalid', () => {
      expect(datetime.toTimeZoneDisplay('Mars/Olympus_Mons')).toBe(
        'Mars/Olympus_Mons'
      );
    });

    it('falls back to the short time zone name when no long name is available', () => {
      vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(function (
        _locale: string,
        options: Intl.DateTimeFormatOptions
      ) {
        return {
          formatToParts: () =>
            options.timeZoneName === 'short'
              ? [{ type: 'timeZoneName', value: 'PST' }]
              : [{ type: 'literal', value: ' ' }]
        };
      } as unknown as typeof Intl.DateTimeFormat);

      expect(datetime.toTimeZoneDisplay('America/Los_Angeles')).toBe(
        '(GMT-08:00) PST'
      );
    });

    it('returns the input when neither a long nor short name is available', () => {
      const dtf = vi
        .spyOn(Intl, 'DateTimeFormat')
        .mockImplementation(function () {
          return { formatToParts: () => [{ type: 'literal', value: ' ' }] };
        } as unknown as typeof Intl.DateTimeFormat);

      expect(datetime.toTimeZoneDisplay('America/Los_Angeles')).toBe(
        'America/Los_Angeles'
      );
      expect(dtf).toHaveBeenCalledTimes(2);
    });
  });
});
