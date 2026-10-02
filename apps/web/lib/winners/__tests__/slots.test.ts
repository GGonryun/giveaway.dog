import { describe, it, expect } from 'vitest';
import { ApplicationError } from '@/lib/errors';
import {
  getDrawsInfo,
  getEmptyPrizeSlots,
  getPrizeAllocations
} from '../slots';
import { asPrismaClient, prismaMock } from '@giveaway/testing-server/prisma';
import { buildAllocation } from './fixtures-winners-model';

const db = asPrismaClient();

const draw = (result: 'WINNER' | 'DISQUALIFIED') => ({ result });

const prize = (
  id: string,
  quota: number | null,
  draws: { result: 'WINNER' | 'DISQUALIFIED' }[] = []
) => ({ id, quota, draws });

describe('getEmptyPrizeSlots', () => {
  describe('query shape', () => {
    it('filters prizes by sweepstakes only when no prize or draw is given', async () => {
      prismaMock.prize.findMany.mockResolvedValue([prize('p-1', 1)]);

      await getEmptyPrizeSlots({ db, sweepstakesId: 'sw-1' });

      expect(prismaMock.prize.findMany).toHaveBeenCalledWith({
        where: { sweepstakesId: 'sw-1' },
        include: { draws: true },
        orderBy: { index: 'asc' }
      });
    });

    it('narrows to a single prize when a prize id is given', async () => {
      prismaMock.prize.findMany.mockResolvedValue([prize('p-1', 1)]);

      await getEmptyPrizeSlots({ db, sweepstakesId: 'sw-1', prizeId: 'p-1' });

      expect(prismaMock.prize.findMany).toHaveBeenCalledWith({
        where: { sweepstakesId: 'sw-1', id: 'p-1' },
        include: { draws: true },
        orderBy: { index: 'asc' }
      });
    });

    it('narrows to the prize owning a draw when a draw id is given', async () => {
      prismaMock.prize.findMany.mockResolvedValue([prize('p-1', 1)]);

      await getEmptyPrizeSlots({ db, sweepstakesId: 'sw-1', drawId: 'd-1' });

      expect(prismaMock.prize.findMany).toHaveBeenCalledWith({
        where: { sweepstakesId: 'sw-1', draws: { some: { id: 'd-1' } } },
        include: { draws: true },
        orderBy: { index: 'asc' }
      });
    });
  });

  describe('slot computation', () => {
    it('creates one slot per unit of quota', async () => {
      prismaMock.prize.findMany.mockResolvedValue([prize('p-1', 3)]);

      await expect(
        getEmptyPrizeSlots({ db, sweepstakesId: 'sw-1' })
      ).resolves.toEqual([
        { prizeId: 'p-1' },
        { prizeId: 'p-1' },
        { prizeId: 'p-1' }
      ]);
    });

    it('defaults a missing quota to one slot', async () => {
      prismaMock.prize.findMany.mockResolvedValue([prize('p-1', null)]);

      await expect(
        getEmptyPrizeSlots({ db, sweepstakesId: 'sw-1' })
      ).resolves.toEqual([{ prizeId: 'p-1' }]);
    });

    it('subtracts existing winners from the quota', async () => {
      prismaMock.prize.findMany.mockResolvedValue([
        prize('p-1', 3, [draw('WINNER')])
      ]);

      await expect(
        getEmptyPrizeSlots({ db, sweepstakesId: 'sw-1' })
      ).resolves.toEqual([{ prizeId: 'p-1' }, { prizeId: 'p-1' }]);
    });

    it('does not count disqualified draws against the quota', async () => {
      prismaMock.prize.findMany.mockResolvedValue([
        prize('p-1', 2, [draw('DISQUALIFIED'), draw('DISQUALIFIED')])
      ]);

      await expect(
        getEmptyPrizeSlots({ db, sweepstakesId: 'sw-1' })
      ).resolves.toHaveLength(2);
    });

    it('keeps prize order and skips filled prizes', async () => {
      prismaMock.prize.findMany.mockResolvedValue([
        prize('p-1', 1),
        prize('p-2', 1, [draw('WINNER')]),
        prize('p-3', 2)
      ]);

      await expect(
        getEmptyPrizeSlots({ db, sweepstakesId: 'sw-1' })
      ).resolves.toEqual([
        { prizeId: 'p-1' },
        { prizeId: 'p-3' },
        { prizeId: 'p-3' }
      ]);
    });

    it('ignores prizes that have more winners than their quota', async () => {
      prismaMock.prize.findMany.mockResolvedValue([
        prize('p-1', 1, [draw('WINNER'), draw('WINNER')]),
        prize('p-2', 1)
      ]);

      await expect(
        getEmptyPrizeSlots({ db, sweepstakesId: 'sw-1' })
      ).resolves.toEqual([{ prizeId: 'p-2' }]);
    });
  });

  describe('errors', () => {
    it('throws VALIDATION_ERROR when no prizes match', async () => {
      prismaMock.prize.findMany.mockResolvedValue([]);

      const error = await getEmptyPrizeSlots({
        db,
        sweepstakesId: 'sw-1'
      }).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'No prizes found for this sweepstakes'
      });
    });

    it('throws CONFLICT when every prize slot is filled', async () => {
      prismaMock.prize.findMany.mockResolvedValue([
        prize('p-1', 1, [draw('WINNER')]),
        prize('p-2', null, [draw('WINNER')])
      ]);

      await expect(
        getEmptyPrizeSlots({ db, sweepstakesId: 'sw-1' })
      ).rejects.toMatchObject({
        code: 'CONFLICT',
        message: 'All prize slots are already filled'
      });
    });

    it('throws CONFLICT when the only prize has a zero quota', async () => {
      prismaMock.prize.findMany.mockResolvedValue([prize('p-1', 0)]);

      await expect(
        getEmptyPrizeSlots({ db, sweepstakesId: 'sw-1' })
      ).rejects.toMatchObject({ code: 'CONFLICT' });
    });
  });
});

describe('getDrawsInfo', () => {
  it('queries draws for prizes of the sweepstakes including the participant', async () => {
    prismaMock.prizeDraw.findMany.mockResolvedValue([]);

    await getDrawsInfo({ db, sweepstakesId: 'sw-1' });

    expect(prismaMock.prizeDraw.findMany).toHaveBeenCalledWith({
      where: { prize: { sweepstakesId: 'sw-1' } },
      include: { taskCompletion: { include: { participant: true } } }
    });
  });

  it('maps each draw to its id and the participant user id', async () => {
    prismaMock.prizeDraw.findMany.mockResolvedValue([
      { id: 'd-1', taskCompletion: { participant: { userId: 'u-1' } } },
      { id: 'd-2', taskCompletion: { participant: { userId: 'u-2' } } }
    ]);

    await expect(getDrawsInfo({ db, sweepstakesId: 'sw-1' })).resolves.toEqual([
      { drawId: 'd-1', userId: 'u-1' },
      { drawId: 'd-2', userId: 'u-2' }
    ]);
  });

  it('returns an empty list when there are no draws', async () => {
    prismaMock.prizeDraw.findMany.mockResolvedValue([]);

    await expect(getDrawsInfo({ db, sweepstakesId: 'sw-1' })).resolves.toEqual(
      []
    );
  });
});

describe('getPrizeAllocations', () => {
  it('queries allocations of participants in the sweepstakes', async () => {
    prismaMock.sweepstakesAllocation.findMany.mockResolvedValue([]);

    await getPrizeAllocations({ db, sweepstakesId: 'sw-1' });

    expect(prismaMock.sweepstakesAllocation.findMany).toHaveBeenCalledWith({
      where: { participant: { sweepstakesId: 'sw-1' } }
    });
  });

  it('returns the allocations unchanged', async () => {
    const allocations = [
      buildAllocation('participant-1', 'p-1'),
      buildAllocation('participant-2', 'p-2')
    ];
    prismaMock.sweepstakesAllocation.findMany.mockResolvedValue(allocations);

    await expect(
      getPrizeAllocations({ db, sweepstakesId: 'sw-1' })
    ).resolves.toBe(allocations);
  });
});
