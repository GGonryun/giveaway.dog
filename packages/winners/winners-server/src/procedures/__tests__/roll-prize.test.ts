import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rollPrize } from '../roll-prize';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { nextCacheMock } from '@giveaway/testing-server/next-cache';
import {
  buildAllocation,
  buildCriteriaRow
} from '@giveaway/winners-model/testing/fixtures-winners-model';
import {
  buildCompletion,
  buildTeamSweepstakes,
  givenSweepstakesLookups,
  inputIssuePaths,
  omitField
} from '../../testing/fixtures-sweepstakes-winners-email';

const ids = vi.hoisted(() => ({ next: 0 }));

vi.mock('nanoid', () => ({
  nanoid: () => {
    ids.next += 1;
    return `new-draw-${ids.next}`;
  }
}));

type Input = Parameters<typeof rollPrize>[0];

const input = (overrides: Partial<Input> = {}): Input => ({
  sweepstakesId: 'sw-1',
  slug: 'acme',
  prizeId: 'prize-1',
  ...overrides
});

const alice = buildCompletion({ id: 'c-alice', userId: 'alice' });
const bob = buildCompletion({ id: 'c-bob', userId: 'bob' });

const givenHappyPath = () => {
  givenSweepstakesLookups();
  prismaMock.prize.findMany.mockResolvedValue([
    { id: 'prize-1', quota: 2, draws: [] }
  ]);
  prismaMock.prizeDraw.findMany.mockResolvedValue([]);
  prismaMock.taskCompletion.findMany.mockResolvedValue([alice, bob]);
  prismaMock.sweepstakesAllocation.findMany.mockResolvedValue([]);
};

const createdTaskCompletionIds = () =>
  prismaMock.prizeDraw.createMany.mock.calls[0][0].data.map(
    (d: { taskCompletionId: string }) => d.taskCompletionId
  );

beforeEach(() => {
  ids.next = 0;
  vi.spyOn(Math, 'random').mockReturnValue(0);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('rollPrize', () => {
  describe('authorization and validation', () => {
    it('rejects unauthenticated callers without touching the database', async () => {
      const result = await rollPrize(input());

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });

    it.each(['sweepstakesId', 'slug', 'prizeId'])(
      'rejects input without %s',
      async (field) => {
        signIn();

        const result = await rollPrize(omitField(input(), field));

        const { message } = expectFailure(result, 'UNPROCESSABLE_CONTENT');
        expect(inputIssuePaths(message)).toEqual([field]);
        expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
      }
    );

    it('returns FORBIDDEN when the caller is not a member of the team', async () => {
      signIn();
      givenHappyPath();
      givenSweepstakesLookups({
        team: buildTeamSweepstakes({ userId: 'someone-else' })
      });

      const result = await rollPrize(input());

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'You are not a member of this team'
      );
      expect(prismaMock.prizeDraw.createMany).not.toHaveBeenCalled();
    });
  });

  describe('when the caller is a view only guest', () => {
    it('still draws winners because only view permission is checked', async () => {
      signIn();
      givenHappyPath();
      givenSweepstakesLookups({
        team: buildTeamSweepstakes({ role: 'GUEST' })
      });

      expectOk(await rollPrize(input()));

      expect(createdTaskCompletionIds()).toEqual(['c-alice', 'c-bob']);
    });
  });

  describe('when prerequisites fail', () => {
    beforeEach(() => {
      signIn();
      givenHappyPath();
    });

    it('returns NOT_FOUND when the criteria are missing', async () => {
      givenSweepstakesLookups({ criteria: null });

      const result = await rollPrize(input());

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Sweepstakes criteria not found'
      );
      expect(prismaMock.prize.findMany).not.toHaveBeenCalled();
    });

    it('returns VALIDATION_ERROR when the prize does not exist', async () => {
      prismaMock.prize.findMany.mockResolvedValue([]);

      const result = await rollPrize(input());

      expect(expectFailure(result, 'VALIDATION_ERROR').message).toBe(
        'No prizes found for this sweepstakes'
      );
      expect(prismaMock.prizeDraw.findMany).not.toHaveBeenCalled();
    });

    it('returns CONFLICT when the prize is already filled', async () => {
      prismaMock.prize.findMany.mockResolvedValue([
        { id: 'prize-1', quota: 1, draws: [{ result: 'WINNER' }] }
      ]);

      const result = await rollPrize(input());

      expect(expectFailure(result, 'CONFLICT').message).toBe(
        'All prize slots are already filled'
      );
      expect(prismaMock.prizeDraw.createMany).not.toHaveBeenCalled();
    });

    it('returns VALIDATION_ERROR when nobody is eligible', async () => {
      prismaMock.taskCompletion.findMany.mockResolvedValue([]);

      const result = await rollPrize(input());

      expect(expectFailure(result, 'VALIDATION_ERROR').message).toBe(
        'No eligible participants meet the criteria'
      );
      expect(prismaMock.sweepstakesAllocation.findMany).not.toHaveBeenCalled();
      expect(prismaMock.prizeDraw.createMany).not.toHaveBeenCalled();
    });
  });

  describe('when rolling a prize', () => {
    beforeEach(() => {
      signIn();
      givenHappyPath();
    });

    it('returns success', async () => {
      expect(expectOk(await rollPrize(input()))).toEqual({ success: true });
    });

    it('only loads slots for the requested prize', async () => {
      await rollPrize(input());

      expect(prismaMock.prize.findMany).toHaveBeenCalledWith({
        where: { sweepstakesId: 'sw-1', id: 'prize-1' },
        include: { draws: true },
        orderBy: { index: 'asc' }
      });
    });

    it('creates one unique winner per empty slot', async () => {
      await rollPrize(input());

      expect(prismaMock.prizeDraw.createMany).toHaveBeenCalledWith({
        data: [
          {
            id: 'new-draw-1',
            prizeId: 'prize-1',
            result: 'WINNER',
            taskCompletionId: 'c-alice'
          },
          {
            id: 'new-draw-2',
            prizeId: 'prize-1',
            result: 'WINNER',
            taskCompletionId: 'c-bob'
          }
        ]
      });
    });

    it('skips users that already have a draw in the sweepstakes', async () => {
      prismaMock.prizeDraw.findMany.mockResolvedValue([
        { id: 'old', taskCompletion: { participant: { userId: 'alice' } } }
      ]);

      await rollPrize(input());

      expect(createdTaskCompletionIds()).toEqual(['c-bob']);
    });

    it('allows the same user to fill every slot when multiple wins are allowed', async () => {
      givenSweepstakesLookups({
        criteria: buildCriteriaRow({ allowMultipleWins: true })
      });

      await rollPrize(input());

      expect(createdTaskCompletionIds()).toEqual(['c-alice', 'c-alice']);
    });

    it('only picks allocated participants when user selection is enabled', async () => {
      givenSweepstakesLookups({
        criteria: buildCriteriaRow({ allowUserSelection: true })
      });
      prismaMock.sweepstakesAllocation.findMany.mockResolvedValue([
        buildAllocation('participant-bob', 'prize-1')
      ]);

      await rollPrize(input());

      expect(createdTaskCompletionIds()).toEqual(['c-bob']);
    });

    it('does not revalidate any cache tags', async () => {
      await rollPrize(input());

      expect(nextCacheMock.revalidateTag).not.toHaveBeenCalled();
    });
  });
});
