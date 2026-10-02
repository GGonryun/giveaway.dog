import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSweepstakesAllocations } from '../get-sweepstakes-allocations';
import { prismaMock, knownRequestError } from '@giveaway/testing-server/prisma';
import { signIn } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { nextCacheMock } from '@giveaway/testing-server/next-cache';
import { DEFAULT_SWEEPSTAKES_PRIZE_NAME } from '@/schemas/giveaway/defaults';

const group = (prizeId: string, count: number) => ({
  prizeId,
  _count: { prizeId: count }
});

const prize = (id: string, name: string | null) => ({
  id,
  name,
  sweepstakesId: 'sw-1'
});

const arrange = ({
  total,
  groups,
  prizes
}: {
  total: unknown;
  groups: ReturnType<typeof group>[];
  prizes: ReturnType<typeof prize>[];
}) => {
  prismaMock.sweepstakesAllocation.count.mockResolvedValue(total);
  prismaMock.sweepstakesAllocation.groupBy.mockResolvedValue(groups);
  prismaMock.prize.findMany.mockResolvedValue(prizes);
};

describe('getSweepstakesAllocations', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('authorization and input', () => {
    it('allows signed out callers', async () => {
      arrange({ total: 0, groups: [], prizes: [] });

      const result = await getSweepstakesAllocations({ sweepstakesId: 'sw-1' });

      expect(expectOk(result)).toEqual({
        totalAllocations: 0,
        allocationsByPrize: []
      });
    });

    it('allows signed in callers', async () => {
      signIn();
      arrange({ total: 0, groups: [], prizes: [] });

      const result = await getSweepstakesAllocations({ sweepstakesId: 'sw-1' });

      expect(expectOk(result)).toEqual({
        totalAllocations: 0,
        allocationsByPrize: []
      });
    });

    it('returns UNPROCESSABLE_CONTENT when sweepstakesId is missing', async () => {
      const result = await getSweepstakesAllocations(
        {} as unknown as Parameters<typeof getSweepstakesAllocations>[0]
      );

      const failure = expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(failure.message).toMatch(/^Input validation failed: /);
      expect(prismaMock.sweepstakesAllocation.count).not.toHaveBeenCalled();
    });
  });

  describe('caching', () => {
    it('wraps the handler in unstable_cache with sweepstakes scoped keys and tags', async () => {
      arrange({ total: 0, groups: [], prizes: [] });

      await getSweepstakesAllocations({ sweepstakesId: 'sw-1' });

      expect(nextCacheMock.unstable_cache).toHaveBeenCalledWith(
        expect.any(Function),
        ['sweepstakes-allocations-sw-1'],
        {
          tags: ['sweepstakes-sw-1', 'sweepstakes-allocations'],
          revalidate: 600
        }
      );
    });

    it('does not revalidate any tags', async () => {
      arrange({ total: 0, groups: [], prizes: [] });

      await getSweepstakesAllocations({ sweepstakesId: 'sw-1' });

      expect(nextCacheMock.revalidateTag).not.toHaveBeenCalled();
    });
  });

  describe('database queries', () => {
    it('counts allocations for participants of the sweepstakes', async () => {
      arrange({ total: 0, groups: [], prizes: [] });

      await getSweepstakesAllocations({ sweepstakesId: 'sw-9' });

      expect(prismaMock.sweepstakesAllocation.count).toHaveBeenCalledWith({
        where: { participant: { sweepstakesId: 'sw-9' } }
      });
    });

    it('groups allocations by prize for participants of the sweepstakes', async () => {
      arrange({ total: 0, groups: [], prizes: [] });

      await getSweepstakesAllocations({ sweepstakesId: 'sw-9' });

      expect(prismaMock.sweepstakesAllocation.groupBy).toHaveBeenCalledWith({
        by: ['prizeId'],
        where: { participant: { sweepstakesId: 'sw-9' } },
        _count: { prizeId: true }
      });
    });

    it('loads the prizes of the sweepstakes', async () => {
      arrange({ total: 0, groups: [], prizes: [] });

      await getSweepstakesAllocations({ sweepstakesId: 'sw-9' });

      expect(prismaMock.prize.findMany).toHaveBeenCalledWith({
        where: { sweepstakesId: 'sw-9' }
      });
    });
  });

  describe('prize names', () => {
    it('uses the name of the matching prize', async () => {
      arrange({
        total: 4,
        groups: [group('p-1', 4)],
        prizes: [prize('p-1', 'Gift Card')]
      });

      const data = expectOk(
        await getSweepstakesAllocations({ sweepstakesId: 'sw-1' })
      );

      expect(data.allocationsByPrize[0].prizeName).toBe('Gift Card');
    });

    it('falls back to the default prize name when the prize name is null', async () => {
      arrange({
        total: 4,
        groups: [group('p-1', 4)],
        prizes: [prize('p-1', null)]
      });

      const data = expectOk(
        await getSweepstakesAllocations({ sweepstakesId: 'sw-1' })
      );

      expect(data.allocationsByPrize[0].prizeName).toBe(
        DEFAULT_SWEEPSTAKES_PRIZE_NAME
      );
    });

    it('falls back to the default prize name when the prize name is empty', async () => {
      arrange({
        total: 4,
        groups: [group('p-1', 4)],
        prizes: [prize('p-1', '')]
      });

      const data = expectOk(
        await getSweepstakesAllocations({ sweepstakesId: 'sw-1' })
      );

      expect(data.allocationsByPrize[0].prizeName).toBe('My Custom Prize');
    });

    it('falls back to the default prize name when the prize is not found', async () => {
      arrange({
        total: 4,
        groups: [group('p-missing', 4)],
        prizes: [prize('p-1', 'Gift Card')]
      });

      const data = expectOk(
        await getSweepstakesAllocations({ sweepstakesId: 'sw-1' })
      );

      expect(data.allocationsByPrize[0]).toEqual({
        prizeId: 'p-missing',
        prizeName: DEFAULT_SWEEPSTAKES_PRIZE_NAME,
        allocationCount: 4,
        badge: 'none'
      });
    });
  });

  describe('grouping', () => {
    it('omits prizes that have no allocations', async () => {
      arrange({
        total: 2,
        groups: [group('p-1', 2)],
        prizes: [prize('p-1', 'A'), prize('p-2', 'B')]
      });

      const data = expectOk(
        await getSweepstakesAllocations({ sweepstakesId: 'sw-1' })
      );

      expect(data.allocationsByPrize.map((a) => a.prizeId)).toEqual(['p-1']);
    });

    it('keeps the order of the grouped query rather than the prize list', async () => {
      arrange({
        total: 3,
        groups: [group('p-2', 1), group('p-1', 2)],
        prizes: [prize('p-1', 'A'), prize('p-2', 'B')]
      });

      const data = expectOk(
        await getSweepstakesAllocations({ sweepstakesId: 'sw-1' })
      );

      expect(data.allocationsByPrize).toEqual([
        {
          prizeId: 'p-2',
          prizeName: 'B',
          allocationCount: 1,
          badge: 'unpopular'
        },
        { prizeId: 'p-1', prizeName: 'A', allocationCount: 2, badge: 'popular' }
      ]);
    });

    it('reports the counted total even when it differs from the grouped counts', async () => {
      arrange({
        total: 10,
        groups: [group('p-1', 2)],
        prizes: [prize('p-1', 'A')]
      });

      const data = expectOk(
        await getSweepstakesAllocations({ sweepstakesId: 'sw-1' })
      );

      expect(data.totalAllocations).toBe(10);
    });
  });

  describe('badges', () => {
    it('assigns no badge when there is a single prize', async () => {
      arrange({
        total: 7,
        groups: [group('p-1', 7)],
        prizes: [prize('p-1', 'Only')]
      });

      const data = expectOk(
        await getSweepstakesAllocations({ sweepstakesId: 'sw-1' })
      );

      expect(data).toEqual({
        totalAllocations: 7,
        allocationsByPrize: [
          {
            prizeId: 'p-1',
            prizeName: 'Only',
            allocationCount: 7,
            badge: 'none'
          }
        ]
      });
    });

    it('assigns no badges when the total allocation count is zero', async () => {
      arrange({
        total: 0,
        groups: [group('p-1', 3), group('p-2', 1)],
        prizes: [prize('p-1', 'A'), prize('p-2', 'B')]
      });

      const data = expectOk(
        await getSweepstakesAllocations({ sweepstakesId: 'sw-1' })
      );

      expect(data.allocationsByPrize.map((a) => a.badge)).toEqual([
        'none',
        'none'
      ]);
    });

    it('returns an empty list when there are allocations but no groups', async () => {
      arrange({ total: 5, groups: [], prizes: [] });

      const data = expectOk(
        await getSweepstakesAllocations({ sweepstakesId: 'sw-1' })
      );

      expect(data).toEqual({ totalAllocations: 5, allocationsByPrize: [] });
    });

    it('marks the most allocated prize popular and the least allocated unpopular', async () => {
      arrange({
        total: 10,
        groups: [group('p-1', 2), group('p-2', 5), group('p-3', 3)],
        prizes: [prize('p-1', 'A'), prize('p-2', 'B'), prize('p-3', 'C')]
      });

      const data = expectOk(
        await getSweepstakesAllocations({ sweepstakesId: 'sw-1' })
      );

      expect(data).toEqual({
        totalAllocations: 10,
        allocationsByPrize: [
          {
            prizeId: 'p-1',
            prizeName: 'A',
            allocationCount: 2,
            badge: 'unpopular'
          },
          {
            prizeId: 'p-2',
            prizeName: 'B',
            allocationCount: 5,
            badge: 'popular'
          },
          { prizeId: 'p-3', prizeName: 'C', allocationCount: 3, badge: 'none' }
        ]
      });
    });

    it('assigns no badges when every prize has the same allocation count', async () => {
      arrange({
        total: 6,
        groups: [group('p-1', 3), group('p-2', 3)],
        prizes: [prize('p-1', 'A'), prize('p-2', 'B')]
      });

      const data = expectOk(
        await getSweepstakesAllocations({ sweepstakesId: 'sw-1' })
      );

      expect(data.allocationsByPrize.map((a) => a.badge)).toEqual([
        'none',
        'none'
      ]);
    });

    it('marks every prize tied for the maximum as popular', async () => {
      arrange({
        total: 9,
        groups: [group('p-1', 4), group('p-2', 4), group('p-3', 1)],
        prizes: [prize('p-1', 'A'), prize('p-2', 'B'), prize('p-3', 'C')]
      });

      const data = expectOk(
        await getSweepstakesAllocations({ sweepstakesId: 'sw-1' })
      );

      expect(data.allocationsByPrize.map((a) => a.badge)).toEqual([
        'popular',
        'popular',
        'unpopular'
      ]);
    });

    it('marks every prize tied for the minimum as unpopular', async () => {
      arrange({
        total: 6,
        groups: [group('p-1', 1), group('p-2', 4), group('p-3', 1)],
        prizes: [prize('p-1', 'A'), prize('p-2', 'B'), prize('p-3', 'C')]
      });

      const data = expectOk(
        await getSweepstakesAllocations({ sweepstakesId: 'sw-1' })
      );

      expect(data.allocationsByPrize.map((a) => a.badge)).toEqual([
        'unpopular',
        'popular',
        'unpopular'
      ]);
    });
  });

  describe('failures', () => {
    it('returns UNPROCESSABLE_CONTENT when the data does not match the output schema', async () => {
      arrange({ total: '3', groups: [], prizes: [] });

      const result = await getSweepstakesAllocations({ sweepstakesId: 'sw-1' });

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Output validation failed: /
      );
    });

    it('maps a prisma P2025 error to NOT_FOUND', async () => {
      prismaMock.sweepstakesAllocation.count.mockRejectedValue(
        knownRequestError('P2025')
      );

      const result = await getSweepstakesAllocations({ sweepstakesId: 'sw-1' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Unable to process your request. The item may no longer exist. Give us a minute before you try again.'
      );
      expect(prismaMock.sweepstakesAllocation.groupBy).not.toHaveBeenCalled();
      expect(prismaMock.prize.findMany).not.toHaveBeenCalled();
    });

    it('maps a generic error from the prize query to INTERNAL_SERVER_ERROR with its message', async () => {
      arrange({ total: 1, groups: [group('p-1', 1)], prizes: [] });
      prismaMock.prize.findMany.mockRejectedValue(new Error('prizes offline'));

      const result = await getSweepstakesAllocations({ sweepstakesId: 'sw-1' });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'prizes offline'
      );
    });
  });
});
