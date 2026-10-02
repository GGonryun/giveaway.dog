import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { disqualifyDraw } from '../disqualify-draw';
import { knownRequestError, prismaMock } from '@giveaway/testing-server/prisma';
import { signIn } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { nextCacheMock } from '@giveaway/testing-server/next-cache';
import { buildCriteriaRow } from '../../__tests__/fixtures-winners-model';
import {
  givenSweepstakesLookups,
  inputIssuePaths,
  omitField
} from '../../__tests__/fixtures-sweepstakes-winners-email';

type Input = Parameters<typeof disqualifyDraw>[0];

const input = (overrides: Partial<Input> = {}): Input => ({
  sweepstakesId: 'sw-1',
  slug: 'acme',
  drawId: 'draw-1',
  disqualificationReason: '  Used a bot  ',
  ...overrides
});

const storedDraw = (taskSweepstakesId = 'sw-1') => ({
  id: 'draw-1',
  prizeId: 'prize-1',
  taskCompletion: {
    participantId: 'participant-9',
    task: { sweepstakesId: taskSweepstakesId }
  }
});

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('disqualifyDraw', () => {
  describe('authorization and validation', () => {
    it('rejects unauthenticated callers without touching the database', async () => {
      const result = await disqualifyDraw(input());

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });

    it.each(['sweepstakesId', 'slug', 'drawId', 'disqualificationReason'])(
      'rejects input without %s',
      async (field) => {
        signIn();

        const result = await disqualifyDraw(omitField(input(), field));

        const { message } = expectFailure(result, 'UNPROCESSABLE_CONTENT');
        expect(message).toMatch(/^Input validation failed: /);
        expect(inputIssuePaths(message)).toEqual([field]);
        expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
      }
    );

    it('does not check team membership for the sweepstakes', async () => {
      signIn();
      givenSweepstakesLookups();
      prismaMock.prizeDraw.findUnique.mockResolvedValue(storedDraw());

      expectOk(await disqualifyDraw(input()));

      expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledTimes(1);
      expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
        where: { id: 'sw-1' },
        include: { criteria: true }
      });
    });
  });

  describe('when the sweepstakes criteria are missing', () => {
    it('returns NOT_FOUND and does not look up the draw', async () => {
      signIn();
      givenSweepstakesLookups({ criteria: null });

      const result = await disqualifyDraw(input());

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Sweepstakes criteria not found'
      );
      expect(prismaMock.prizeDraw.findUnique).not.toHaveBeenCalled();
    });

    it('returns INTERNAL_SERVER_ERROR when the stored criteria are invalid', async () => {
      signIn();
      givenSweepstakesLookups({
        criteria: buildCriteriaRow({ minTasksCompleted: null })
      });

      const result = await disqualifyDraw(input());

      expectFailure(result, 'INTERNAL_SERVER_ERROR');
      expect(prismaMock.prizeDraw.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when the draw does not exist', () => {
    it('returns NOT_FOUND without writing', async () => {
      signIn();
      givenSweepstakesLookups();
      prismaMock.prizeDraw.findUnique.mockResolvedValue(null);

      const result = await disqualifyDraw(input());

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Draw not found');
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
      expect(prismaMock.prizeDraw.update).not.toHaveBeenCalled();
    });
  });

  describe('when the draw exists', () => {
    beforeEach(() => {
      signIn();
      givenSweepstakesLookups();
      prismaMock.prizeDraw.findUnique.mockResolvedValue(storedDraw());
    });

    it('looks up the draw with its participant and task sweepstakes', async () => {
      await disqualifyDraw(input());

      expect(prismaMock.prizeDraw.findUnique).toHaveBeenCalledWith({
        where: { id: 'draw-1' },
        include: {
          taskCompletion: {
            select: {
              participantId: true,
              task: { select: { sweepstakesId: true } }
            }
          }
        }
      });
    });

    it('returns success', async () => {
      expect(expectOk(await disqualifyDraw(input()))).toEqual({
        success: true
      });
    });

    it('marks the draw disqualified with the trimmed reason inside a transaction', async () => {
      await disqualifyDraw(input());

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(prismaMock.prizeDraw.update).toHaveBeenCalledWith({
        where: { id: 'draw-1' },
        data: {
          result: 'DISQUALIFIED',
          disqualificationReason: 'Used a bot'
        }
      });
    });

    it('rejects all non rejected completions of the participant in the sweepstakes', async () => {
      await disqualifyDraw(input());

      expect(prismaMock.taskCompletion.updateMany).toHaveBeenCalledWith({
        where: {
          participantId: 'participant-9',
          task: { sweepstakesId: 'sw-1' },
          status: { not: 'REJECTED' }
        },
        data: {
          status: 'REJECTED',
          reason: 'Participant disqualified: Used a bot'
        }
      });
    });

    it('uses a default rejection reason when the reason is blank', async () => {
      await disqualifyDraw(input({ disqualificationReason: '   ' }));

      expect(prismaMock.prizeDraw.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { result: 'DISQUALIFIED', disqualificationReason: '' }
        })
      );
      expect(prismaMock.taskCompletion.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            status: 'REJECTED',
            reason: 'Participant disqualified: No reason provided'
          }
        })
      );
    });

    it('scopes the completion rejection to the draw task sweepstakes rather than the input', async () => {
      prismaMock.prizeDraw.findUnique.mockResolvedValue(
        storedDraw('other-sweepstakes')
      );

      expectOk(await disqualifyDraw(input()));

      expect(prismaMock.taskCompletion.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            task: { sweepstakesId: 'other-sweepstakes' }
          })
        })
      );
    });

    it('does not revalidate any cache tags', async () => {
      await disqualifyDraw(input());

      expect(nextCacheMock.revalidateTag).not.toHaveBeenCalled();
    });

    it('maps a missing draw during the update to NOT_FOUND', async () => {
      prismaMock.prizeDraw.update.mockRejectedValue(knownRequestError('P2025'));

      const result = await disqualifyDraw(input());

      expectFailure(result, 'NOT_FOUND');
      expect(prismaMock.taskCompletion.updateMany).not.toHaveBeenCalled();
    });

    it('returns INTERNAL_SERVER_ERROR when the completion update fails unexpectedly', async () => {
      prismaMock.taskCompletion.updateMany.mockRejectedValue(
        new Error('deadlock')
      );

      const result = await disqualifyDraw(input());

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'deadlock'
      );
    });
  });
});
