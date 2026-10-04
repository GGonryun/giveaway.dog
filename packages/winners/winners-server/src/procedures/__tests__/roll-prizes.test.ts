import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rollPrizes } from '../roll-prizes';
import { knownRequestError, prismaMock } from '@giveaway/testing-server/prisma';
import { signIn } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
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

type Input = Parameters<typeof rollPrizes>[0];

const input = (overrides: Partial<Input> = {}): Input => ({
  sweepstakesId: 'sw-1',
  slug: 'acme',
  ...overrides
});

const alice = buildCompletion({ id: 'c-alice', userId: 'alice' });
const bob = buildCompletion({ id: 'c-bob', userId: 'bob' });
const carol = buildCompletion({ id: 'c-carol', userId: 'carol' });

const givenHappyPath = () => {
  givenSweepstakesLookups();
  prismaMock.prize.findMany.mockResolvedValue([
    { id: 'prize-1', quota: 1, draws: [] },
    { id: 'prize-2', quota: null, draws: [] }
  ]);
  prismaMock.prizeDraw.findMany.mockResolvedValue([]);
  prismaMock.sweepstakesAllocation.findMany.mockResolvedValue([]);
  prismaMock.taskCompletion.findMany.mockResolvedValue([alice, bob, carol]);
};

const createdDraws = () =>
  prismaMock.prizeDraw.createMany.mock.calls[0][0].data.map(
    (d: { prizeId: string; taskCompletionId: string }) => [
      d.prizeId,
      d.taskCompletionId
    ]
  );

beforeEach(() => {
  ids.next = 0;
  vi.spyOn(Math, 'random').mockReturnValue(0);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('rollPrizes', () => {
  describe('authorization and validation', () => {
    it('rejects unauthenticated callers without touching the database', async () => {
      const result = await rollPrizes(input());

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });

    it.each(['sweepstakesId', 'slug'])(
      'rejects input without %s',
      async (field) => {
        signIn();

        const result = await rollPrizes(omitField(input(), field));

        const { message } = expectFailure(result, 'UNPROCESSABLE_CONTENT');
        expect(inputIssuePaths(message)).toEqual([field]);
        expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
      }
    );

    it('returns FORBIDDEN when the member role cannot view sweepstakes', async () => {
      signIn();
      givenHappyPath();
      givenSweepstakesLookups({
        team: buildTeamSweepstakes({ role: 'BLOCKED' })
      });

      const result = await rollPrizes(input());

      expectFailure(result, 'FORBIDDEN');
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

      expectOk(await rollPrizes(input()));

      expect(createdDraws()).toEqual([
        ['prize-1', 'c-alice'],
        ['prize-2', 'c-bob']
      ]);
    });
  });

  describe('when prerequisites fail', () => {
    beforeEach(() => {
      signIn();
      givenHappyPath();
    });

    it('returns NOT_FOUND when the criteria are missing', async () => {
      givenSweepstakesLookups({ criteria: null });

      const result = await rollPrizes(input());

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Sweepstakes criteria not found'
      );
    });

    it('returns VALIDATION_ERROR when the sweepstakes has no prizes', async () => {
      prismaMock.prize.findMany.mockResolvedValue([]);

      const result = await rollPrizes(input());

      expect(expectFailure(result, 'VALIDATION_ERROR').message).toBe(
        'No prizes found for this sweepstakes'
      );
    });

    it('returns CONFLICT when every prize is already filled', async () => {
      prismaMock.prize.findMany.mockResolvedValue([
        { id: 'prize-1', quota: 1, draws: [{ result: 'WINNER' }] }
      ]);

      const result = await rollPrizes(input());

      expect(expectFailure(result, 'CONFLICT').message).toBe(
        'All prize slots are already filled'
      );
      expect(prismaMock.taskCompletion.findMany).not.toHaveBeenCalled();
    });

    it('returns VALIDATION_ERROR when nobody meets the criteria', async () => {
      givenSweepstakesLookups({
        criteria: buildCriteriaRow({ minTasksCompleted: 2 })
      });

      const result = await rollPrizes(input());

      expect(expectFailure(result, 'VALIDATION_ERROR').message).toBe(
        'No eligible participants meet the criteria'
      );
      expect(prismaMock.prizeDraw.createMany).not.toHaveBeenCalled();
    });

    it('maps a prisma known request error on insert to INTERNAL_SERVER_ERROR', async () => {
      prismaMock.prizeDraw.createMany.mockRejectedValue(
        knownRequestError('P2002')
      );

      const result = await rollPrizes(input());

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toMatch(
        /provide the following error code: new-draw-\d+$/
      );
    });
  });

  describe('when rolling all prizes', () => {
    beforeEach(() => {
      signIn();
      givenHappyPath();
    });

    it('returns success', async () => {
      expect(expectOk(await rollPrizes(input()))).toEqual({ success: true });
    });

    it('loads slots for every prize of the sweepstakes', async () => {
      await rollPrizes(input());

      expect(prismaMock.prize.findMany).toHaveBeenCalledWith({
        where: { sweepstakesId: 'sw-1' },
        include: { draws: true },
        orderBy: { index: 'asc' }
      });
    });

    it('creates one unique winner per empty slot in prize order', async () => {
      await rollPrizes(input());

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
            prizeId: 'prize-2',
            result: 'WINNER',
            taskCompletionId: 'c-bob'
          }
        ]
      });
    });

    it('leaves slots empty when there are fewer unique users than slots', async () => {
      prismaMock.taskCompletion.findMany.mockResolvedValue([alice]);

      expectOk(await rollPrizes(input()));

      expect(createdDraws()).toEqual([['prize-1', 'c-alice']]);
    });

    it('excludes previously drawn users including disqualified ones', async () => {
      prismaMock.prizeDraw.findMany.mockResolvedValue([
        { id: 'old', taskCompletion: { participant: { userId: 'alice' } } }
      ]);

      await rollPrizes(input());

      expect(createdDraws()).toEqual([
        ['prize-1', 'c-bob'],
        ['prize-2', 'c-carol']
      ]);
    });

    it('lets one user win every slot when multiple wins are allowed', async () => {
      givenSweepstakesLookups({
        criteria: buildCriteriaRow({ allowMultipleWins: true })
      });

      await rollPrizes(input());

      expect(createdDraws()).toEqual([
        ['prize-1', 'c-alice'],
        ['prize-2', 'c-alice']
      ]);
    });

    it('matches participants to the prize they selected when user selection is enabled', async () => {
      givenSweepstakesLookups({
        criteria: buildCriteriaRow({ allowUserSelection: true })
      });
      prismaMock.sweepstakesAllocation.findMany.mockResolvedValue([
        buildAllocation('participant-carol', 'prize-1'),
        buildAllocation('participant-bob', 'prize-2')
      ]);

      await rollPrizes(input());

      expect(createdDraws()).toEqual([
        ['prize-1', 'c-carol'],
        ['prize-2', 'c-bob']
      ]);
    });
  });
});
