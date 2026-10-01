import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTimeZones } from '@vvo/tzdb';
import { time, timezone } from '../time';

const WINTER = new Date('2025-01-15T12:00:00.000Z');
const SUMMER = new Date('2025-07-15T12:00:00.000Z');

const trackSettled = (promise: Promise<unknown>) => {
  const state = { settled: false, value: undefined as unknown };
  promise.then((value) => {
    state.settled = true;
    state.value = value;
  });
  return state;
};

describe('time.wait', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not resolve before the given number of milliseconds', async () => {
    const state = trackSettled(time.wait(1000));

    await vi.advanceTimersByTimeAsync(999);

    expect(state.settled).toBe(false);
  });

  it('resolves with undefined once the given number of milliseconds passed', async () => {
    const state = trackSettled(time.wait(1000));

    await vi.advanceTimersByTimeAsync(1000);

    expect(state).toEqual({ settled: true, value: undefined });
  });

  it('resolves on the next timer tick for zero milliseconds', async () => {
    const state = trackSettled(time.wait(0));

    await vi.advanceTimersByTimeAsync(0);

    expect(state.settled).toBe(true);
  });
});

describe('timezone.attachOffsetToIso', () => {
  it('replaces a trailing Z with the offset', () => {
    expect(
      timezone.attachOffsetToIso('2025-11-08T20:00:00.000Z', '-09:00')
    ).toBe('2025-11-08T20:00:00.000-09:00');
  });

  it('replaces a lowercase z with the offset', () => {
    expect(timezone.attachOffsetToIso('2025-11-08T20:00:00z', '+01:00')).toBe(
      '2025-11-08T20:00:00+01:00'
    );
  });

  it('appends the offset to a timestamp without one', () => {
    expect(
      timezone.attachOffsetToIso('2025-11-08T20:00:00.000', '-09:00')
    ).toBe('2025-11-08T20:00:00.000-09:00');
  });

  it('replaces an existing colon separated offset', () => {
    expect(
      timezone.attachOffsetToIso('2025-11-08T20:00:00+05:30', '-03:00')
    ).toBe('2025-11-08T20:00:00-03:00');
  });

  it('replaces an existing compact offset', () => {
    expect(
      timezone.attachOffsetToIso('2025-11-08T20:00:00-0800', '+02:00')
    ).toBe('2025-11-08T20:00:00+02:00');
  });

  it('trims surrounding whitespace from the timestamp', () => {
    expect(
      timezone.attachOffsetToIso('  2025-11-08T20:00:00Z \n', '+00:00')
    ).toBe('2025-11-08T20:00:00+00:00');
  });

  it('accepts a compact offset without a colon', () => {
    expect(timezone.attachOffsetToIso('2025-11-08T20:00:00', '+0900')).toBe(
      '2025-11-08T20:00:00+0900'
    );
  });

  it.each(['PST', '+9:00', '09:00', '+09:00:00', ''])(
    'throws for the invalid offset %j',
    (offset) => {
      expect(() =>
        timezone.attachOffsetToIso('2025-11-08T20:00:00', offset)
      ).toThrow(new Error(`Invalid offset format: ${offset}`));
    }
  );
});

describe('timezone.localTime', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(WINTER);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('converts a Los Angeles wall time in winter to UTC', () => {
    expect(
      timezone
        .localTime('2025-11-21T15:00:00', 'America/Los_Angeles')
        .toISOString()
    ).toBe('2025-11-21T23:00:00.000Z');
  });

  it('applies the offset in effect now rather than at the target date', () => {
    vi.setSystemTime(SUMMER);

    expect(
      timezone
        .localTime('2025-11-21T15:00:00', 'America/Los_Angeles')
        .toISOString()
    ).toBe('2025-11-21T22:00:00.000Z');
  });

  it('converts a positive half hour offset', () => {
    expect(
      timezone.localTime('2025-11-21T15:00:00', 'Asia/Kolkata').toISOString()
    ).toBe('2025-11-21T09:30:00.000Z');
  });

  it('ignores an existing Z suffix and treats the time as local', () => {
    expect(
      timezone.localTime('2025-11-21T15:00:00.000Z', 'Asia/Tokyo').toISOString()
    ).toBe('2025-11-21T06:00:00.000Z');
  });

  it('returns an invalid date for an unparseable datetime', () => {
    expect(
      timezone.localTime('not a date', 'America/Los_Angeles').getTime()
    ).toBeNaN();
  });

  it.each(['Mars/Olympus_Mons', 'UTC', 'US/Pacific', ''])(
    'throws for the time zone %j that is not a canonical tzdb name',
    (zone) => {
      expect(() => timezone.localTime('2025-11-21T15:00:00', zone)).toThrow(
        new Error('Invalid timezone')
      );
    }
  );
});

describe('timezone.current', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the resolved time zone of the runtime', () => {
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(function () {
      return { resolvedOptions: () => ({ timeZone: 'Europe/Berlin' }) };
    } as unknown as typeof Intl.DateTimeFormat);

    expect(timezone.current()).toBe('Europe/Berlin');
  });
});

describe('timezone.options', () => {
  let options: typeof timezone.options;

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(WINTER);
    vi.resetModules();
    options = (await import('../time')).timezone.options;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('has one option per known time zone', () => {
    expect(options).toHaveLength(getTimeZones().length);
  });

  it('has unique zones', () => {
    expect(new Set(options.map((o) => o.zone)).size).toBe(options.length);
  });

  it('builds the Los Angeles option from the first main city', () => {
    expect(options.find((o) => o.zone === 'America/Los_Angeles')).toEqual({
      zone: 'America/Los_Angeles',
      label: '(GMT-08:00) Pacific Time (Los Angeles)',
      flag: '\u{1F1FA}\u{1F1F8}',
      city: 'Los Angeles',
      offset: 'GMT-08:00',
      alternativeName: 'Pacific Time'
    });
  });

  it('formats a positive half hour offset', () => {
    expect(options.find((o) => o.zone === 'Asia/Kolkata')).toMatchObject({
      label: '(GMT+05:30) India Time (Mumbai)',
      flag: '\u{1F1EE}\u{1F1F3}',
      offset: 'GMT+05:30'
    });
  });

  it('formats every label as offset, name and city', () => {
    expect(
      options.every((o) => /^\(GMT[+-]\d{2}:\d{2}\) .+ \(.+\)$/.test(o.label))
    ).toBe(true);
  });

  it('uses two regional indicator symbols for every flag', () => {
    expect(
      options.every((o) => /^[\u{1F1E6}-\u{1F1FF}]{2}$/u.test(o.flag))
    ).toBe(true);
  });

  it('is ordered by ascending offset', () => {
    const minutes = options.map((o) => {
      const [, sign, hh, mm] = /GMT([+-])(\d{2}):(\d{2})/.exec(o.offset) ?? [];
      return (sign === '-' ? -1 : 1) * (Number(hh) * 60 + Number(mm));
    });

    expect(minutes).toEqual([...minutes].sort((a, b) => a - b));
  });
});

describe('timezone.options with entries lacking main cities', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doMock('@vvo/tzdb', () => ({
      getTimeZones: () => [
        {
          name: 'America/Port_of_Spain',
          mainCities: undefined,
          currentTimeOffsetInMinutes: -240,
          countryCode: 'tt',
          alternativeName: 'Atlantic Time'
        },
        {
          name: 'Etc/Zero',
          mainCities: [],
          currentTimeOffsetInMinutes: 0,
          countryCode: '',
          alternativeName: 'Zero Time'
        }
      ]
    }));
  });

  afterEach(() => {
    vi.doUnmock('@vvo/tzdb');
    vi.resetModules();
  });

  it('derives the city from the zone name and uppercases the country code', async () => {
    const { timezone: mocked } = await import('../time');

    expect(mocked.options[0]).toEqual({
      zone: 'America/Port_of_Spain',
      label: '(GMT-04:00) Atlantic Time (Port of Spain)',
      flag: '\u{1F1F9}\u{1F1F9}',
      city: 'Port of Spain',
      offset: 'GMT-04:00',
      alternativeName: 'Atlantic Time'
    });
  });

  it('uses a plus sign for a zero offset and an empty flag without a country', async () => {
    const { timezone: mocked } = await import('../time');

    expect(mocked.options[1]).toEqual({
      zone: 'Etc/Zero',
      label: '(GMT+00:00) Zero Time (Zero)',
      flag: '',
      city: 'Zero',
      offset: 'GMT+00:00',
      alternativeName: 'Zero Time'
    });
  });
});
