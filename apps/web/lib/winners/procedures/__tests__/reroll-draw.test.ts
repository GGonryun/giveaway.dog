import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rerollDraw } from '../reroll-draw';
import { prismaMock } from '@giveaway/testing-server/prisma';
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
} from '../../__tests__/fixtures-sweepstakes-winners-email';

const ids = vi.hoisted(() => ({ next: 0 }));

vi.mock('nanoid', () => ({
  nanoid: () => {
    ids.next += 1;
    return `new-draw-${ids.next}`;
  }
}));

type Input = Parameters<typeof rerollDraw>[0];

const input = (overrides: Partial<Input> = {}): Input => ({
  sweepstakesId: 'sw-1',
  slug: 'acme',
  drawId: 'draw-1',
  disqualificationReason: ' Fake account ',
  ...overrides
});

const storedDraw = {
  id: 'draw-1',
  prizeId: 'prize-1',
  taskCompletion: { participantId: 'participant-loser' }
};

const loser = buildCompletion({
  id: 'c-loser',
  userId: 'loser',
  participantId: 'participant-loser'
});
const alice = buildCompletion({ id: 'c-alice', userId: 'alice' });
const bob = buildCompletion({ id: 'c-bob', userId: 'bob' });

const givenHappyPath = () => {
  givenSweepstakesLookups();
  prismaMock.prizeDraw.findMany.mockResolvedValue([
    { id: 'draw-1', taskCompletion: { participant: { userId: 'loser' } } }
  ]);
  prismaMock.taskCompletion.findMany.mockResolvedValue([loser, alice, bob]);
  prismaMock.sweepstakesAllocation.findMany.mockResolvedValue([]);
  prismaMock.prizeDraw.findUnique.mockResolvedValue(storedDraw);
};

const createdDraws = () => prismaMock.prizeDraw.createMany.mock.calls[0][0];

beforeEach(() => {
  ids.next = 0;
  vi.spyOn(Math, 'random').mockReturnValue(0);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('rerollDraw', () => {
  describe('authorization and validation', () => {
    it('rejects unauthenticated callers without touching the database', async () => {
      const result = await rerollDraw(input());

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });

    it.each(['sweepstakesId', 'slug', 'drawId', 'disqualificationReason'])(
      'rejects input without %s',
      async (field) => {
        signIn();

        const result = await rerollDraw(omitField(input(), field));

        const { message } = expectFailure(result, 'UNPROCESSABLE_CONTENT');
        expect(inputIssuePaths(message)).toEqual([field]);
        expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
      }
    );

    it('rejects input with a non string draw id', async () => {
      signIn();

      const result = await rerollDraw(
        input({ drawId: 7 as unknown as string })
      );

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });

    it('returns NOT_FOUND when the user is not on the sweepstakes team', async () => {
      signIn();
      givenHappyPath();
      givenSweepstakesLookups({ team: null });

      const result = await rerollDraw(input());

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Sweepstakes not found'
      );
      expect(prismaMock.prizeDraw.update).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN when the member is blocked', async () => {
      signIn();
      givenHappyPath();
      givenSweepstakesLookups({
        team: buildTeamSweepstakes({ role: 'BLOCKED' })
      });

      const result = await rerollDraw(input());

      expectFailure(result, 'FORBIDDEN');
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('when the caller is a view only guest', () => {
    it('still disqualifies and replaces the draw because only view permission is checked', async () => {
      signIn();
      givenHappyPath();
      givenSweepstakesLookups({
        team: buildTeamSweepstakes({ role: 'GUEST' })
      });

      expectOk(await rerollDraw(input()));

      expect(prismaMock.prizeDraw.update).toHaveBeenCalledWith({
        where: { id: 'draw-1' },
        data: { result: 'DISQUALIFIED', disqualificationReason: 'Fake account' }
      });
      expect(createdDraws().data).toHaveLength(1);
    });
  });

  describe('when prerequisites are missing', () => {
    beforeEach(() => {
      signIn();
      givenHappyPath();
    });

    it('returns NOT_FOUND when the criteria are missing', async () => {
      givenSweepstakesLookups({ criteria: null });

      const result = await rerollDraw(input());

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Sweepstakes criteria not found'
      );
      expect(prismaMock.prizeDraw.findMany).not.toHaveBeenCalled();
    });

    it('returns VALIDATION_ERROR when nobody meets the criteria', async () => {
      givenSweepstakesLookups({
        criteria: buildCriteriaRow({ minQualityScore: 101 })
      });

      const result = await rerollDraw(input());

      expect(expectFailure(result, 'VALIDATION_ERROR').message).toBe(
        'No eligible participants meet the criteria'
      );
      expect(prismaMock.prizeDraw.findUnique).not.toHaveBeenCalled();
    });

    it('returns NOT_FOUND when the draw does not exist', async () => {
      prismaMock.prizeDraw.findUnique.mockResolvedValue(null);

      const result = await rerollDraw(input());

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Draw not found');
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('when rerolling a unique winner draw', () => {
    beforeEach(() => {
      signIn();
      givenHappyPath();
    });

    it('returns success', async () => {
      expect(expectOk(await rerollDraw(input()))).toEqual({ success: true });
    });

    it('loads draws and allocations for the input sweepstakes', async () => {
      await rerollDraw(input());

      expect(prismaMock.prizeDraw.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { prize: { sweepstakesId: 'sw-1' } } })
      );
      expect(prismaMock.sweepstakesAllocation.findMany).toHaveBeenCalledWith({
        where: { participant: { sweepstakesId: 'sw-1' } }
      });
    });

    it('looks up the draw with its participant', async () => {
      await rerollDraw(input());

      expect(prismaMock.prizeDraw.findUnique).toHaveBeenCalledWith({
        where: { id: 'draw-1' },
        include: { taskCompletion: { select: { participantId: true } } }
      });
    });

    it('disqualifies the draw with the trimmed reason', async () => {
      await rerollDraw(input());

      expect(prismaMock.prizeDraw.update).toHaveBeenCalledWith({
        where: { id: 'draw-1' },
        data: {
          result: 'DISQUALIFIED',
          disqualificationReason: 'Fake account'
        }
      });
    });

    it('rejects the disqualified participant completions in the input sweepstakes', async () => {
      await rerollDraw(input());

      expect(prismaMock.taskCompletion.updateMany).toHaveBeenCalledWith({
        where: {
          participantId: 'participant-loser',
          task: { sweepstakesId: 'sw-1' },
          status: { not: 'REJECTED' }
        },
        data: {
          status: 'REJECTED',
          reason: 'Participant disqualified: Fake account'
        }
      });
    });

    it('creates a replacement draw for the same prize linked to the previous draw', async () => {
      await rerollDraw(input());

      expect(createdDraws()).toEqual({
        data: [
          {
            id: 'new-draw-1',
            prizeId: 'prize-1',
            result: 'WINNER',
            taskCompletionId: 'c-alice',
            previousDrawId: 'draw-1'
          }
        ]
      });
    });

    it('performs the three writes inside one transaction', async () => {
      await rerollDraw(input());

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(
        prismaMock.prizeDraw.update.mock.invocationCallOrder[0]
      ).toBeLessThan(
        prismaMock.prizeDraw.createMany.mock.invocationCallOrder[0]
      );
    });

    it('uses a default rejection reason when the reason is blank', async () => {
      await rerollDraw(input({ disqualificationReason: '' }));

      expect(prismaMock.taskCompletion.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            status: 'REJECTED',
            reason: 'Participant disqualified: No reason provided'
          }
        })
      );
    });

    it('creates no replacement when every eligible user was already drawn', async () => {
      prismaMock.taskCompletion.findMany.mockResolvedValue([loser]);

      expectOk(await rerollDraw(input()));

      expect(createdDraws()).toEqual({ data: [] });
      expect(prismaMock.prizeDraw.update).toHaveBeenCalled();
    });

    it('only picks participants allocated to the prize when user selection is enabled', async () => {
      givenSweepstakesLookups({
        criteria: buildCriteriaRow({ allowUserSelection: true })
      });
      prismaMock.sweepstakesAllocation.findMany.mockResolvedValue([
        buildAllocation('participant-bob', 'prize-1'),
        buildAllocation('participant-alice', 'prize-2')
      ]);

      await rerollDraw(input());

      expect(
        createdDraws().data.map(
          (d: { taskCompletionId: string }) => d.taskCompletionId
        )
      ).toEqual(['c-bob']);
    });
  });

  describe('when multiple wins are allowed', () => {
    beforeEach(() => {
      signIn();
      givenHappyPath();
      givenSweepstakesLookups({
        criteria: buildCriteriaRow({ allowMultipleWins: true })
      });
    });

    it('can pick the disqualified participant again as the replacement', async () => {
      await rerollDraw(input());

      expect(createdDraws()).toEqual({
        data: [
          {
            id: 'new-draw-1',
            prizeId: 'prize-1',
            result: 'WINNER',
            taskCompletionId: 'c-loser',
            previousDrawId: 'draw-1'
          }
        ]
      });
    });
  });
});
