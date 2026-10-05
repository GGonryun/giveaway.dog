import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SweepstakesStatus, SweepstakesTiming } from '@giveaway/db-model';
import {
  expectedSweepstakesStatusSchema,
  derivedSweepstakesStatusSchema,
  SWEEPSTAKE_TIMING_INCLUDE_QUERY,
  toDerivedSweepstakeStatus,
  DERIVED_TO_ACTUAL_STATUS_MAP,
  EDITABLE_DERIVED_STATUS,
  sweepstakesDataSchema,
  listSweepstakesDataSchema,
  sweepstakesFilterStatusSchema,
  SWEEPSTAKES_FILTER_STATUS_OPTIONS,
  sortFieldSchema,
  sortDirectionSchema,
  listSweepstakesFiltersSchema,
  toSweepstakesFilter,
  sweepstakesTabSchema,
  DEFAULT_SWEEPSTAKES_DETAILS_TAB,
  SWEEPSTAKES_TAB_OPTIONS,
  isSweepstakesTab,
  SWEEPSTAKES_STATUS_LABEL,
  getSweepstakesTimingDescription
} from '../sweepstakes';

const NOW = new Date('2026-06-15T12:00:00.000Z');
const PAST = new Date('2026-06-01T00:00:00.000Z');
const FUTURE = new Date('2026-07-01T00:00:00.000Z');

const timing = (
  startDate: Date | null,
  endDate: Date | null
): SweepstakesTiming => ({
  id: 'timing-1',
  sweepstakesId: 'sweep-1',
  startDate,
  endDate,
  timeZone: 'UTC'
});

const derive = (status: SweepstakesStatus, t: SweepstakesTiming | null) =>
  toDerivedSweepstakeStatus({ status, timing: t });

const sweepstakesData = {
  id: 'sweep-1',
  name: 'Summer Giveaway',
  status: 'RUNNING',
  entries: 10,
  participants: 4,
  timeLeft: '2 days',
  createdAt: '2026-06-01'
};

describe('expectedSweepstakesStatusSchema', () => {
  it.each(['DRAFT', 'COMPLETED', 'RUNNING', 'SCHEDULED', 'EXPIRED'])(
    'accepts %s',
    (status) => {
      expect(expectedSweepstakesStatusSchema.parse(status)).toBe(status);
    }
  );

  it.each(['ERROR', 'ACTIVE', 'ALL'])('rejects %s', (status) => {
    expect(expectedSweepstakesStatusSchema.safeParse(status).success).toBe(
      false
    );
  });
});

describe('derivedSweepstakesStatusSchema', () => {
  it('additionally accepts ERROR', () => {
    expect(derivedSweepstakesStatusSchema.parse('ERROR')).toBe('ERROR');
  });

  it('still rejects the raw ACTIVE status', () => {
    expect(derivedSweepstakesStatusSchema.safeParse('ACTIVE').success).toBe(
      false
    );
  });
});

describe('SWEEPSTAKE_TIMING_INCLUDE_QUERY', () => {
  it('includes the timing relation', () => {
    expect(SWEEPSTAKE_TIMING_INCLUDE_QUERY).toEqual({ timing: true });
  });
});

describe('toDerivedSweepstakeStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('drafts', () => {
    it('returns DRAFT for a draft with timing', () => {
      expect(derive('DRAFT', timing(PAST, FUTURE))).toBe('DRAFT');
    });

    it('returns DRAFT for an active sweepstakes without timing', () => {
      expect(derive('ACTIVE', null)).toBe('DRAFT');
    });

    it('returns DRAFT for a completed sweepstakes without timing', () => {
      expect(derive('COMPLETED', null)).toBe('DRAFT');
    });
  });

  describe('completed', () => {
    it('returns COMPLETED regardless of the dates', () => {
      expect(derive('COMPLETED', timing(FUTURE, null))).toBe('COMPLETED');
    });
  });

  describe('active sweepstakes', () => {
    it('returns SCHEDULED when the start date is in the future', () => {
      expect(derive('ACTIVE', timing(FUTURE, FUTURE))).toBe('SCHEDULED');
    });

    it('returns SCHEDULED for a future start even if the end date has passed', () => {
      expect(derive('ACTIVE', timing(FUTURE, PAST))).toBe('SCHEDULED');
    });

    it('returns RUNNING when started and the end date is in the future', () => {
      expect(derive('ACTIVE', timing(PAST, FUTURE))).toBe('RUNNING');
    });

    it('returns RUNNING when the start date is exactly now', () => {
      expect(derive('ACTIVE', timing(NOW, FUTURE))).toBe('RUNNING');
    });

    it('returns RUNNING when there is no start date and the end is in the future', () => {
      expect(derive('ACTIVE', timing(null, FUTURE))).toBe('RUNNING');
    });

    it('returns RUNNING when the end date is exactly now', () => {
      expect(derive('ACTIVE', timing(PAST, NOW))).toBe('RUNNING');
    });

    it('returns EXPIRED when the end date has passed', () => {
      expect(
        derive('ACTIVE', timing(PAST, new Date('2026-06-15T11:59:59.999Z')))
      ).toBe('EXPIRED');
    });

    it('returns ERROR when there is no end date', () => {
      expect(derive('ACTIVE', timing(PAST, null))).toBe('ERROR');
    });

    it('returns ERROR when there are no dates at all', () => {
      expect(derive('ACTIVE', timing(null, null))).toBe('ERROR');
    });
  });
});

describe('DERIVED_TO_ACTUAL_STATUS_MAP', () => {
  it('maps every derived status back to a stored status', () => {
    expect(DERIVED_TO_ACTUAL_STATUS_MAP).toEqual({
      DRAFT: 'DRAFT',
      COMPLETED: 'COMPLETED',
      RUNNING: 'ACTIVE',
      SCHEDULED: 'ACTIVE',
      EXPIRED: 'ACTIVE',
      ERROR: 'ACTIVE'
    });
  });
});

describe('EDITABLE_DERIVED_STATUS', () => {
  it('only locks completed sweepstakes', () => {
    expect(EDITABLE_DERIVED_STATUS).toEqual({
      DRAFT: true,
      COMPLETED: false,
      RUNNING: true,
      SCHEDULED: true,
      EXPIRED: true,
      ERROR: true
    });
  });
});

describe('sweepstakesDataSchema', () => {
  it('accepts a row without endsAt', () => {
    expect(sweepstakesDataSchema.parse(sweepstakesData)).toEqual(
      sweepstakesData
    );
  });

  it.each([null, '2026-07-01'])('accepts an endsAt of %j', (endsAt) => {
    expect(
      sweepstakesDataSchema.parse({ ...sweepstakesData, endsAt }).endsAt
    ).toBe(endsAt);
  });

  it('rejects a raw ACTIVE status', () => {
    expect(
      sweepstakesDataSchema.safeParse({ ...sweepstakesData, status: 'ACTIVE' })
        .success
    ).toBe(false);
  });

  it('rejects a Date createdAt', () => {
    expect(
      sweepstakesDataSchema.safeParse({
        ...sweepstakesData,
        createdAt: new Date()
      }).success
    ).toBe(false);
  });
});

describe('listSweepstakesDataSchema', () => {
  it('accepts a page of sweepstakes', () => {
    const page = {
      sweepstakes: [sweepstakesData],
      totalCount: 1,
      currentPage: 1,
      totalPages: 1
    };

    expect(listSweepstakesDataSchema.parse(page)).toEqual(page);
  });

  it('rejects a page missing totalPages', () => {
    expect(
      listSweepstakesDataSchema.safeParse({
        sweepstakes: [],
        totalCount: 0,
        currentPage: 1
      }).success
    ).toBe(false);
  });
});

describe('sweepstakesFilterStatusSchema', () => {
  it('accepts ALL in addition to the expected statuses', () => {
    expect(sweepstakesFilterStatusSchema.parse('ALL')).toBe('ALL');
    expect(sweepstakesFilterStatusSchema.parse('EXPIRED')).toBe('EXPIRED');
  });

  it('rejects ERROR', () => {
    expect(sweepstakesFilterStatusSchema.safeParse('ERROR').success).toBe(
      false
    );
  });
});

describe('SWEEPSTAKES_FILTER_STATUS_OPTIONS', () => {
  it('labels every filter status, showing RUNNING as Active', () => {
    expect(SWEEPSTAKES_FILTER_STATUS_OPTIONS).toEqual({
      ALL: 'All',
      RUNNING: 'Active',
      SCHEDULED: 'Scheduled',
      EXPIRED: 'Expired',
      DRAFT: 'Draft',
      COMPLETED: 'Completed'
    });
  });
});

describe('sort schemas', () => {
  it.each(['name', 'createdAt'])('accepts the sort field %s', (field) => {
    expect(sortFieldSchema.parse(field)).toBe(field);
  });

  it('rejects other sort fields', () => {
    expect(sortFieldSchema.safeParse('updatedAt').success).toBe(false);
  });

  it.each(['asc', 'desc'])('accepts the sort direction %s', (direction) => {
    expect(sortDirectionSchema.parse(direction)).toBe(direction);
  });

  it('rejects uppercase sort directions', () => {
    expect(sortDirectionSchema.safeParse('ASC').success).toBe(false);
  });
});

describe('listSweepstakesFiltersSchema', () => {
  it('accepts an empty object because every field is optional', () => {
    expect(listSweepstakesFiltersSchema.parse({})).toEqual({});
  });

  it('accepts a full filter', () => {
    const filters = {
      search: 'dog',
      status: 'ALL',
      dateRange: '7d',
      page: 2,
      sortField: 'name',
      sortDirection: 'asc'
    };

    expect(listSweepstakesFiltersSchema.parse(filters)).toEqual(filters);
  });

  it('does not coerce a string page', () => {
    expect(listSweepstakesFiltersSchema.safeParse({ page: '2' }).success).toBe(
      false
    );
  });
});

describe('toSweepstakesFilter', () => {
  it('fills every default for an empty object', () => {
    expect(toSweepstakesFilter({})).toEqual({
      search: '',
      status: 'ALL',
      dateRange: '',
      page: 1,
      sortField: 'createdAt',
      sortDirection: 'desc'
    });
  });

  it('uses the provided values and parses the page number', () => {
    expect(
      toSweepstakesFilter({
        search: 'cats',
        status: 'RUNNING',
        dateRange: '30d',
        page: '4',
        sortField: 'name',
        sortDirection: 'asc'
      })
    ).toEqual({
      search: 'cats',
      status: 'RUNNING',
      dateRange: '30d',
      page: 4,
      sortField: 'name',
      sortDirection: 'asc'
    });
  });

  it('treats empty strings as missing', () => {
    expect(
      toSweepstakesFilter({
        search: '',
        status: '',
        dateRange: '',
        page: '',
        sortField: '',
        sortDirection: ''
      })
    ).toEqual({
      search: '',
      status: 'ALL',
      dateRange: '',
      page: 1,
      sortField: 'createdAt',
      sortDirection: 'desc'
    });
  });

  it('truncates a fractional page', () => {
    expect(toSweepstakesFilter({ page: '2.9' }).page).toBe(2);
  });

  it("keeps a page of '0' as 0", () => {
    expect(toSweepstakesFilter({ page: '0' }).page).toBe(0);
  });

  it('returns NaN for a non-numeric page', () => {
    expect(toSweepstakesFilter({ page: 'last' }).page).toBeNaN();
  });

  it('passes through unvalidated status and sort values', () => {
    expect(
      toSweepstakesFilter({
        status: 'BOGUS',
        sortField: 'updatedAt',
        sortDirection: 'sideways'
      })
    ).toMatchObject({
      status: 'BOGUS',
      sortField: 'updatedAt',
      sortDirection: 'sideways'
    });
  });

  it('throws when given null', () => {
    expect(() => toSweepstakesFilter(null)).toThrow(TypeError);
  });
});

describe('sweepstakesTabSchema', () => {
  const tabs = [
    'preview',
    'analytics',
    'promotion',
    'entries',
    'participants',
    'winners'
  ];

  it.each(tabs)('accepts the %s tab', (tab) => {
    expect(sweepstakesTabSchema.parse(tab)).toBe(tab);
  });

  it('rejects an unknown tab', () => {
    expect(sweepstakesTabSchema.safeParse('settings').success).toBe(false);
  });

  it('has a label for every tab', () => {
    expect(SWEEPSTAKES_TAB_OPTIONS).toEqual({
      preview: 'Preview',
      analytics: 'Analytics',
      promotion: 'Promotion',
      entries: 'Entries',
      participants: 'Participants',
      winners: 'Winners'
    });
    expect(Object.keys(SWEEPSTAKES_TAB_OPTIONS)).toEqual(tabs);
  });
});

describe('isSweepstakesTab', () => {
  it('returns true for a known tab', () => {
    expect(isSweepstakesTab('winners')).toBe(true);
  });

  it('returns false for an unknown tab', () => {
    expect(isSweepstakesTab('Winners')).toBe(false);
  });
});

describe('DEFAULT_SWEEPSTAKES_DETAILS_TAB', () => {
  it('defaults sweepstakes details to the preview tab', () => {
    expect(DEFAULT_SWEEPSTAKES_DETAILS_TAB).toBe('preview');
    expect(isSweepstakesTab(DEFAULT_SWEEPSTAKES_DETAILS_TAB)).toBe(true);
  });
});

describe('SWEEPSTAKES_STATUS_LABEL', () => {
  it('labels every derived status', () => {
    expect(SWEEPSTAKES_STATUS_LABEL).toEqual({
      DRAFT: 'Draft',
      COMPLETED: 'Completed',
      RUNNING: 'Running',
      SCHEDULED: 'Scheduled',
      EXPIRED: 'Expired',
      ERROR: 'Error'
    });
  });
});

describe('getSweepstakesTimingDescription', () => {
  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;
  const fromNow = (ms: number) => new Date(NOW.getTime() + ms);

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    [{ status: null, startDate: NOW, endDate: NOW }],
    [{ status: 'DRAFT' as const, startDate: NOW, endDate: NOW }],
    [{ status: 'RUNNING' as const, startDate: null, endDate: NOW }],
    [{ status: 'RUNNING' as const, startDate: NOW, endDate: undefined }]
  ])('returns Not started for %o', (args) => {
    expect(getSweepstakesTimingDescription(args)).toBe('Not started');
  });

  it('describes how long ago a giveaway finished', () => {
    expect(
      getSweepstakesTimingDescription({
        status: 'EXPIRED',
        startDate: fromNow(-10 * DAY),
        endDate: fromNow(-2 * DAY)
      })
    ).toBe('Finished 2 days ago');
  });

  it('describes when a scheduled giveaway starts', () => {
    expect(
      getSweepstakesTimingDescription({
        status: 'SCHEDULED',
        startDate: fromNow(3 * DAY),
        endDate: fromNow(10 * DAY)
      })
    ).toBe('Starts in 3 days');
  });

  it('describes when a running giveaway ends', () => {
    expect(
      getSweepstakesTimingDescription({
        status: 'RUNNING',
        startDate: fromNow(-DAY),
        endDate: fromNow(7 * DAY)
      })
    ).toBe('Ends in 7 days');
  });

  it('uses an approximate distance for the end of a running giveaway', () => {
    expect(
      getSweepstakesTimingDescription({
        status: 'RUNNING',
        startDate: fromNow(-DAY),
        endDate: fromNow(90 * 60 * 1000)
      })
    ).toBe('Ends in about 2 hours');
  });
});
