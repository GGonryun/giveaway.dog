import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ZodError } from 'zod';
import { processTwitterTaskJob } from '../process-twitter-task-job';
import { ApplicationError } from '@/lib/errors';
import type { Prisma } from '@prisma/client';
import type { TwitterUserSchema } from '@/lib/integrations/schemas/api';
import { prismaMock, asPrismaClient } from '@/test/prisma';
import {
  buildTaskJob,
  taskOf
} from '@/lib/task/procedures/__tests__/fixtures-task-procedures-verification';

const m = vi.hoisted(() => ({
  importTwitterUsers: vi.fn()
}));

vi.mock('@/lib/sweepstakes/twitter-import', () => ({
  importTwitterUsers: m.importTwitterUsers
}));

const NOW = new Date('2026-10-01T12:00:00.000Z');
const MINUTE = 60 * 1000;
const db = asPrismaClient(prismaMock);
const likeTask = taskOf('TWITTER_LIKE_IMPORT');
const retweetTask = taskOf('TWITTER_RETWEET_IMPORT');

const twitterUser = (id: string): TwitterUserSchema => ({
  id,
  name: `User ${id}`,
  username: `user_${id}`
});

const imported = (userId: string) => ({
  userId,
  twitterUserId: `tw-${userId}`,
  twitterUsername: `name_${userId}`,
  twitterVerified: true
});

const jobWith = (data: Prisma.JsonValue) =>
  buildTaskJob({ type: 'TWITTER_LIKE_IMPORT', data });

const actionReturning = (data?: TwitterUserSchema[]) =>
  vi.fn().mockResolvedValue({ data });

const importResult = (
  importedUsers: ReturnType<typeof imported>[] = [],
  existingUsers: ReturnType<typeof imported>[] = []
) =>
  m.importTwitterUsers.mockResolvedValue({
    imported: importedUsers,
    existing: existingUsers
  });

const captureError = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected the promise to reject');
};

describe('processTwitterTaskJob', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    m.importTwitterUsers.mockReset();
    importResult();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when the job data is invalid', () => {
    it.each([
      ['missing', null],
      ['without runs', {}],
      ['with negative runs', { runs: -1 }],
      ['with a numeric checkpoint', { runs: 0, lastProcessedId: 7 }]
    ])(
      'throws INTERNAL_SERVER_ERROR when the data is %s',
      async (_label, data) => {
        const action = actionReturning([]);

        const error = await captureError(
          processTwitterTaskJob(db, likeTask, jobWith(data), action)
        );

        expect(error).toBeInstanceOf(ApplicationError);
        expect(error).toMatchObject({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Invalid task job data for Twitter import task',
          data: likeTask
        });
        expect((error as ApplicationError).cause).toBeInstanceOf(ZodError);
        expect(action).not.toHaveBeenCalled();
      }
    );
  });

  describe('fetching users', () => {
    it('runs the action with the database client', async () => {
      const action = actionReturning([]);

      await processTwitterTaskJob(
        db,
        retweetTask,
        jobWith({ runs: 0 }),
        action
      );

      expect(action).toHaveBeenCalledWith(db);
    });

    it('propagates errors from the action without importing', async () => {
      const failure = new Error('rate limited');
      const action = vi.fn().mockRejectedValue(failure);

      await expect(
        processTwitterTaskJob(db, likeTask, jobWith({ runs: 0 }), action)
      ).rejects.toBe(failure);
      expect(m.importTwitterUsers).not.toHaveBeenCalled();
    });

    it('imports only the users newer than the last processed user', async () => {
      const action = actionReturning([
        twitterUser('u3'),
        twitterUser('u2'),
        twitterUser('u1')
      ]);

      await processTwitterTaskJob(
        db,
        likeTask,
        jobWith({ runs: 1, lastProcessedId: 'u2' }),
        action
      );

      expect(m.importTwitterUsers).toHaveBeenCalledWith(db, {
        sweepstakesId: 'sweep-1',
        taskId: 'task-1',
        twitterUsers: [twitterUser('u3')]
      });
    });

    it('imports every user when the last processed user is not in the response', async () => {
      const action = actionReturning([twitterUser('u3'), twitterUser('u2')]);

      await processTwitterTaskJob(
        db,
        likeTask,
        jobWith({ runs: 1, lastProcessedId: 'gone' }),
        action
      );

      expect(m.importTwitterUsers).toHaveBeenCalledWith(db, {
        sweepstakesId: 'sweep-1',
        taskId: 'task-1',
        twitterUsers: [twitterUser('u3'), twitterUser('u2')]
      });
    });

    it('imports no users when the response has no data', async () => {
      const action = actionReturning(undefined);

      await processTwitterTaskJob(db, likeTask, jobWith({ runs: 1 }), action);

      expect(m.importTwitterUsers).toHaveBeenCalledWith(db, {
        sweepstakesId: 'sweep-1',
        taskId: 'task-1',
        twitterUsers: []
      });
    });
  });

  describe('recording task completions', () => {
    const action = () => actionReturning([twitterUser('u1')]);

    it('looks up an existing completed or pending completion for each user', async () => {
      importResult([imported('a')], [imported('b')]);
      prismaMock.taskCompletion.findFirst.mockResolvedValue(null);

      await processTwitterTaskJob(db, likeTask, jobWith({ runs: 0 }), action());

      expect(prismaMock.taskCompletion.findFirst).toHaveBeenNthCalledWith(1, {
        where: {
          participant: { userId: 'a' },
          taskId: 'task-1',
          status: { in: ['COMPLETED', 'PENDING'] }
        }
      });
      expect(prismaMock.taskCompletion.findFirst).toHaveBeenNthCalledWith(2, {
        where: {
          participant: { userId: 'b' },
          taskId: 'task-1',
          status: { in: ['COMPLETED', 'PENDING'] }
        }
      });
    });

    it('creates a completed completion with an import proof for new participants', async () => {
      importResult([], [imported('b')]);
      prismaMock.taskCompletion.findFirst.mockResolvedValue(null);

      await processTwitterTaskJob(db, likeTask, jobWith({ runs: 0 }), action());

      expect(prismaMock.taskCompletion.create).toHaveBeenCalledWith({
        data: {
          participant: {
            connectOrCreate: {
              where: {
                userId_sweepstakesId: { sweepstakesId: 'sweep-1', userId: 'b' }
              },
              create: { sweepstakesId: 'sweep-1', userId: 'b' }
            }
          },
          task: { connect: { id: 'task-1' } },
          status: 'COMPLETED',
          proof: {
            source: 'twitter_import',
            twitterUserId: 'tw-b',
            twitterUsername: 'name_b',
            twitterVerified: true,
            importedAt: NOW.toISOString(),
            validatedBy: 'job_processor'
          }
        }
      });
    });

    it('schedules the prize allocation job when a completion is created', async () => {
      importResult([imported('a')]);
      prismaMock.taskCompletion.findFirst.mockResolvedValue(null);

      await processTwitterTaskJob(db, likeTask, jobWith({ runs: 0 }), action());

      expect(prismaMock.sweepstakesJob.upsert).toHaveBeenCalledTimes(1);
      expect(prismaMock.sweepstakesJob.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            sweepstakesId_type: {
              sweepstakesId: 'sweep-1',
              type: 'RANDOMLY_ASSIGN_PRIZES'
            }
          }
        })
      );
    });

    it('marks a pending completion as completed with the import proof', async () => {
      importResult([imported('a')]);
      prismaMock.taskCompletion.findFirst.mockResolvedValue({
        id: 'completion-1',
        status: 'PENDING'
      });

      await processTwitterTaskJob(db, likeTask, jobWith({ runs: 0 }), action());

      expect(prismaMock.taskCompletion.update).toHaveBeenCalledWith({
        where: { id: 'completion-1' },
        data: {
          status: 'COMPLETED',
          proof: {
            source: 'twitter_import',
            twitterUserId: 'tw-a',
            twitterUsername: 'name_a',
            twitterVerified: true,
            importedAt: NOW.toISOString(),
            validatedBy: 'job_processor'
          }
        }
      });
      expect(prismaMock.taskCompletion.create).not.toHaveBeenCalled();
      expect(prismaMock.sweepstakesJob.upsert).not.toHaveBeenCalled();
    });

    it('leaves an already completed completion untouched', async () => {
      importResult([imported('a')]);
      prismaMock.taskCompletion.findFirst.mockResolvedValue({
        id: 'completion-1',
        status: 'COMPLETED'
      });

      await processTwitterTaskJob(db, likeTask, jobWith({ runs: 0 }), action());

      expect(prismaMock.taskCompletion.update).not.toHaveBeenCalled();
      expect(prismaMock.taskCompletion.create).not.toHaveBeenCalled();
      expect(prismaMock.sweepstakesJob.upsert).not.toHaveBeenCalled();
    });
  });

  describe('scheduling the next job', () => {
    it.each([
      [0, 15],
      [1, 20],
      [10, 65]
    ])(
      'schedules the run after run %i in %i minutes',
      async (runs, expectedMinutes) => {
        const action = actionReturning([twitterUser('u2'), twitterUser('u1')]);

        await processTwitterTaskJob(db, likeTask, jobWith({ runs }), action);

        expect(prismaMock.taskJob.create).toHaveBeenCalledWith({
          data: {
            taskId: 'task-1',
            status: 'PENDING',
            runAt: new Date(NOW.getTime() + expectedMinutes * MINUTE),
            data: { runs: runs + 1, lastProcessedId: 'u2' }
          }
        });
      }
    );

    it('checkpoints the newest user even when it was already processed', async () => {
      const action = actionReturning([twitterUser('u1')]);

      await processTwitterTaskJob(
        db,
        likeTask,
        jobWith({ runs: 1, lastProcessedId: 'u1' }),
        action
      );

      expect(m.importTwitterUsers).toHaveBeenCalledWith(
        db,
        expect.objectContaining({ twitterUsers: [] })
      );
      expect(prismaMock.taskJob.create).toHaveBeenCalledWith({
        data: {
          taskId: 'task-1',
          status: 'PENDING',
          runAt: new Date(NOW.getTime() + 20 * MINUTE),
          data: { runs: 2, lastProcessedId: 'u1' }
        }
      });
    });

    it('clears the checkpoint when the response has no data', async () => {
      const action = actionReturning(undefined);

      await processTwitterTaskJob(
        db,
        likeTask,
        jobWith({ runs: 1, lastProcessedId: 'u1' }),
        action
      );

      expect(prismaMock.taskJob.create).toHaveBeenCalledWith({
        data: {
          taskId: 'task-1',
          status: 'PENDING',
          runAt: new Date(NOW.getTime() + 20 * MINUTE),
          data: { runs: 2, lastProcessedId: undefined }
        }
      });
    });

    it('resolves to undefined', async () => {
      await expect(
        processTwitterTaskJob(
          db,
          likeTask,
          jobWith({ runs: 0 }),
          actionReturning([])
        )
      ).resolves.toBeUndefined();
    });
  });
});
