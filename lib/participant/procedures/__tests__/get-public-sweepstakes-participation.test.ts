import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getPublicSweepstakesParticipation } from '../get-public-sweepstakes-participation';
import { prismaMock } from '@/test/prisma';
import { createSession, signIn, TEST_USER, authMock } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';

const NOW = new Date('2026-06-01T12:00:00.000Z');

const participation = (
  sweepstakesId: string,
  completedTaskIds: string[],
  taskCount: number
) => ({
  sweepstakesId,
  taskCompletions: completedTaskIds.map((taskId, i) => ({
    id: `${sweepstakesId}-tc-${i}`,
    taskId
  })),
  sweepstakes: {
    id: sweepstakesId,
    tasks: Array.from({ length: taskCount }, (_, i) => ({ id: `t-${i}` }))
  }
});

describe('getPublicSweepstakesParticipation', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when the caller is not signed in', () => {
    it('returns an empty map without querying', async () => {
      const result = await getPublicSweepstakesParticipation();

      expect(expectOk(result)).toEqual({});
      expect(prismaMock.sweepstakesParticipant.findMany).not.toHaveBeenCalled();
    });

    it('treats an expired session as signed out', async () => {
      authMock.mockResolvedValue(createSession({}, '2026-05-01T00:00:00.000Z'));

      const result = await getPublicSweepstakesParticipation();

      expect(expectOk(result)).toEqual({});
      expect(prismaMock.sweepstakesParticipant.findMany).not.toHaveBeenCalled();
    });
  });

  describe('when the caller is signed in', () => {
    beforeEach(() => {
      signIn();
    });

    it('queries participation in active public sweepstakes that are running now', async () => {
      prismaMock.sweepstakesParticipant.findMany.mockResolvedValue([]);

      await getPublicSweepstakesParticipation();

      expect(prismaMock.sweepstakesParticipant.findMany).toHaveBeenCalledWith({
        where: {
          userId: TEST_USER.id,
          sweepstakes: {
            status: 'ACTIVE',
            visibility: { visibility: 'PUBLIC' },
            timing: {
              startDate: { lte: NOW },
              endDate: { gte: NOW }
            }
          }
        },
        include: {
          taskCompletions: true,
          sweepstakes: { include: { tasks: true } }
        }
      });
    });

    it('returns an empty map when the user has no participation', async () => {
      prismaMock.sweepstakesParticipant.findMany.mockResolvedValue([]);

      const result = await getPublicSweepstakesParticipation();

      expect(expectOk(result)).toEqual({});
    });

    it('summarizes unique completed tasks against the task count per sweepstakes', async () => {
      prismaMock.sweepstakesParticipant.findMany.mockResolvedValue([
        participation('sweep-1', ['t-0', 't-1', 't-0'], 4),
        participation('sweep-2', [], 0)
      ]);

      const result = await getPublicSweepstakesParticipation();

      expect(expectOk(result)).toEqual({
        'sweep-1': { sweepstakesId: 'sweep-1', completed: 2, maximum: 4 },
        'sweep-2': { sweepstakesId: 'sweep-2', completed: 0, maximum: 0 }
      });
    });

    it('returns a failure when the query throws', async () => {
      prismaMock.sweepstakesParticipant.findMany.mockRejectedValue(
        new Error('db down')
      );

      const result = await getPublicSweepstakesParticipation();

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'db down'
      );
    });
  });
});
