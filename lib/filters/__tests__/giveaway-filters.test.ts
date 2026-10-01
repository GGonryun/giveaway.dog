import { describe, it, expect } from 'vitest';
import {
  browseStatusSchema,
  BROWSE_STATUS_LABELS,
  ALL_BROWSE_STATUSES,
  giveawayFiltersSchema,
  defaultFilters,
  PAGE_SIZE
} from '../giveaway-filters';

describe('browseStatusSchema', () => {
  it.each(['RUNNING', 'SCHEDULED', 'EXPIRED', 'COMPLETED'])(
    'accepts %s',
    (status) => {
      expect(browseStatusSchema.parse(status)).toBe(status);
    }
  );

  it.each(['running', 'DRAFT', '', null])('rejects %s', (status) => {
    expect(browseStatusSchema.safeParse(status).success).toBe(false);
  });
});

describe('BROWSE_STATUS_LABELS', () => {
  it('maps each status to a human readable label', () => {
    expect(BROWSE_STATUS_LABELS).toEqual({
      RUNNING: 'Running',
      SCHEDULED: 'Scheduled',
      EXPIRED: 'Expired',
      COMPLETED: 'Completed'
    });
  });
});

describe('ALL_BROWSE_STATUSES', () => {
  it('lists every status in schema order', () => {
    expect(ALL_BROWSE_STATUSES).toEqual(browseStatusSchema.options);
  });
});

describe('giveawayFiltersSchema', () => {
  it('accepts an empty object', () => {
    expect(giveawayFiltersSchema.parse({})).toEqual({});
  });

  it('accepts a fully populated filter object', () => {
    const filters = {
      minEntrants: 0,
      maxEntrants: 100,
      sortBy: 'ending-soon',
      search: 'dog',
      page: 3,
      showStatuses: ['RUNNING', 'EXPIRED'],
      hideEntered: true,
      hosts: ['host-1', 'host-2']
    };

    expect(giveawayFiltersSchema.parse(filters)).toEqual(filters);
  });

  it('strips unknown keys', () => {
    expect(giveawayFiltersSchema.parse({ page: 1, extra: 'x' })).toEqual({
      page: 1
    });
  });

  it.each(['entrants-desc', 'entrants-asc', 'ending-soon', 'newest'])(
    'accepts sortBy %s',
    (sortBy) => {
      expect(giveawayFiltersSchema.parse({ sortBy })).toEqual({ sortBy });
    }
  );

  it.each([
    ['a negative minEntrants', { minEntrants: -1 }],
    ['a fractional minEntrants', { minEntrants: 1.5 }],
    ['a string minEntrants', { minEntrants: '5' }],
    ['a negative maxEntrants', { maxEntrants: -1 }],
    ['a fractional maxEntrants', { maxEntrants: 2.2 }],
    ['an unknown sortBy', { sortBy: 'oldest' }],
    ['a non string search', { search: 5 }],
    ['a zero page', { page: 0 }],
    ['a fractional page', { page: 1.5 }],
    ['a string page', { page: '2' }],
    ['an unknown status', { showStatuses: ['DRAFT'] }],
    ['a non array showStatuses', { showStatuses: 'RUNNING' }],
    ['a string hideEntered', { hideEntered: 'true' }],
    ['a non string host', { hosts: [1] }]
  ])('rejects %s', (_label, input) => {
    expect(giveawayFiltersSchema.safeParse(input).success).toBe(false);
  });

  it('does not enforce minEntrants to be at most maxEntrants', () => {
    expect(
      giveawayFiltersSchema.safeParse({ minEntrants: 10, maxEntrants: 1 })
        .success
    ).toBe(true);
  });

  it('accepts empty arrays for statuses and hosts', () => {
    expect(
      giveawayFiltersSchema.parse({ showStatuses: [], hosts: [] })
    ).toEqual({ showStatuses: [], hosts: [] });
  });
});

describe('defaultFilters', () => {
  it('sorts by entrants descending on the first page', () => {
    expect(defaultFilters).toEqual({ sortBy: 'entrants-desc', page: 1 });
  });

  it('is valid according to the filter schema', () => {
    expect(giveawayFiltersSchema.safeParse(defaultFilters).success).toBe(true);
  });
});

describe('PAGE_SIZE', () => {
  it('is 20', () => {
    expect(PAGE_SIZE).toBe(20);
  });
});
