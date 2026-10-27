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
  SWEEPSTAKES_ID,
  TEAM_SLUG
} from '@giveaway/testing-server/fixtures-procedures-sweepstakes-a';
import {
  describeTeamAccess,
  teamSweepstakes,
  teamSweepstakesQuery
} from '@giveaway/sweepstakes-access/testing/team-sweepstakes';
import {
  buildCompletion,
  givenSweepstakesLookups,
  runningSweepstakes,
  sweepstakesTiming,
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
  sweepstakesId: SWEEPSTAKES_ID,
  slug: TEAM_SLUG,
  prizeId: 'prize-1',
  ...overrides
});

const alice = buildCompletion({ id: 'c-alice', userId: 'alice' });
const bob = buildCompletion({ id: 'c-bob', userId: 'bob' });

const givenTeamAccess = (role: Parameters<typeof teamSweepstakes>[0]) => {
  prismaMock.sweepstakes.findUnique.mockResolvedValueOnce(
    teamSweepstakes(role) as never
  );
};

const givenHappyPath = () => {
  givenSweepstakesLookups();
  givenTeamAccess('OWNER');
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
  describeTeamAccess(
    () => rollPrize(input()),
    () => [
      prismaMock.prize.findMany,
      prismaMock.taskCompletion.findMany,
      prismaMock.prizeDraw.createMany
    ]
  );

  describe('when the giveaway has not ended', () => {
    it.each([
      ['running', runningSweepstakes()],
      ['scheduled', sweepstakesTiming(3 * 60 * 60 * 1000)],
      ['draft', sweepstakesTiming(-60 * 60 * 1000, 'DRAFT')]
    ])(
      'returns PRECONDITION_FAILED for a %s giveaway without writing',
      async (_, timing) => {
        signIn();
        givenHappyPath();
        givenSweepstakesLookups({ timing });

        const result = await rollPrize(input());

        expect(expectFailure(result, 'PRECONDITION_FAILED').message).toBe(
          'Winners can only be drawn after the giveaway ends'
        );
        expect(prismaMock.taskCompletion.findMany).not.toHaveBeenCalled();
        expect(prismaMock.prizeDraw.createMany).not.toHaveBeenCalled();
      }
    );
  });

  describe('authorization and validation', () => {
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

    it('loads the sweepstakes through the membership of the caller', async () => {
      signIn();
      givenHappyPath();

      expectOk(await rollPrize(input()));

      expect(prismaMock.sweepstakes.findUnique).toHaveBeenNthCalledWith(
        1,
        teamSweepstakesQuery(TEAM_SLUG)
      );
    });

    it('returns FORBIDDEN to a guest without drawing winners', async () => {
      signIn();
      givenSweepstakesLookups();
      givenTeamAccess('GUEST');

      const result = await rollPrize(input());

      expect(expectFailure(result, 'FORBIDDEN').message).toContain(
        'UPDATE_SWEEPSTAKES'
      );
      expect(prismaMock.prize.findMany).not.toHaveBeenCalled();
      expect(prismaMock.taskCompletion.findMany).not.toHaveBeenCalled();
      expect(prismaMock.prizeDraw.createMany).not.toHaveBeenCalled();
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

    it('expires the giveaway and winners leaderboard cache tags', async () => {
      await rollPrize(input());

      expect(nextCacheMock.revalidateTag).toHaveBeenCalledTimes(2);
      expect(nextCacheMock.revalidateTag).toHaveBeenCalledWith(
        `sweepstakes-${SWEEPSTAKES_ID}`,
        'max'
      );
      expect(nextCacheMock.revalidateTag).toHaveBeenCalledWith(
        'winners-leaderboard',
        'max'
      );
    });
  });
});
