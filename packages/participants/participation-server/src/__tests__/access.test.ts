import { describe, it, expect } from 'vitest';
import type { PrismaClient } from '@giveaway/db-model';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { nextCacheMock } from '@giveaway/testing-server/next-cache';
import {
  findSweepstakesAccess,
  SWEEPSTAKES_ACCESS_SELECT_QUERY,
  sweepstakesAccessTags
} from '../access';

const START = new Date('2026-03-01T00:00:00.000Z');
const END = new Date('2026-03-20T00:00:00.000Z');

const row = {
  id: 'sw-1',
  teamId: 'team-1',
  status: 'ACTIVE',
  visibility: { visibility: 'PUBLIC' },
  timing: { startDate: START, endDate: END }
};

const find = (sweepstakesId = 'sw-1') =>
  findSweepstakesAccess({
    db: prismaMock as unknown as PrismaClient,
    sweepstakesId
  });

describe('findSweepstakesAccess', () => {
  it('reads the id, team, status, visibility and dates by id or slug', async () => {
    prismaMock.sweepstakes.findFirst.mockResolvedValue(row);

    const result = await find('promo');

    expect(result).toEqual(row);
    expect(prismaMock.sweepstakes.findFirst).toHaveBeenCalledWith({
      where: { OR: [{ id: 'promo' }, { visibility: { slug: 'promo' } }] },
      select: SWEEPSTAKES_ACCESS_SELECT_QUERY
    });
    expect(SWEEPSTAKES_ACCESS_SELECT_QUERY).toEqual({
      id: true,
      teamId: true,
      status: true,
      visibility: { select: { visibility: true } },
      timing: { select: { startDate: true, endDate: true } }
    });
  });

  it('caches the read under one key for every caller, with the tags that the writes of the giveaway expire', async () => {
    prismaMock.sweepstakes.findFirst.mockResolvedValue(row);

    await find('sw-1');

    expect(nextCacheMock.unstable_cache).toHaveBeenCalledWith(
      expect.any(Function),
      ['sweepstakes-access-v1-sw-1'],
      {
        tags: [
          'sweepstakes-sw-1',
          'sweepstakes-sw-1-privacy',
          'participant-sweepstake'
        ],
        revalidate: 3600
      }
    );
    expect(sweepstakesAccessTags('promo')).toEqual([
      'sweepstakes-promo',
      'sweepstakes-promo-privacy',
      'participant-sweepstake'
    ]);
  });

  it('turns the dates of a cached entry back into dates', async () => {
    nextCacheMock.unstable_cache.mockImplementation(
      () => async () => JSON.parse(JSON.stringify(row))
    );

    const result = await find();

    expect(result?.timing).toEqual({ startDate: START, endDate: END });
  });

  it('keeps missing dates and a missing timing as null', async () => {
    prismaMock.sweepstakes.findFirst.mockResolvedValueOnce({
      ...row,
      timing: { startDate: null, endDate: null }
    });
    prismaMock.sweepstakes.findFirst.mockResolvedValueOnce({
      ...row,
      timing: null
    });

    expect((await find())?.timing).toEqual({
      startDate: null,
      endDate: null
    });
    expect((await find())?.timing).toBeNull();
  });

  it('returns null for a missing giveaway, and throws inside the cached function so that the miss is not cached', async () => {
    prismaMock.sweepstakes.findFirst.mockResolvedValue(null);
    let cachedFn: (id: string) => Promise<unknown> = async () => undefined;
    nextCacheMock.unstable_cache.mockImplementation(
      (fn: (id: string) => Promise<unknown>) => {
        cachedFn = fn;
        return fn;
      }
    );

    expect(await find('missing')).toBeNull();
    await expect(cachedFn('missing')).rejects.toThrow();
  });

  it('passes a database error on', async () => {
    prismaMock.sweepstakes.findFirst.mockRejectedValue(new Error('down'));

    await expect(find()).rejects.toThrow('down');
  });
});
