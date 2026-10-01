import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import getPublicSweepstakesList from '../get-public-sweepstakes-list';
import { PUBLIC_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import { prismaMock } from '@/test/prisma';
import { signIn } from '@/test/session';
import { nextCacheMock } from '@/test/next-cache';
import { expectFailure, expectOk } from '@/test/result';
import {
  FIXED_NOW,
  buildPublicSweepstakes,
  daysFromFixedNow
} from './fixtures-procedures-browse-marketing-pickers';

type Input = Parameters<typeof getPublicSweepstakesList>[0];

const findManyArgs = () => prismaMock.sweepstakes.findMany.mock.calls[0][0];

const participants = (count: number) =>
  Array.from({ length: count }, (_, index) => `p-${index}`);

describe('getPublicSweepstakesList', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(FIXED_NOW);
    prismaMock.sweepstakes.findMany.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('query shape', () => {
    it('queries active public sweepstakes that are running, recently ended, or starting within a day', async () => {
      await getPublicSweepstakesList(undefined);

      expect(findManyArgs().where).toEqual({
        status: 'ACTIVE',
        visibility: { visibility: 'PUBLIC' },
        OR: [
          {
            timing: {
              startDate: { lte: FIXED_NOW },
              endDate: { gte: daysFromFixedNow(-1) }
            }
          },
          {
            timing: {
              startDate: { gt: FIXED_NOW, lte: daysFromFixedNow(1) }
            }
          }
        ]
      });
    });

    it('includes the public payload plus a participant count', async () => {
      await getPublicSweepstakesList(undefined);

      expect(findManyArgs().include).toEqual({
        ...PUBLIC_SWEEPSTAKES_PAYLOAD,
        _count: { select: { participants: true } }
      });
    });

    it('does not paginate at the database level', async () => {
      await getPublicSweepstakesList({ page: 3 });

      expect(findManyArgs()).not.toHaveProperty('skip');
      expect(findManyArgs()).not.toHaveProperty('take');
    });
  });

  describe('ordering', () => {
    it('orders by participant count descending when no sort is given', async () => {
      await getPublicSweepstakesList(undefined);

      expect(findManyArgs().orderBy).toEqual({
        participants: { _count: 'desc' }
      });
    });

    it('orders by participant count descending for entrants-desc', async () => {
      await getPublicSweepstakesList({ sortBy: 'entrants-desc' });

      expect(findManyArgs().orderBy).toEqual({
        participants: { _count: 'desc' }
      });
    });

    it('orders by participant count ascending for entrants-asc', async () => {
      await getPublicSweepstakesList({ sortBy: 'entrants-asc' });

      expect(findManyArgs().orderBy).toEqual({
        participants: { _count: 'asc' }
      });
    });

    it('orders by end date ascending for ending-soon', async () => {
      await getPublicSweepstakesList({ sortBy: 'ending-soon' });

      expect(findManyArgs().orderBy).toEqual({ timing: { endDate: 'asc' } });
    });

    it('orders by creation date descending for newest', async () => {
      await getPublicSweepstakesList({ sortBy: 'newest' });

      expect(findManyArgs().orderBy).toEqual({ createdAt: 'desc' });
    });
  });

  describe('cache configuration', () => {
    it('uses default key parts when no input is given', async () => {
      await getPublicSweepstakesList(undefined);

      expect(nextCacheMock.unstable_cache).toHaveBeenCalledWith(
        expect.any(Function),
        [
          'public-sweepstakes-list',
          'default',
          'no-min',
          'no-max',
          'no-search',
          '1',
          'all',
          'all-hosts'
        ],
        { tags: ['public-sweepstakes-list'], revalidate: 300 }
      );
    });

    it('builds key parts from every filter, sorting statuses and hosts', async () => {
      await getPublicSweepstakesList({
        sortBy: 'newest',
        minEntrants: 0,
        maxEntrants: 50,
        search: 'Dog',
        page: 2,
        showStatuses: ['SCHEDULED', 'EXPIRED', 'RUNNING'],
        hosts: ['zeta', 'acme']
      });

      expect(nextCacheMock.unstable_cache.mock.calls[0][1]).toEqual([
        'public-sweepstakes-list',
        'newest',
        '0',
        '50',
        'Dog',
        '2',
        'EXPIRED,RUNNING,SCHEDULED',
        'acme,zeta'
      ]);
    });

    it('does not mutate the caller input arrays when sorting key parts', async () => {
      const showStatuses: NonNullable<Input>['showStatuses'] = [
        'SCHEDULED',
        'RUNNING'
      ];

      await getPublicSweepstakesList({ showStatuses });

      expect(showStatuses).toEqual(['SCHEDULED', 'RUNNING']);
    });
  });

  describe('result mapping', () => {
    it('maps a sweepstakes into the public shape', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        buildPublicSweepstakes({
          id: 'sw-1',
          name: 'Great Giveaway',
          description: 'Win something nice',
          banner: 'https://example.com/banner.png',
          slug: 'great-giveaway',
          prizeCount: 2,
          participantIds: ['p-1', 'p-2', 'p-1']
        })
      ]);

      const result = await getPublicSweepstakesList(undefined);

      expect(expectOk(result)).toEqual([
        {
          id: 'sw-1',
          slug: 'great-giveaway',
          name: 'Great Giveaway',
          description: 'Win something nice',
          banner: 'https://example.com/banner.png',
          startDate: daysFromFixedNow(-2),
          endDate: daysFromFixedNow(5),
          status: 'RUNNING',
          host: { id: 'team-1', slug: 'acme', name: 'Acme' },
          prizes: 2,
          participants: 2,
          featured: false
        }
      ]);
    });

    it('omits slug and banner when they are null', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        buildPublicSweepstakes({ slug: null, banner: null })
      ]);

      const result = await getPublicSweepstakesList(undefined);

      const [item] = expectOk(result);
      expect(item.slug).toBeUndefined();
      expect(item.banner).toBeUndefined();
    });

    it('derives a SCHEDULED status for sweepstakes that have not started', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        buildPublicSweepstakes({
          startDate: daysFromFixedNow(0.5),
          endDate: daysFromFixedNow(3)
        })
      ]);

      const result = await getPublicSweepstakesList(undefined);

      expect(expectOk(result)[0].status).toBe('SCHEDULED');
    });

    it('derives an EXPIRED status for sweepstakes that ended recently', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        buildPublicSweepstakes({
          startDate: daysFromFixedNow(-5),
          endDate: daysFromFixedNow(-0.5)
        })
      ]);

      const result = await getPublicSweepstakesList(undefined);

      expect(expectOk(result)[0].status).toBe('EXPIRED');
    });

    it('drops sweepstakes that cannot be converted to the public shape', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        buildPublicSweepstakes({ id: 'no-name', name: null }),
        buildPublicSweepstakes({ id: 'no-team', team: null }),
        buildPublicSweepstakes({ id: 'valid' })
      ]);

      const result = await getPublicSweepstakesList(undefined);

      expect(expectOk(result).map((item) => item.id)).toEqual(['valid']);
    });

    it('keeps the database order', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        buildPublicSweepstakes({ id: 'b' }),
        buildPublicSweepstakes({ id: 'a' }),
        buildPublicSweepstakes({ id: 'c' })
      ]);

      const result = await getPublicSweepstakesList(undefined);

      expect(expectOk(result).map((item) => item.id)).toEqual(['b', 'a', 'c']);
    });
  });

  describe('entrant filters', () => {
    beforeEach(() => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        buildPublicSweepstakes({ id: 'zero', participantIds: [] }),
        buildPublicSweepstakes({ id: 'two', participantIds: participants(2) }),
        buildPublicSweepstakes({ id: 'five', participantIds: participants(5) })
      ]);
    });

    it('keeps sweepstakes with at least minEntrants participants (inclusive)', async () => {
      const result = await getPublicSweepstakesList({ minEntrants: 2 });

      expect(expectOk(result).map((item) => item.id)).toEqual(['two', 'five']);
    });

    it('keeps every sweepstakes when minEntrants is zero', async () => {
      const result = await getPublicSweepstakesList({ minEntrants: 0 });

      expect(expectOk(result)).toHaveLength(3);
    });

    it('keeps sweepstakes with at most maxEntrants participants (inclusive)', async () => {
      const result = await getPublicSweepstakesList({ maxEntrants: 2 });

      expect(expectOk(result).map((item) => item.id)).toEqual(['zero', 'two']);
    });

    it('keeps only sweepstakes with zero participants when maxEntrants is zero', async () => {
      const result = await getPublicSweepstakesList({ maxEntrants: 0 });

      expect(expectOk(result).map((item) => item.id)).toEqual(['zero']);
    });

    it('applies both bounds together', async () => {
      const result = await getPublicSweepstakesList({
        minEntrants: 1,
        maxEntrants: 4
      });

      expect(expectOk(result).map((item) => item.id)).toEqual(['two']);
    });

    it('returns nothing when minEntrants is greater than maxEntrants', async () => {
      const result = await getPublicSweepstakesList({
        minEntrants: 5,
        maxEntrants: 1
      });

      expect(expectOk(result)).toEqual([]);
    });
  });

  describe('search filter', () => {
    beforeEach(() => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        buildPublicSweepstakes({
          id: 'by-name',
          name: 'Puppy Party',
          description: 'Lots of fun'
        }),
        buildPublicSweepstakes({
          id: 'by-description',
          name: 'Summer Bash',
          description: 'Win a PUPPY toy'
        }),
        buildPublicSweepstakes({
          id: 'no-match',
          name: 'Cat Club',
          description: 'Meow'
        })
      ]);
    });

    it('matches the name or description case-insensitively', async () => {
      const result = await getPublicSweepstakesList({ search: 'puppy' });

      expect(expectOk(result).map((item) => item.id)).toEqual([
        'by-name',
        'by-description'
      ]);
    });

    it('ignores an empty search string', async () => {
      const result = await getPublicSweepstakesList({ search: '' });

      expect(expectOk(result)).toHaveLength(3);
    });

    it('does not trim the search term', async () => {
      const result = await getPublicSweepstakesList({ search: ' cat ' });

      expect(expectOk(result)).toEqual([]);
    });
  });

  describe('status filter', () => {
    beforeEach(() => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        buildPublicSweepstakes({ id: 'running' }),
        buildPublicSweepstakes({
          id: 'scheduled',
          startDate: daysFromFixedNow(0.5),
          endDate: daysFromFixedNow(4)
        }),
        buildPublicSweepstakes({
          id: 'expired',
          startDate: daysFromFixedNow(-4),
          endDate: daysFromFixedNow(-0.5)
        })
      ]);
    });

    it('keeps only sweepstakes whose derived status is listed', async () => {
      const result = await getPublicSweepstakesList({
        showStatuses: ['SCHEDULED', 'EXPIRED']
      });

      expect(expectOk(result).map((item) => item.id)).toEqual([
        'scheduled',
        'expired'
      ]);
    });

    it('does not filter when the status list is empty', async () => {
      const result = await getPublicSweepstakesList({ showStatuses: [] });

      expect(expectOk(result)).toHaveLength(3);
    });

    it('returns nothing when only COMPLETED is requested and none are completed', async () => {
      const result = await getPublicSweepstakesList({
        showStatuses: ['COMPLETED']
      });

      expect(expectOk(result)).toEqual([]);
    });
  });

  describe('host filter', () => {
    beforeEach(() => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        buildPublicSweepstakes({
          id: 'acme-1',
          team: { id: 't-1', slug: 'acme', name: 'Acme' }
        }),
        buildPublicSweepstakes({
          id: 'beta-1',
          team: { id: 't-2', slug: 'beta', name: 'Beta' }
        })
      ]);
    });

    it('keeps only sweepstakes hosted by one of the given team slugs', async () => {
      const result = await getPublicSweepstakesList({ hosts: ['beta'] });

      expect(expectOk(result).map((item) => item.id)).toEqual(['beta-1']);
    });

    it('matches on slug rather than team id', async () => {
      const result = await getPublicSweepstakesList({ hosts: ['t-1'] });

      expect(expectOk(result)).toEqual([]);
    });

    it('does not filter when the host list is empty', async () => {
      const result = await getPublicSweepstakesList({ hosts: [] });

      expect(expectOk(result)).toHaveLength(2);
    });
  });

  describe('pagination', () => {
    beforeEach(() => {
      prismaMock.sweepstakes.findMany.mockResolvedValue(
        Array.from({ length: 25 }, (_, index) =>
          buildPublicSweepstakes({ id: `sw-${index}` })
        )
      );
    });

    it('returns the first 20 results when no page is given', async () => {
      const result = await getPublicSweepstakesList(undefined);

      const items = expectOk(result);
      expect(items).toHaveLength(20);
      expect(items[0].id).toBe('sw-0');
      expect(items[19].id).toBe('sw-19');
    });

    it('returns the remaining results on page 2', async () => {
      const result = await getPublicSweepstakesList({ page: 2 });

      expect(expectOk(result).map((item) => item.id)).toEqual([
        'sw-20',
        'sw-21',
        'sw-22',
        'sw-23',
        'sw-24'
      ]);
    });

    it('returns an empty list for a page past the end', async () => {
      const result = await getPublicSweepstakesList({ page: 3 });

      expect(expectOk(result)).toEqual([]);
    });

    it('paginates after filtering', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        ...Array.from({ length: 21 }, (_, index) =>
          buildPublicSweepstakes({ id: `keep-${index}`, name: 'Keep me' })
        ),
        buildPublicSweepstakes({ id: 'drop', name: 'Other' })
      ]);

      const result = await getPublicSweepstakesList({
        page: 2,
        search: 'keep'
      });

      expect(expectOk(result).map((item) => item.id)).toEqual(['keep-20']);
    });
  });

  describe('input validation', () => {
    it.each([
      ['page of zero', { page: 0 }],
      ['fractional page', { page: 1.5 }],
      ['negative minEntrants', { minEntrants: -1 }],
      ['negative maxEntrants', { maxEntrants: -1 }],
      ['unknown sortBy', { sortBy: 'popular' }],
      ['unknown status', { showStatuses: ['DRAFT'] }],
      ['non-string host', { hosts: [1] }]
    ])('rejects a %s', async (_label, input) => {
      const result = await getPublicSweepstakesList(input as unknown as Input);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.sweepstakes.findMany).not.toHaveBeenCalled();
    });

    it('accepts hideEntered without using it to filter', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        buildPublicSweepstakes({ id: 'sw-1' })
      ]);

      const result = await getPublicSweepstakesList({ hideEntered: true });

      expect(expectOk(result)).toHaveLength(1);
    });
  });

  describe('authorization', () => {
    it('serves signed in callers', async () => {
      signIn();
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        buildPublicSweepstakes({ id: 'sw-1' })
      ]);

      const result = await getPublicSweepstakesList(undefined);

      expect(expectOk(result)).toHaveLength(1);
    });
  });

  describe('when the database fails', () => {
    it('returns INTERNAL_SERVER_ERROR with the error message', async () => {
      prismaMock.sweepstakes.findMany.mockRejectedValue(new Error('boom'));

      const result = await getPublicSweepstakesList(undefined);

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'boom'
      );
    });
  });
});
