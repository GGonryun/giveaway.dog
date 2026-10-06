import { describe, expect, it } from 'vitest';
import { db } from '@giveaway/testing-integration/database';
import { signIn } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { disqualifyDraw } from '../disqualify-draw';
import { rollPrizes } from '../roll-prizes';
import {
  countWinners,
  createDrawableSweepstakes,
  findDraws
} from '../../testing/draws';

const setup = async () => {
  const sweepstakes = await createDrawableSweepstakes({
    quotas: [1],
    entries: 3
  });
  signIn({ id: sweepstakes.hostId });
  const input = { sweepstakesId: sweepstakes.id, slug: sweepstakes.slug };
  expectOk(await rollPrizes(input));
  const [draw] = await findDraws(sweepstakes.id);
  return { sweepstakes, input, draw };
};

describe('disqualifyDraw', () => {
  it('disqualifies the draw and rejects every completion of the participant', async () => {
    const { input, draw } = await setup();

    expectOk(
      await disqualifyDraw({
        ...input,
        drawId: draw.id,
        disqualificationReason: ' Duplicate account '
      })
    );

    const disqualified = await db.prizeDraw.findUniqueOrThrow({
      where: { id: draw.id }
    });
    expect(disqualified).toMatchObject({
      result: 'DISQUALIFIED',
      disqualificationReason: 'Duplicate account'
    });
    const completions = await db.taskCompletion.findMany({
      where: { participantId: draw.taskCompletion.participantId }
    });
    expect(completions).toEqual([
      expect.objectContaining({
        status: 'REJECTED',
        reason: 'Participant disqualified: Duplicate account'
      })
    ]);
  });

  it('frees the slot for a new draw that starts a new chain', async () => {
    const { sweepstakes, input, draw } = await setup();
    expectOk(
      await disqualifyDraw({
        ...input,
        drawId: draw.id,
        disqualificationReason: 'Duplicate account'
      })
    );

    expectOk(await rollPrizes(input));

    const [disqualified, winner] = await findDraws(sweepstakes.id);
    expect(disqualified.id).toBe(draw.id);
    expect(winner).toMatchObject({ result: 'WINNER', previousDrawId: null });
    expect(winner.taskCompletion.participant.userId).not.toBe(
      draw.taskCompletion.participant.userId
    );
    expect(await countWinners(sweepstakes.id)).toEqual({
      [draw.prizeId]: 1
    });
  });

  it('returns NOT_FOUND for a draw that does not exist', async () => {
    const { input } = await setup();

    expectFailure(
      await disqualifyDraw({
        ...input,
        drawId: 'missing',
        disqualificationReason: 'Duplicate account'
      }),
      'NOT_FOUND'
    );
  });
});
