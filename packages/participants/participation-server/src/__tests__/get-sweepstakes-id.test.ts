import { describe, it, expect } from 'vitest';
import { getSweepstakesId } from '../get-sweepstakes-id';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { nextCacheMock } from '@giveaway/testing-server/next-cache';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';

type Input = Parameters<typeof getSweepstakesId>[0];

describe('getSweepstakesId', () => {
  it('returns the id of the giveaway of a slug', async () => {
    prismaMock.sweepstakes.findFirst.mockResolvedValue({
      id: 'sw-1',
      teamId: 'team-1',
      status: 'ACTIVE',
      visibility: { visibility: 'PUBLIC' },
      timing: null
    });

    const result = await getSweepstakesId({ sweepstakesId: 'promo' });

    expect(expectOk(result)).toBe('sw-1');
    expect(nextCacheMock.unstable_cache).toHaveBeenCalledWith(
      expect.any(Function),
      ['sweepstakes-access-v1-promo'],
      expect.objectContaining({
        tags: expect.arrayContaining(['participant-sweepstake'])
      })
    );
  });

  it('returns NOT_FOUND when no giveaway has the id or slug', async () => {
    prismaMock.sweepstakes.findFirst.mockResolvedValue(null);

    const result = await getSweepstakesId({ sweepstakesId: 'missing' });

    expect(expectFailure(result, 'NOT_FOUND').message).toBe(
      'Sweepstakes with ID missing not found'
    );
  });

  it('returns UNPROCESSABLE_CONTENT when sweepstakesId is not a string', async () => {
    const result = await getSweepstakesId({
      sweepstakesId: 1
    } as unknown as Input);

    expectFailure(result, 'UNPROCESSABLE_CONTENT');
    expect(prismaMock.sweepstakes.findFirst).not.toHaveBeenCalled();
  });
});
