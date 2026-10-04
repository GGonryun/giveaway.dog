import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import getHistoricalSweepstakesList from '../get-historical-sweepstakes-list';
import { PUBLIC_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn } from '@giveaway/testing-server/session';
import { nextCacheMock } from '@giveaway/testing-server/next-cache';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import {
  FIXED_NOW,
  buildPublicSweepstakes,
  daysFromFixedNow
} from '@giveaway/testing-server/fixtures-procedures-browse-marketing-pickers';

type Input = Parameters<typeof getHistoricalSweepstakesList>[0];

const findManyArgs = () => prismaMock.sweepstakes.findMany.mock.calls[0][0];

const participants = (count: number) =>
  Array.from({ length: count }, (_, index) => `p-${index}`);

const ended = (options: Parameters<typeof buildPublicSweepstakes>[0] = {}) =>
  buildPublicSweepstakes({
    startDate: daysFromFixedNow(-30),
    endDate: daysFromFixedNow(-10),
    ...options
  });

describe('getHistoricalSweepstakesList', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(FIXED_NOW);
    prismaMock.sweepstakes.findMany.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('query shape', () => {
    it('queries public sweepstakes that ended more than a day ago, regardless of status', async () => {
      await getHistoricalSweepstakesList(undefined);

      expect(findManyArgs().where).toEqual({
        visibility: { visibility: 'PUBLIC' },
        timing: { endDate: { lt: daysFromFixedNow(-1) } }
      });
    });

    it('includes the public payload plus a participant count', async () => {
      await getHistoricalSweepstakesList(undefined);

      expect(findManyArgs().include).toEqual({
        ...PUBLIC_SWEEPSTAKES_PAYLOAD,
        _count: { select: { participants: true } }
      });
    });

    it('fetches the first page of 20 when no page is given', async () => {
      await getHistoricalSweepstakesList(undefined);

      expect(findManyArgs()).toMatchObject({ skip: 0, take: 20 });
    });

    it('skips previous pages at the database level', async () => {
      await getHistoricalSweepstakesList({ page: 3 });

      expect(findManyArgs()).toMatchObject({ skip: 40, take: 20 });
    });
  });

  describe('ordering', () => {
    it('orders by end date descending when no sort is given', async () => {
      await getHistoricalSweepstakesList(undefined);

      expect(findManyArgs().orderBy).toEqual({ timing: { endDate: 'desc' } });
    });

    it('orders by participant count descending for entrants-desc', async () => {
      await getHistoricalSweepstakesList({ sortBy: 'entrants-desc' });

      expect(findManyArgs().orderBy).toEqual({
        participants: { _count: 'desc' }
      });
    });

    it('orders by participant count ascending for entrants-asc', async () => {
      await getHistoricalSweepstakesList({ sortBy: 'entrants-asc' });

      expect(findManyArgs().orderBy).toEqual({
        participants: { _count: 'asc' }
      });
    });

    it('orders by creation date descending for newest', async () => {
      await getHistoricalSweepstakesList({ sortBy: 'newest' });

      expect(findManyArgs().orderBy).toEqual({ createdAt: 'desc' });
    });

    it('falls back to end date descending for ending-soon', async () => {
      await getHistoricalSweepstakesList({ sortBy: 'ending-soon' });

      expect(findManyArgs().orderBy).toEqual({ timing: { endDate: 'desc' } });
    });
  });

  describe('cache configuration', () => {
    it('uses default key parts when no input is given', async () => {
      await getHistoricalSweepstakesList(undefined);

      expect(nextCacheMock.unstable_cache).toHaveBeenCalledWith(
        expect.any(Function),
        [
          'historical-sweepstakes-list',
          '1',
          'default',
          'no-min',
          'no-max',
          'no-search'
        ],
        { tags: ['historical-sweepstakes-list'], revalidate: 3600 }
      );
    });

    it('builds key parts from page, sort, entrant bounds and search', async () => {
      await getHistoricalSweepstakesList({
        page: 4,
        sortBy: 'entrants-asc',
        minEntrants: 0,
        maxEntrants: 9,
        search: 'Dog'
      });

      expect(nextCacheMock.unstable_cache.mock.calls[0][1]).toEqual([
        'historical-sweepstakes-list',
        '4',
        'entrants-asc',
        '0',
        '9',
        'Dog'
      ]);
    });

    it('does not include status or host filters in the key parts', async () => {
      await getHistoricalSweepstakesList({
        showStatuses: ['EXPIRED'],
        hosts: ['acme']
      });

      expect(nextCacheMock.unstable_cache.mock.calls[0][1]).toEqual([
        'historical-sweepstakes-list',
        '1',
        'default',
        'no-min',
        'no-max',
        'no-search'
      ]);
    });
  });

  describe('result mapping', () => {
    it('maps an ended sweepstakes into the public shape with an EXPIRED status', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        ended({
          id: 'sw-1',
          slug: 'old-one',
          banner: 'https://example.com/banner.png',
          prizeCount: 3,
          participantIds: ['p-1', 'p-2']
        })
      ]);

      const result = await getHistoricalSweepstakesList(undefined);

      expect(expectOk(result)).toEqual([
        {
          id: 'sw-1',
          slug: 'old-one',
          name: 'Great Giveaway',
          description: 'Win something nice',
          banner: 'https://example.com/banner.png',
          startDate: daysFromFixedNow(-30),
          endDate: daysFromFixedNow(-10),
          status: 'EXPIRED',
          host: { id: 'team-1', slug: 'acme', name: 'Acme' },
          prizes: 3,
          participants: 2,
          featured: false
        }
      ]);
    });

    it('reports a COMPLETED status for completed sweepstakes', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        ended({ status: 'COMPLETED' })
      ]);

      const result = await getHistoricalSweepstakesList(undefined);

      expect(expectOk(result)[0].status).toBe('COMPLETED');
    });

    it('reports a DRAFT status for draft sweepstakes returned by the query', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        ended({ status: 'DRAFT' })
      ]);

      const result = await getHistoricalSweepstakesList(undefined);

      expect(expectOk(result)[0].status).toBe('DRAFT');
    });

    it('drops sweepstakes that cannot be converted to the public shape', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        ended({ id: 'no-description', description: null }),
        ended({ id: 'no-team', team: null }),
        ended({ id: 'valid' })
      ]);

      const result = await getHistoricalSweepstakesList(undefined);

      expect(expectOk(result).map((item) => item.id)).toEqual(['valid']);
    });

    it('returns an empty list when nothing matches', async () => {
      const result = await getHistoricalSweepstakesList(undefined);

      expect(expectOk(result)).toEqual([]);
    });
  });

  describe('entrant filters', () => {
    beforeEach(() => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        ended({ id: 'zero' }),
        ended({ id: 'three', participantIds: participants(3) }),
        ended({ id: 'six', participantIds: participants(6) })
      ]);
    });

    it('keeps sweepstakes with at least minEntrants participants (inclusive)', async () => {
      const result = await getHistoricalSweepstakesList({ minEntrants: 3 });

      expect(expectOk(result).map((item) => item.id)).toEqual(['three', 'six']);
    });

    it('keeps sweepstakes with at most maxEntrants participants (inclusive)', async () => {
      const result = await getHistoricalSweepstakesList({ maxEntrants: 3 });

      expect(expectOk(result).map((item) => item.id)).toEqual([
        'zero',
        'three'
      ]);
    });

    it('applies both bounds together', async () => {
      const result = await getHistoricalSweepstakesList({
        minEntrants: 1,
        maxEntrants: 5
      });

      expect(expectOk(result).map((item) => item.id)).toEqual(['three']);
    });

    it('keeps every sweepstakes when minEntrants is zero', async () => {
      const result = await getHistoricalSweepstakesList({ minEntrants: 0 });

      expect(expectOk(result)).toHaveLength(3);
    });

    it('filters only within the fetched page, so a page can hold fewer than 20 results', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue(
        Array.from({ length: 20 }, (_, index) =>
          ended({
            id: `sw-${index}`,
            participantIds: index % 2 === 0 ? participants(1) : []
          })
        )
      );

      const result = await getHistoricalSweepstakesList({ minEntrants: 1 });

      expect(expectOk(result)).toHaveLength(10);
    });
  });

  describe('search filter', () => {
    beforeEach(() => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        ended({ id: 'by-name', name: 'Puppy Party', description: 'Fun' }),
        ended({
          id: 'by-description',
          name: 'Summer Bash',
          description: 'A PUPPY prize'
        }),
        ended({ id: 'no-match', name: 'Cat Club', description: 'Meow' })
      ]);
    });

    it('matches the name or description case-insensitively', async () => {
      const result = await getHistoricalSweepstakesList({ search: 'pUpPy' });

      expect(expectOk(result).map((item) => item.id)).toEqual([
        'by-name',
        'by-description'
      ]);
    });

    it('ignores an empty search string', async () => {
      const result = await getHistoricalSweepstakesList({ search: '' });

      expect(expectOk(result)).toHaveLength(3);
    });
  });

  describe('ignored filters', () => {
    it('accepts status, host and hideEntered filters without applying them', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        ended({ id: 'sw-1', team: { id: 't-1', slug: 'acme', name: 'Acme' } })
      ]);

      const result = await getHistoricalSweepstakesList({
        showStatuses: ['RUNNING'],
        hosts: ['someone-else'],
        hideEntered: true
      });

      expect(expectOk(result).map((item) => item.id)).toEqual(['sw-1']);
    });
  });

  describe('input validation', () => {
    it.each([
      ['page of zero', 'page', { page: 0 }],
      ['fractional page', 'page', { page: 2.5 }],
      ['string page', 'page', { page: '2' }],
      ['negative minEntrants', 'minEntrants', { minEntrants: -1 }],
      ['negative maxEntrants', 'maxEntrants', { maxEntrants: -1 }],
      ['unknown sortBy', 'sortBy', { sortBy: 'oldest' }]
    ])('rejects a %s', async (_label, field, input) => {
      const result = await getHistoricalSweepstakesList(
        input as unknown as Input
      );

      const failure = expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(failure.message).toMatch(/^Input validation failed: /);
      expect(failure.message).toContain(`"${field}"`);
      expect(prismaMock.sweepstakes.findMany).not.toHaveBeenCalled();
    });

    it('accepts an empty object', async () => {
      const result = await getHistoricalSweepstakesList({});

      expect(expectOk(result)).toEqual([]);
    });
  });

  describe('authorization', () => {
    it('serves signed in callers', async () => {
      signIn();
      prismaMock.sweepstakes.findMany.mockResolvedValue([ended()]);

      const result = await getHistoricalSweepstakesList(undefined);

      expect(expectOk(result)).toHaveLength(1);
    });
  });

  describe('when the database fails', () => {
    it('returns INTERNAL_SERVER_ERROR with the error message', async () => {
      prismaMock.sweepstakes.findMany.mockRejectedValue(new Error('timeout'));

      const result = await getHistoricalSweepstakesList(undefined);

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'timeout'
      );
    });
  });
});
