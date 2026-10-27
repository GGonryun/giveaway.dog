import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn } from '@giveaway/testing-server/session';
import { expectFailure } from '@giveaway/testing-server/result';
import {
  SWEEPSTAKES_ID,
  TEAM_SLUG
} from '@giveaway/testing-server/fixtures-procedures-sweepstakes-a';
import { teamSweepstakes } from '@giveaway/sweepstakes-access/testing/team-sweepstakes';
import { disqualifyDraw } from '../disqualify-draw';
import { rerollDraw } from '../reroll-draw';
import { rollPrize } from '../roll-prize';
import { rollPrizes } from '../roll-prizes';

const target = { sweepstakesId: SWEEPSTAKES_ID, slug: TEAM_SLUG };

const calls = [
  { name: 'rollPrizes', call: () => rollPrizes(target) },
  {
    name: 'rollPrize',
    call: () => rollPrize({ ...target, prizeId: 'prize-1' })
  },
  {
    name: 'rerollDraw',
    call: () =>
      rerollDraw({
        ...target,
        drawId: 'draw-1',
        disqualificationReason: 'Fake account'
      })
  },
  {
    name: 'disqualifyDraw',
    call: () =>
      disqualifyDraw({
        ...target,
        drawId: 'draw-1',
        disqualificationReason: 'Fake account'
      })
  }
];

describe('a completed sweepstakes', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    signIn();
    prismaMock.sweepstakes.findUnique.mockResolvedValue(
      teamSweepstakes('OWNER', SWEEPSTAKES_ID, 'COMPLETED') as never
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(calls)(
    '$name returns FORBIDDEN and reads or writes no draw',
    async ({ call }) => {
      const result = await call();

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'Completed sweepstakes cannot be modified.'
      );
      expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledTimes(1);
      expect(prismaMock.prizeDraw.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.prizeDraw.create).not.toHaveBeenCalled();
      expect(prismaMock.prizeDraw.createMany).not.toHaveBeenCalled();
      expect(prismaMock.prizeDraw.update).not.toHaveBeenCalled();
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    }
  );
});
