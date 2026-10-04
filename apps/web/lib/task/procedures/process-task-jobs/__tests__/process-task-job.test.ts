import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processTaskJob } from '../process-task-job';
import { ApplicationError } from '@giveaway/util-errors';
import type { TaskType } from '@/lib/task/schemas';
import { prismaMock, asPrismaClient } from '@giveaway/testing-server/prisma';
import {
  ALL_TASK_TYPES,
  BLUESKY_POST_URL,
  buildTaskJob,
  buildTiming
} from '@/lib/task/procedures/__tests__/fixtures-task-procedures-verification';

const m = vi.hoisted(() => ({
  getRetweetersUntilUser: vi.fn(),
  getLatestTeamBlueskyCredentials: vi.fn(),
  getBlueskyLikes: vi.fn(),
  getBlueskyReposts: vi.fn(),
  importTwitterUsers: vi.fn(),
  importBlueskyUsers: vi.fn()
}));

vi.mock('@giveaway/x-scraper/procedures/get-retweeters', () => ({
  getRetweeters: vi.fn(),
  getRetweetersUntil: vi.fn(),
  getRetweetersUntilUser: m.getRetweetersUntilUser,
  getAllRetweeters: vi.fn()
}));

vi.mock('@/lib/bluesky/get-latest-team-bluesky-agent', () => ({
  getLatestTeamBlueskyCredentials: m.getLatestTeamBlueskyCredentials
}));

vi.mock('@/lib/integrations/procedures/get-bluesky-likes', () => ({
  getBlueskyLikes: m.getBlueskyLikes
}));

vi.mock('@/lib/integrations/procedures/get-bluesky-reposts', () => ({
  getBlueskyReposts: m.getBlueskyReposts
}));

vi.mock('@giveaway/x-import/twitter-import', () => ({
  importTwitterUsers: m.importTwitterUsers
}));

vi.mock('@/lib/sweepstakes/bluesky-import', () => ({
  importBlueskyUsers: m.importBlueskyUsers
}));

const NOW = new Date('2026-10-01T12:00:00.000Z');
const MINUTE = 60 * 1000;
const db = asPrismaClient(prismaMock);

const DEPRECATED_TYPES: TaskType[] = [
  'TWITTER_RETWEET_IMPORT',
  'TWITTER_LIKE_IMPORT'
];
const DELEGATED_TYPES: TaskType[] = [
  'TWITTER_RETWEET_IMPORT_V2',
  'BLUESKY_LIKE_IMPORT',
  'BLUESKY_REPOST_IMPORT'
];
const NOT_IMPLEMENTED_TYPES = ALL_TASK_TYPES.filter(
  (type) => !DEPRECATED_TYPES.includes(type) && !DELEGATED_TYPES.includes(type)
);

const captureError = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected the promise to reject');
};

describe('processTaskJob', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    m.getRetweetersUntilUser.mockReset();
    m.getLatestTeamBlueskyCredentials.mockReset();
    m.getBlueskyLikes.mockReset();
    m.getBlueskyReposts.mockReset();
    m.importTwitterUsers.mockReset();
    m.importBlueskyUsers.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when the sweepstakes is not active', () => {
    it.each(['DRAFT', 'COMPLETED'] as const)(
      'deletes the job when the sweepstakes status is %s',
      async (status) => {
        const job = buildTaskJob({ sweepstakes: { status } });

        const result = await processTaskJob(db, job);

        expect(result).toBeUndefined();
        expect(prismaMock.taskJob.delete).toHaveBeenCalledWith({
          where: { id: 'job-1' }
        });
        expect(prismaMock.taskJob.update).not.toHaveBeenCalled();
      }
    );

    it('deletes the job without parsing an invalid task config', async () => {
      const job = buildTaskJob({
        config: { type: 'NOT_A_TASK' },
        sweepstakes: { status: 'DRAFT' }
      });

      await expect(processTaskJob(db, job)).resolves.toBeUndefined();
      expect(prismaMock.taskJob.delete).toHaveBeenCalledTimes(1);
    });

    it('deletes an inactive job even when the sweepstakes has not started', async () => {
      const job = buildTaskJob({
        sweepstakes: { status: 'DRAFT' },
        timing: buildTiming({ startDate: new Date(NOW.getTime() + MINUTE) })
      });

      await processTaskJob(db, job);

      expect(prismaMock.taskJob.delete).toHaveBeenCalledTimes(1);
      expect(prismaMock.taskJob.update).not.toHaveBeenCalled();
    });
  });

  describe('when the sweepstakes has not started yet', () => {
    it('reschedules the job as pending at the start date', async () => {
      const startDate = new Date(NOW.getTime() + 60 * MINUTE);
      const job = buildTaskJob({ timing: buildTiming({ startDate }) });

      const result = await processTaskJob(db, job);

      expect(result).toBeUndefined();
      expect(prismaMock.taskJob.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: { runAt: startDate, status: 'PENDING' }
      });
      expect(prismaMock.taskJob.delete).not.toHaveBeenCalled();
    });

    it('reschedules without parsing an invalid task config', async () => {
      const job = buildTaskJob({
        config: { type: 'NOT_A_TASK' },
        timing: buildTiming({ startDate: new Date(NOW.getTime() + MINUTE) })
      });

      await expect(processTaskJob(db, job)).resolves.toBeUndefined();
      expect(prismaMock.taskJob.update).toHaveBeenCalledTimes(1);
    });

    it('processes the job when the start date equals the current time', async () => {
      const job = buildTaskJob({ timing: buildTiming({ startDate: NOW }) });

      const error = await captureError(processTaskJob(db, job));

      expect(error).toMatchObject({ code: 'NOT_IMPLEMENTED' });
      expect(prismaMock.taskJob.update).not.toHaveBeenCalled();
    });
  });

  describe('when the sweepstakes end date has passed', () => {
    it('deletes the job once the end date is more than 15 minutes in the past', async () => {
      const job = buildTaskJob({
        timing: buildTiming({
          endDate: new Date(NOW.getTime() - 15 * MINUTE - 1)
        })
      });

      const result = await processTaskJob(db, job);

      expect(result).toBeUndefined();
      expect(prismaMock.taskJob.delete).toHaveBeenCalledWith({
        where: { id: 'job-1' }
      });
    });

    it('keeps processing when the end date is exactly 15 minutes in the past', async () => {
      const job = buildTaskJob({
        timing: buildTiming({ endDate: new Date(NOW.getTime() - 15 * MINUTE) })
      });

      const error = await captureError(processTaskJob(db, job));

      expect(error).toMatchObject({ code: 'NOT_IMPLEMENTED' });
      expect(prismaMock.taskJob.delete).not.toHaveBeenCalled();
    });

    it('keeps processing when the end date passed less than 15 minutes ago', async () => {
      const job = buildTaskJob({
        timing: buildTiming({ endDate: new Date(NOW.getTime() - 5 * MINUTE) })
      });

      const error = await captureError(processTaskJob(db, job));

      expect(error).toMatchObject({ code: 'NOT_IMPLEMENTED' });
      expect(prismaMock.taskJob.delete).not.toHaveBeenCalled();
    });

    it('parses the task config before checking the end date', async () => {
      const job = buildTaskJob({
        config: { type: 'NOT_A_TASK' },
        timing: buildTiming({ endDate: new Date(NOW.getTime() - 60 * MINUTE) })
      });

      const error = await captureError(processTaskJob(db, job));

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to parse task config'
      });
      expect(prismaMock.taskJob.delete).not.toHaveBeenCalled();
    });
  });

  describe('when the sweepstakes has no timing dates', () => {
    it('skips the date checks when timing is missing', async () => {
      const job = buildTaskJob({ timing: null });

      const error = await captureError(processTaskJob(db, job));

      expect(error).toMatchObject({ code: 'NOT_IMPLEMENTED' });
      expect(prismaMock.taskJob.update).not.toHaveBeenCalled();
      expect(prismaMock.taskJob.delete).not.toHaveBeenCalled();
    });

    it('skips the date checks when start and end dates are null', async () => {
      const job = buildTaskJob({
        timing: buildTiming({ startDate: null, endDate: null })
      });

      const error = await captureError(processTaskJob(db, job));

      expect(error).toMatchObject({ code: 'NOT_IMPLEMENTED' });
      expect(prismaMock.taskJob.delete).not.toHaveBeenCalled();
    });
  });

  describe('when the task config is invalid', () => {
    it('throws INTERNAL_SERVER_ERROR "Failed to parse task config"', async () => {
      const job = buildTaskJob({ config: { type: 'BONUS_TASK', value: 0 } });

      const error = await captureError(processTaskJob(db, job));

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to parse task config'
      });
    });
  });

  describe('task types without job processing', () => {
    it('routes every task type through exactly one branch', () => {
      expect(
        [...NOT_IMPLEMENTED_TYPES, ...DEPRECATED_TYPES, ...DELEGATED_TYPES]
          .slice()
          .sort()
      ).toEqual(ALL_TASK_TYPES.slice().sort());
      expect(NOT_IMPLEMENTED_TYPES).toHaveLength(40);
    });

    it.each(NOT_IMPLEMENTED_TYPES)(
      'throws NOT_IMPLEMENTED for %s jobs',
      async (type) => {
        const job = buildTaskJob({ type });

        const error = await captureError(processTaskJob(db, job));

        expect(error).toBeInstanceOf(ApplicationError);
        expect(error).toMatchObject({
          code: 'NOT_IMPLEMENTED',
          message: `Job processing not implemented for task type: ${type}`
        });
        expect(prismaMock.taskJob.create).not.toHaveBeenCalled();
      }
    );

    it.each(DEPRECATED_TYPES)(
      'throws NOT_IMPLEMENTED "no longer supported" for %s jobs',
      async (type) => {
        const job = buildTaskJob({ type, data: { runs: 0 } });

        const error = await captureError(processTaskJob(db, job));

        expect(error).toBeInstanceOf(ApplicationError);
        expect(error).toMatchObject({
          code: 'NOT_IMPLEMENTED',
          message: `Job processing for task type ${type} is no longer supported`
        });
        expect(prismaMock.taskJob.create).not.toHaveBeenCalled();
      }
    );
  });

  describe('import task types', () => {
    it('processes TWITTER_RETWEET_IMPORT_V2 jobs with the scrapebadger retweet importer', async () => {
      m.getRetweetersUntilUser.mockResolvedValue({
        users: [],
        hasMore: false
      });
      m.importTwitterUsers.mockResolvedValue({ imported: [], existing: [] });
      const job = buildTaskJob({
        type: 'TWITTER_RETWEET_IMPORT_V2',
        data: { runs: 1 }
      });

      const result = await processTaskJob(db, job);

      expect(result).toBeUndefined();
      expect(m.getRetweetersUntilUser).toHaveBeenCalledWith({
        tweetId: '1234567890',
        stopAtUserId: undefined,
        cursor: undefined
      });
      expect(prismaMock.taskJob.create).toHaveBeenCalledTimes(1);
      expect(m.getBlueskyLikes).not.toHaveBeenCalled();
    });

    it('processes BLUESKY_LIKE_IMPORT jobs with the bluesky likes importer', async () => {
      const agent = { name: 'agent' };
      m.getLatestTeamBlueskyCredentials.mockResolvedValue({ agent });
      m.getBlueskyLikes.mockResolvedValue({ data: [] });
      m.importBlueskyUsers.mockResolvedValue({ imported: [], existing: [] });
      const job = buildTaskJob({
        type: 'BLUESKY_LIKE_IMPORT',
        data: { runs: 0 }
      });

      await processTaskJob(db, job);

      expect(m.getBlueskyLikes).toHaveBeenCalledWith(db, {
        postUrl: BLUESKY_POST_URL,
        agent
      });
      expect(m.getBlueskyReposts).not.toHaveBeenCalled();
      expect(prismaMock.taskJob.create).toHaveBeenCalledTimes(1);
    });

    it('processes BLUESKY_REPOST_IMPORT jobs with the bluesky reposts importer', async () => {
      const agent = { name: 'agent' };
      m.getLatestTeamBlueskyCredentials.mockResolvedValue({ agent });
      m.getBlueskyReposts.mockResolvedValue({ data: [] });
      m.importBlueskyUsers.mockResolvedValue({ imported: [], existing: [] });
      const job = buildTaskJob({
        type: 'BLUESKY_REPOST_IMPORT',
        data: { runs: 0 }
      });

      await processTaskJob(db, job);

      expect(m.getBlueskyReposts).toHaveBeenCalledWith(db, {
        postUrl: BLUESKY_POST_URL,
        agent
      });
      expect(m.getBlueskyLikes).not.toHaveBeenCalled();
      expect(prismaMock.taskJob.create).toHaveBeenCalledTimes(1);
    });

    it('propagates errors thrown by the delegated processor', async () => {
      const failure = new ApplicationError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Slow down'
      });
      m.getRetweetersUntilUser.mockRejectedValue(failure);
      const job = buildTaskJob({
        type: 'TWITTER_RETWEET_IMPORT_V2',
        data: { runs: 1 }
      });

      await expect(processTaskJob(db, job)).rejects.toBe(failure);
    });
  });
});
