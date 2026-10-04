import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ZodError } from 'zod';
import type { User } from 'scrapebadger';
import { processRetweetV2TaskJob } from '../process-retweet-v2-task-job';
import { ApplicationError } from '@giveaway/util-errors';
import type { Prisma } from '@prisma/client';
import type { TwitterRetweetV2TaskSchema } from '@/lib/task/schemas';
import { prismaMock, asPrismaClient } from '@giveaway/testing-server/prisma';
import {
  buildTaskJob,
  buildTiming,
  taskOf
} from '@/lib/task/procedures/__tests__/fixtures-task-procedures-verification';

const m = vi.hoisted(() => ({
  getRetweetersUntilUser: vi.fn(),
  importTwitterUsers: vi.fn()
}));

vi.mock('@/lib/scrapebadger/procedures/get-retweeters', () => ({
  getRetweeters: vi.fn(),
  getRetweetersUntil: vi.fn(),
  getRetweetersUntilUser: m.getRetweetersUntilUser,
  getAllRetweeters: vi.fn()
}));

vi.mock('@giveaway/x-import/twitter-import', () => ({
  importTwitterUsers: m.importTwitterUsers
}));

const NOW = new Date('2026-10-01T12:00:00.000Z');
const MINUTE = 60 * 1000;
const db = asPrismaClient(prismaMock);
const task = taskOf('TWITTER_RETWEET_IMPORT_V2');

const scrapeUser = (id: string, overrides: Partial<User> = {}): User => ({
  id,
  username: `user_${id}`,
  name: `User ${id}`,
  followers_count: 10,
  following_count: 5,
  tweet_count: 100,
  listed_count: 0,
  verified: false,
  ...overrides
});

const imported = (userId: string, twitterUserId = `tw-${userId}`) => ({
  userId,
  twitterUserId,
  twitterUsername: `name_${userId}`,
  twitterVerified: false
});

const jobWith = (
  data: Prisma.JsonValue,
  timing: ReturnType<typeof buildTiming> | null = null
) => buildTaskJob({ type: 'TWITTER_RETWEET_IMPORT_V2', data, timing });

const respond = (response: {
  users?: User[];
  nextCursor?: string;
  hasMore: boolean;
}) => m.getRetweetersUntilUser.mockResolvedValue(response);

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

describe('processRetweetV2TaskJob', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    m.getRetweetersUntilUser.mockReset();
    m.importTwitterUsers.mockReset();
    importResult();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when the job data is invalid', () => {
    it.each([
      ['missing', null],
      ['without runs', { lastProcessedId: 'u1' }],
      ['with negative runs', { runs: -1 }],
      ['with a numeric cursor', { runs: 1, nextCursor: 5 }]
    ])(
      'throws INTERNAL_SERVER_ERROR when the data is %s',
      async (_label, data) => {
        const error = await captureError(
          processRetweetV2TaskJob(db, task, jobWith(data))
        );

        expect(error).toBeInstanceOf(ApplicationError);
        expect(error).toMatchObject({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Invalid task job data for Twitter V2 import task',
          data: task
        });
        expect((error as ApplicationError).cause).toBeInstanceOf(ZodError);
        expect(m.getRetweetersUntilUser).not.toHaveBeenCalled();
      }
    );
  });

  describe('when the tweet id cannot be extracted', () => {
    it('throws INTERNAL_SERVER_ERROR without fetching retweeters', async () => {
      const badTask = {
        ...task,
        tweetId: 'not-a-tweet'
      } as TwitterRetweetV2TaskSchema;

      const error = await captureError(
        processRetweetV2TaskJob(db, badTask, jobWith({ runs: 1 }))
      );

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Could not extract tweet ID from URL',
        data: badTask
      });
      expect(m.getRetweetersUntilUser).not.toHaveBeenCalled();
    });
  });

  describe('fetching retweeters', () => {
    it('stops at the last processed user and starts without a cursor on a fresh run', async () => {
      respond({ users: [], hasMore: false });

      await processRetweetV2TaskJob(
        db,
        task,
        jobWith({ runs: 2, lastProcessedId: 'old-user' })
      );

      expect(m.getRetweetersUntilUser).toHaveBeenCalledWith({
        tweetId: '1234567890',
        stopAtUserId: 'old-user',
        cursor: undefined
      });
    });

    it('resumes from the stored cursor on a continuation run', async () => {
      respond({ users: [], hasMore: false });

      await processRetweetV2TaskJob(
        db,
        task,
        jobWith({ runs: 2, nextCursor: 'cursor-1', lastProcessedId: 'old' })
      );

      expect(m.getRetweetersUntilUser).toHaveBeenCalledWith({
        tweetId: '1234567890',
        stopAtUserId: 'old',
        cursor: 'cursor-1'
      });
    });

    it('extracts the tweet id from a twitter.com status url', async () => {
      respond({ users: [], hasMore: false });
      const twitterTask = {
        ...task,
        tweetId: 'https://twitter.com/someone/status/42'
      };

      await processRetweetV2TaskJob(db, twitterTask, jobWith({ runs: 1 }));

      expect(m.getRetweetersUntilUser).toHaveBeenCalledWith(
        expect.objectContaining({ tweetId: '42' })
      );
    });

    it('imports the fetched users converted to the twitter user schema', async () => {
      respond({
        users: [
          scrapeUser('u1', {
            created_at: '2020-01-01T00:00:00.000Z',
            description: 'bio',
            location: 'Earth',
            profile_image_url: 'https://img.example/u1.png',
            verified: true,
            verified_type: 'blue'
          })
        ],
        hasMore: false
      });

      await processRetweetV2TaskJob(db, task, jobWith({ runs: 1 }));

      expect(m.importTwitterUsers).toHaveBeenCalledWith(db, {
        sweepstakesId: 'sweep-1',
        taskId: 'task-1',
        twitterUsers: [
          {
            id: 'u1',
            name: 'User u1',
            username: 'user_u1',
            created_at: new Date('2020-01-01T00:00:00.000Z'),
            description: 'bio',
            location: 'Earth',
            profile_image_url: 'https://img.example/u1.png',
            profile_banner_url: undefined,
            protected: false,
            verified: true,
            verified_type: 'blue',
            public_metrics: {
              followers_count: 10,
              following_count: 5,
              tweet_count: 100
            }
          }
        ]
      });
    });

    it('imports an empty list when the response has no users', async () => {
      respond({ hasMore: false });

      await processRetweetV2TaskJob(db, task, jobWith({ runs: 1 }));

      expect(m.importTwitterUsers).toHaveBeenCalledWith(db, {
        sweepstakesId: 'sweep-1',
        taskId: 'task-1',
        twitterUsers: []
      });
    });

    it('propagates errors from the retweeter fetch', async () => {
      const failure = new Error('scrapebadger down');
      m.getRetweetersUntilUser.mockRejectedValue(failure);

      await expect(
        processRetweetV2TaskJob(db, task, jobWith({ runs: 1 }))
      ).rejects.toBe(failure);
      expect(m.importTwitterUsers).not.toHaveBeenCalled();
    });
  });

  describe('recording task completions', () => {
    beforeEach(() => {
      respond({ users: [scrapeUser('u1')], hasMore: false });
    });

    it('looks up an existing completed or pending completion for each user', async () => {
      importResult([imported('a')], [imported('b')]);
      prismaMock.taskCompletion.findFirst.mockResolvedValue(null);

      await processRetweetV2TaskJob(db, task, jobWith({ runs: 1 }));

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
      importResult([imported('a')]);
      prismaMock.taskCompletion.findFirst.mockResolvedValue(null);

      await processRetweetV2TaskJob(db, task, jobWith({ runs: 1 }));

      expect(prismaMock.taskCompletion.create).toHaveBeenCalledWith({
        data: {
          participant: {
            connectOrCreate: {
              where: {
                userId_sweepstakesId: { sweepstakesId: 'sweep-1', userId: 'a' }
              },
              create: { sweepstakesId: 'sweep-1', userId: 'a' }
            }
          },
          task: { connect: { id: 'task-1' } },
          status: 'COMPLETED',
          proof: {
            source: 'twitter_import',
            twitterUserId: 'tw-a',
            twitterUsername: 'name_a',
            twitterVerified: false,
            importedAt: NOW.toISOString(),
            validatedBy: 'job_processor'
          }
        }
      });
      expect(prismaMock.taskCompletion.update).not.toHaveBeenCalled();
    });

    it('schedules the prize allocation job when a completion is created', async () => {
      importResult([imported('a')]);
      prismaMock.taskCompletion.findFirst.mockResolvedValue(null);

      await processRetweetV2TaskJob(db, task, jobWith({ runs: 1 }));

      expect(prismaMock.sweepstakesJob.upsert).toHaveBeenCalledWith({
        where: {
          sweepstakesId_type: {
            sweepstakesId: 'sweep-1',
            type: 'RANDOMLY_ASSIGN_PRIZES'
          }
        },
        create: {
          sweepstakesId: 'sweep-1',
          type: 'RANDOMLY_ASSIGN_PRIZES',
          status: 'PENDING',
          runAt: NOW
        },
        update: { status: 'PENDING', runAt: NOW }
      });
    });

    it('marks a pending completion as completed with the import proof', async () => {
      importResult([], [imported('b')]);
      prismaMock.taskCompletion.findFirst.mockResolvedValue({
        id: 'completion-1',
        status: 'PENDING'
      });

      await processRetweetV2TaskJob(db, task, jobWith({ runs: 1 }));

      expect(prismaMock.taskCompletion.update).toHaveBeenCalledWith({
        where: { id: 'completion-1' },
        data: {
          status: 'COMPLETED',
          proof: {
            source: 'twitter_import',
            twitterUserId: 'tw-b',
            twitterUsername: 'name_b',
            twitterVerified: false,
            importedAt: NOW.toISOString(),
            validatedBy: 'job_processor'
          }
        }
      });
      expect(prismaMock.taskCompletion.create).not.toHaveBeenCalled();
    });

    it('does not schedule prize allocation when completions are only updated', async () => {
      importResult([], [imported('b')]);
      prismaMock.taskCompletion.findFirst.mockResolvedValue({
        id: 'completion-1',
        status: 'PENDING'
      });

      await processRetweetV2TaskJob(db, task, jobWith({ runs: 1 }));

      expect(prismaMock.sweepstakesJob.upsert).not.toHaveBeenCalled();
    });

    it('leaves an already completed completion untouched', async () => {
      importResult([imported('a')]);
      prismaMock.taskCompletion.findFirst.mockResolvedValue({
        id: 'completion-1',
        status: 'COMPLETED'
      });

      await processRetweetV2TaskJob(db, task, jobWith({ runs: 1 }));

      expect(prismaMock.taskCompletion.update).not.toHaveBeenCalled();
      expect(prismaMock.taskCompletion.create).not.toHaveBeenCalled();
      expect(prismaMock.sweepstakesJob.upsert).not.toHaveBeenCalled();
    });
  });

  describe('when the scan is incomplete', () => {
    it('schedules an immediate continuation that remembers the first seen user', async () => {
      respond({
        users: [scrapeUser('u1'), scrapeUser('u2')],
        nextCursor: 'cursor-2',
        hasMore: true
      });

      await processRetweetV2TaskJob(
        db,
        task,
        jobWith({ runs: 3, lastProcessedId: 'old' })
      );

      expect(prismaMock.taskJob.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.taskJob.create).toHaveBeenCalledWith({
        data: {
          taskId: 'task-1',
          runAt: NOW,
          data: {
            runs: 3,
            nextCursor: 'cursor-2',
            lastProcessedId: 'old',
            firstSeenId: 'u1'
          }
        }
      });
    });

    it('carries the stored first seen user through a continuation run', async () => {
      respond({
        users: [scrapeUser('u5')],
        nextCursor: 'cursor-3',
        hasMore: true
      });

      await processRetweetV2TaskJob(
        db,
        task,
        jobWith({
          runs: 3,
          nextCursor: 'cursor-2',
          lastProcessedId: 'old',
          firstSeenId: 'u1'
        })
      );

      expect(prismaMock.taskJob.create).toHaveBeenCalledWith({
        data: {
          taskId: 'task-1',
          runAt: NOW,
          data: {
            runs: 3,
            nextCursor: 'cursor-3',
            lastProcessedId: 'old',
            firstSeenId: 'u1'
          }
        }
      });
    });

    it('schedules the continuation even when the sweepstakes has ended', async () => {
      respond({
        users: [scrapeUser('u1')],
        nextCursor: 'cursor-2',
        hasMore: true
      });

      await processRetweetV2TaskJob(
        db,
        task,
        jobWith(
          { runs: 1 },
          buildTiming({ endDate: new Date(NOW.getTime() - MINUTE) })
        )
      );

      expect(prismaMock.taskJob.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ runAt: NOW })
        })
      );
    });
  });

  describe('when the scan is complete', () => {
    it('treats a response with more pages but no cursor as complete', async () => {
      respond({ users: [scrapeUser('u1')], hasMore: true });

      await processRetweetV2TaskJob(db, task, jobWith({ runs: 2 }));

      expect(prismaMock.taskJob.create).toHaveBeenCalledWith({
        data: {
          taskId: 'task-1',
          runAt: new Date(NOW.getTime() + 10 * MINUTE),
          data: { runs: 3, lastProcessedId: 'u1' }
        }
      });
    });

    it('treats a response without more pages as complete even with a cursor', async () => {
      respond({
        users: [scrapeUser('u1')],
        nextCursor: 'cursor-2',
        hasMore: false
      });

      await processRetweetV2TaskJob(db, task, jobWith({ runs: 2 }));

      expect(prismaMock.taskJob.create).toHaveBeenCalledWith({
        data: {
          taskId: 'task-1',
          runAt: new Date(NOW.getTime() + 10 * MINUTE),
          data: { runs: 3, lastProcessedId: 'u1' }
        }
      });
    });

    it('does not schedule another run once the sweepstakes has ended', async () => {
      respond({ users: [scrapeUser('u1')], hasMore: false });

      await processRetweetV2TaskJob(
        db,
        task,
        jobWith(
          { runs: 2 },
          buildTiming({ endDate: new Date(NOW.getTime() - MINUTE) })
        )
      );

      expect(prismaMock.taskJob.create).not.toHaveBeenCalled();
    });

    it('does not schedule another run when the end date is exactly now', async () => {
      respond({ users: [], hasMore: false });

      await processRetweetV2TaskJob(
        db,
        task,
        jobWith({ runs: 2 }, buildTiming({ endDate: NOW }))
      );

      expect(prismaMock.taskJob.create).not.toHaveBeenCalled();
    });

    it.each([
      [0, 0],
      [1, 5],
      [72, 360],
      [73, 360],
      [500, 360]
    ])('schedules run %i after %i minutes', async (runs, expectedMinutes) => {
      respond({ users: [], hasMore: false });

      await processRetweetV2TaskJob(db, task, jobWith({ runs }));

      expect(prismaMock.taskJob.create).toHaveBeenCalledWith({
        data: {
          taskId: 'task-1',
          runAt: new Date(NOW.getTime() + expectedMinutes * MINUTE),
          data: { runs: runs + 1, lastProcessedId: undefined }
        }
      });
    });

    it('clamps the next run to the sweepstakes end date', async () => {
      respond({ users: [], hasMore: false });
      const endDate = new Date(NOW.getTime() + 3 * MINUTE);

      await processRetweetV2TaskJob(
        db,
        task,
        jobWith({ runs: 2 }, buildTiming({ endDate }))
      );

      expect(prismaMock.taskJob.create).toHaveBeenCalledWith({
        data: {
          taskId: 'task-1',
          runAt: endDate,
          data: { runs: 3, lastProcessedId: undefined }
        }
      });
    });

    it('keeps the computed next run when the end date is later', async () => {
      respond({ users: [], hasMore: false });

      await processRetweetV2TaskJob(
        db,
        task,
        jobWith(
          { runs: 2 },
          buildTiming({ endDate: new Date(NOW.getTime() + 60 * MINUTE) })
        )
      );

      expect(prismaMock.taskJob.create).toHaveBeenCalledWith({
        data: {
          taskId: 'task-1',
          runAt: new Date(NOW.getTime() + 10 * MINUTE),
          data: { runs: 3, lastProcessedId: undefined }
        }
      });
    });

    it('uses the stored first seen user as the new checkpoint after a continuation', async () => {
      respond({ users: [scrapeUser('u9')], hasMore: false });

      await processRetweetV2TaskJob(
        db,
        task,
        jobWith({
          runs: 2,
          nextCursor: 'cursor-2',
          lastProcessedId: 'old',
          firstSeenId: 'u1'
        })
      );

      expect(prismaMock.taskJob.create).toHaveBeenCalledWith({
        data: {
          taskId: 'task-1',
          runAt: new Date(NOW.getTime() + 10 * MINUTE),
          data: { runs: 3, lastProcessedId: 'u1' }
        }
      });
    });

    it('keeps the previous checkpoint when no new users were found', async () => {
      respond({ users: [], hasMore: false });

      await processRetweetV2TaskJob(
        db,
        task,
        jobWith({ runs: 2, lastProcessedId: 'old' })
      );

      expect(prismaMock.taskJob.create).toHaveBeenCalledWith({
        data: {
          taskId: 'task-1',
          runAt: new Date(NOW.getTime() + 10 * MINUTE),
          data: { runs: 3, lastProcessedId: 'old' }
        }
      });
    });

    it('resolves to undefined', async () => {
      respond({ users: [], hasMore: false });

      await expect(
        processRetweetV2TaskJob(db, task, jobWith({ runs: 1 }))
      ).resolves.toBeUndefined();
    });
  });
});
