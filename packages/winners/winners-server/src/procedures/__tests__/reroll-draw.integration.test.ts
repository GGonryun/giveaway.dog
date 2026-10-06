import { describe, expect, it } from 'vitest';
import { db, holdTableWrites } from '@giveaway/testing-integration/database';
import { signIn } from '@giveaway/testing-server/session';
import { expectOk } from '@giveaway/testing-server/result';
import { rerollDraw } from '../reroll-draw';
import { rollPrizes } from '../roll-prizes';
import {
  countWinners,
  createDrawableSweepstakes,
  findDraws,
  findWinningUserIds
} from '../../testing/draws';

const setup = async (
  options: Parameters<typeof createDrawableSweepstakes>[0]
) => {
  const sweepstakes = await createDrawableSweepstakes(options);
  signIn({ id: sweepstakes.hostId });
  const input = { sweepstakesId: sweepstakes.id, slug: sweepstakes.slug };
  expectOk(await rollPrizes(input));
  const draws = await findDraws(sweepstakes.id);
  const reroll = (drawId: string) =>
    rerollDraw({ ...input, drawId, disqualificationReason: ' Bot account ' });
  return { sweepstakes, draws, reroll };
};

describe('rerollDraw', () => {
  it('disqualifies the draw and links a new winner to it', async () => {
    const { sweepstakes, draws, reroll } = await setup({
      quotas: [1],
      entries: 3
    });
    const [draw] = draws;

    expectOk(await reroll(draw.id));

    const [disqualified, replacement] = await findDraws(sweepstakes.id);
    expect(disqualified).toMatchObject({
      id: draw.id,
      result: 'DISQUALIFIED',
      disqualificationReason: 'Bot account',
      previousDrawId: null
    });
    expect(replacement).toMatchObject({
      result: 'WINNER',
      prizeId: draw.prizeId,
      previousDrawId: draw.id
    });
    expect(replacement.taskCompletion.participant.userId).not.toBe(
      draw.taskCompletion.participant.userId
    );
    const completions = await db.taskCompletion.findMany({
      where: { participantId: draw.taskCompletion.participantId }
    });
    expect(completions.map((completion) => completion.status)).toEqual([
      'REJECTED'
    ]);
  });

  it('chains each reroll to the draw it replaces', async () => {
    const { sweepstakes, draws, reroll } = await setup({
      quotas: [1],
      entries: 3
    });

    expectOk(await reroll(draws[0].id));
    const [, second] = await findDraws(sweepstakes.id);
    expectOk(await reroll(second.id));

    const chain = await findDraws(sweepstakes.id);
    expect(
      chain.map(({ id, previousDrawId, result }) => ({
        id,
        previousDrawId,
        result
      }))
    ).toEqual([
      { id: draws[0].id, previousDrawId: null, result: 'DISQUALIFIED' },
      { id: second.id, previousDrawId: draws[0].id, result: 'DISQUALIFIED' },
      { id: chain[2].id, previousDrawId: second.id, result: 'WINNER' }
    ]);
    expect(await countWinners(sweepstakes.id)).toEqual({
      [draws[0].prizeId]: 1
    });
  });

  it('creates one replacement when the same draw is rerolled twice at the same time', async () => {
    const { sweepstakes, draws, reroll } = await setup({
      quotas: [1],
      entries: 4
    });
    const [draw] = draws;

    const results = await holdTableWrites('PrizeDraw', { writers: 2 }, () =>
      Promise.all([reroll(draw.id), reroll(draw.id)])
    );

    expect(results.filter((result) => result.ok)).toHaveLength(1);
    const replacements = await db.prizeDraw.findMany({
      where: { previousDrawId: draw.id }
    });
    expect(replacements).toHaveLength(1);
    expect(await countWinners(sweepstakes.id)).toEqual({
      [draw.prizeId]: 1
    });
  });

  it.fails(
    'picks different users when two draws are rerolled at the same time (fails until #135 is fixed)',
    async () => {
      const { sweepstakes, draws, reroll } = await setup({
        quotas: [2],
        entries: 3
      });

      await holdTableWrites('PrizeDraw', { writers: 2 }, () =>
        Promise.all(draws.map((draw) => reroll(draw.id)))
      );

      const winners = await findWinningUserIds(sweepstakes.id);
      expect(winners).toHaveLength(2);
      expect(new Set(winners).size).toBe(2);
    }
  );
});
