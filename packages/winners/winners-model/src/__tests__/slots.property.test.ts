import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { asPrismaClient, prismaMock } from '@giveaway/testing-server/prisma';
import { assertAsyncProperty } from '@giveaway/testing-server/property';
import { getEmptyPrizeSlots } from '../slots';

const db = asPrismaClient();

const prizesArb = fc
  .array(
    fc.record({
      quota: fc.option(fc.integer({ min: 0, max: 5 }), { nil: null }),
      draws: fc.array(
        fc.record({ result: fc.constantFrom('WINNER', 'DISQUALIFIED') }),
        { maxLength: 8 }
      )
    }),
    { minLength: 1, maxLength: 5 }
  )
  .map((prizes) => prizes.map((prize, i) => ({ id: `prize-${i}`, ...prize })));

type PrizeRow = { quota: number | null; draws: { result: string }[] };

const expectedEmptySlots = ({ quota, draws }: PrizeRow) =>
  Math.max(
    0,
    (quota ?? 1) - draws.filter(({ result }) => result === 'WINNER').length
  );

describe('empty prize slot properties', () => {
  it('[SLOT-001] each prize has max(0, quota - winners) empty slots, and a prize with no quota has a quota of 1', async () => {
    await assertAsyncProperty(
      fc.asyncProperty(prizesArb, async (prizes) => {
        prismaMock.prize.findMany.mockResolvedValue(prizes);
        const expected = prizes.map(expectedEmptySlots);
        const total = expected.reduce((sum, count) => sum + count, 0);

        if (total === 0) {
          await expect(
            getEmptyPrizeSlots({ db, sweepstakesId: 'sw-1' })
          ).rejects.toMatchObject({ code: 'CONFLICT' });
          return;
        }

        const slots = await getEmptyPrizeSlots({ db, sweepstakesId: 'sw-1' });

        expect(slots).toHaveLength(total);
        prizes.forEach((prize, i) => {
          expect(
            slots.filter(({ prizeId }) => prizeId === prize.id)
          ).toHaveLength(expected[i]);
        });
      })
    );
  });
});
