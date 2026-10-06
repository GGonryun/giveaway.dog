import { describe, expect, it } from 'vitest';
import { holdTableWrites } from '@giveaway/testing-integration/database';
import { signIn } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { rollPrize } from '../roll-prize';
import { rollPrizes } from '../roll-prizes';
import {
  countWinners,
  createDrawableSweepstakes,
  findWinningUserIds
} from '../../testing/draws';

const setup = async (
  options: Parameters<typeof createDrawableSweepstakes>[0]
) => {
  const sweepstakes = await createDrawableSweepstakes(options);
  signIn({ id: sweepstakes.hostId });
  const [first, second] = sweepstakes.prizes;
  return {
    input: { sweepstakesId: sweepstakes.id, slug: sweepstakes.slug },
    sweepstakes,
    first,
    second
  };
};

describe('rollPrizes', () => {
  it('fills every prize up to its quota with different users', async () => {
    const { input, first, second } = await setup({
      quotas: [1, 2],
      entries: 5
    });

    expectOk(await rollPrizes(input));

    expect(await countWinners(input.sweepstakesId)).toEqual({
      [first.id]: 1,
      [second.id]: 2
    });
    const winners = await findWinningUserIds(input.sweepstakesId);
    expect(new Set(winners).size).toBe(3);
  });

  it('returns CONFLICT when every prize slot is already filled', async () => {
    const { input } = await setup({ quotas: [1], entries: 2 });
    expectOk(await rollPrizes(input));

    expectFailure(await rollPrizes(input), 'CONFLICT');
  });

  it.fails(
    'never creates more winners than the quota when two rolls run at the same time (fails until #135 is fixed)',
    async () => {
      const { input, first, second } = await setup({
        quotas: [1, 2],
        entries: 3
      });

      await holdTableWrites('PrizeDraw', { writers: 2 }, () =>
        Promise.all([rollPrizes(input), rollPrizes(input)])
      );

      expect(await countWinners(input.sweepstakesId)).toEqual({
        [first.id]: 1,
        [second.id]: 2
      });
    }
  );

  it.fails(
    'never creates more winners than the quota when rollPrize and rollPrizes run at the same time (fails until #135 is fixed)',
    async () => {
      const { input, first, second } = await setup({
        quotas: [1, 2],
        entries: 3
      });

      await holdTableWrites('PrizeDraw', { writers: 2 }, () =>
        Promise.all([
          rollPrizes(input),
          rollPrize({ ...input, prizeId: second.id })
        ])
      );

      expect(await countWinners(input.sweepstakesId)).toEqual({
        [first.id]: 1,
        [second.id]: 2
      });
    }
  );

  it.fails(
    'lets a user win at most one prize when two rolls run at the same time and multiple wins are off (fails until #135 is fixed)',
    async () => {
      const { input } = await setup({ quotas: [1, 2], entries: 3 });

      await holdTableWrites('PrizeDraw', { writers: 2 }, () =>
        Promise.all([rollPrizes(input), rollPrizes(input)])
      );

      const winners = await findWinningUserIds(input.sweepstakesId);
      expect(winners.length).toBe(new Set(winners).size);
    }
  );
});
