import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runTaskJobs } from '../run-task-jobs';
import { taskJobInclude } from '@giveaway/task-jobs-core/types';
import { ApplicationError } from '@giveaway/util-errors';
import { prismaMock, asPrismaClient } from '@giveaway/testing-server/prisma';
import {
  buildTaskJob,
  buildTiming
} from '@giveaway/task-model/testing/fixtures-task-procedures-verification';

const db = asPrismaClient();

const m = vi.hoisted(() => ({
  getRetweetersUntilUser: vi.fn()
}));

vi.mock('@giveaway/x-scraper/procedures/get-retweeters', () => ({
  getRetweeters: vi.fn(),
  getRetweetersUntil: vi.fn(),
  getRetweetersUntilUser: m.getRetweetersUntilUser,
  getAllRetweeters: vi.fn()
}));

const NOW = new Date('2026-10-01T12:00:00.000Z');

const inactiveJob = (id: string) =>
  buildTaskJob({ job: { id }, sweepstakes: { status: 'COMPLETED' } });

const retweetJob = (id: string) =>
  buildTaskJob({
    type: 'TWITTER_RETWEET_IMPORT_V2',
    data: { runs: 1 },
    job: { id }
  });

const updateCalls = () =>
  [prismaMock.taskJob.update.mock, prismaMock.taskJob.updateMany.mock]
    .flatMap(({ calls, invocationCallOrder }) =>
      calls.map(([arg], index) => ({ arg, order: invocationCallOrder[index] }))
    )
    .sort((a, b) => a.order - b.order)
    .map(({ arg }) => arg)
    .filter((arg) => arg.where?.id !== undefined);

describe('runTaskJobs', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    m.getRetweetersUntilUser.mockReset();
    prismaMock.taskJob.findMany.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('resetting stuck jobs', () => {
    it('sets jobs in progress for more than 10 minutes back to pending before it loads the due jobs', async () => {
      await runTaskJobs(db);

      expect(prismaMock.taskJob.updateMany).toHaveBeenCalledWith({
        where: {
          status: 'IN_PROGRESS',
          updatedAt: { lt: new Date(NOW.getTime() - 10 * 60 * 1000) }
        },
        data: { status: 'PENDING' }
      });
      const [resetOrder] =
        prismaMock.taskJob.updateMany.mock.invocationCallOrder;
      const [loadOrder] = prismaMock.taskJob.findMany.mock.invocationCallOrder;
      expect(resetOrder).toBeLessThan(loadOrder);
    });

    it('resets only the stuck jobs of one sweepstakes when it is given', async () => {
      await runTaskJobs(db, { sweepstakesId: 'sweepstakes-1' });

      expect(prismaMock.taskJob.updateMany).toHaveBeenCalledWith({
        where: {
          status: 'IN_PROGRESS',
          updatedAt: { lt: new Date(NOW.getTime() - 10 * 60 * 1000) },
          task: { sweepstakesId: 'sweepstakes-1' }
        },
        data: { status: 'PENDING' }
      });
    });

    it('throws when the reset fails', async () => {
      prismaMock.taskJob.updateMany.mockRejectedValue(new Error('db down'));

      await expect(runTaskJobs(db)).rejects.toThrow('db down');
      expect(prismaMock.taskJob.findMany).not.toHaveBeenCalled();
    });
  });

  describe('querying pending jobs', () => {
    it('returns zero processed jobs when nothing is due', async () => {
      const result = await runTaskJobs(db);

      expect(result).toEqual({ processed: 0 });
      expect(updateCalls()).toEqual([]);
    });

    it('loads at most five due pending jobs, oldest first, with their sweepstakes timing', async () => {
      await runTaskJobs(db);

      expect(prismaMock.taskJob.findMany).toHaveBeenCalledWith({
        where: {
          runAt: { lte: NOW },
          status: { in: ['PENDING'] }
        },
        orderBy: { createdAt: 'asc' },
        take: 5,
        include: taskJobInclude
      });
    });

    it('includes the task with its sweepstakes and timing', () => {
      expect(taskJobInclude).toEqual({
        task: { include: { sweepstakes: { include: { timing: true } } } }
      });
    });

    it('loads the due jobs of one sweepstakes when it is given', async () => {
      await runTaskJobs(db, { sweepstakesId: 'sweepstakes-1' });

      expect(prismaMock.taskJob.findMany).toHaveBeenCalledWith({
        where: {
          runAt: { lte: NOW },
          status: { in: ['PENDING'] },
          task: { sweepstakesId: 'sweepstakes-1' }
        },
        orderBy: { createdAt: 'asc' },
        take: 5,
        include: taskJobInclude
      });
    });

    it('throws when the job query fails', async () => {
      prismaMock.taskJob.findMany.mockRejectedValue(new Error('db down'));

      await expect(runTaskJobs(db)).rejects.toThrow('db down');
    });
  });

  describe('when a job is processed successfully', () => {
    it('marks the job in progress, processes it, then marks it completed', async () => {
      prismaMock.taskJob.findMany.mockResolvedValue([inactiveJob('job-1')]);

      const result = await runTaskJobs(db);

      expect(result).toEqual({ processed: 1 });
      expect(updateCalls()).toEqual([
        { where: { id: 'job-1' }, data: { status: 'IN_PROGRESS' } },
        { where: { id: 'job-1' }, data: { status: 'COMPLETED' } }
      ]);
      const [inProgressOrder] =
        prismaMock.taskJob.update.mock.invocationCallOrder;
      const [, completedOrder] =
        prismaMock.taskJob.updateMany.mock.invocationCallOrder;
      const [deleteOrder] = prismaMock.taskJob.delete.mock.invocationCallOrder;
      expect(inProgressOrder).toBeLessThan(deleteOrder);
      expect(deleteOrder).toBeLessThan(completedOrder);
    });

    it('marks a job completed right after it was rescheduled for a future start date', async () => {
      const startDate = new Date(NOW.getTime() + 60 * 60 * 1000);
      prismaMock.taskJob.findMany.mockResolvedValue([
        buildTaskJob({ timing: buildTiming({ startDate }) })
      ]);

      const result = await runTaskJobs(db);

      expect(result).toEqual({ processed: 1 });
      expect(updateCalls()).toEqual([
        { where: { id: 'job-1' }, data: { status: 'IN_PROGRESS' } },
        {
          where: { id: 'job-1' },
          data: { runAt: startDate, status: 'PENDING' }
        },
        { where: { id: 'job-1' }, data: { status: 'COMPLETED' } }
      ]);
    });

    it('processes every returned job in order', async () => {
      prismaMock.taskJob.findMany.mockResolvedValue([
        inactiveJob('job-1'),
        inactiveJob('job-2')
      ]);

      const result = await runTaskJobs(db);

      expect(result).toEqual({ processed: 2 });
      expect(updateCalls()).toEqual([
        { where: { id: 'job-1' }, data: { status: 'IN_PROGRESS' } },
        { where: { id: 'job-1' }, data: { status: 'COMPLETED' } },
        { where: { id: 'job-2' }, data: { status: 'IN_PROGRESS' } },
        { where: { id: 'job-2' }, data: { status: 'COMPLETED' } }
      ]);
    });
  });

  describe('when processing throws a non-retryable error', () => {
    it('marks the job failed with the serialized application error', async () => {
      prismaMock.taskJob.findMany.mockResolvedValue([
        buildTaskJob({ type: 'BONUS_TASK' })
      ]);

      const result = await runTaskJobs(db);

      expect(result).toEqual({ processed: 1 });
      expect(updateCalls()).toEqual([
        { where: { id: 'job-1' }, data: { status: 'IN_PROGRESS' } },
        {
          where: { id: 'job-1' },
          data: {
            status: 'FAILED',
            data: JSON.stringify({
              code: 'NOT_IMPLEMENTED',
              message:
                'Job processing not implemented for task type: BONUS_TASK'
            })
          }
        }
      ]);
    });

    it('stores an empty object when a plain error is thrown', async () => {
      prismaMock.taskJob.findMany.mockResolvedValue([retweetJob('job-1')]);
      m.getRetweetersUntilUser.mockRejectedValue(new Error('boom'));

      await runTaskJobs(db);

      expect(updateCalls()[1]).toEqual({
        where: { id: 'job-1' },
        data: { status: 'FAILED', data: '{}' }
      });
    });

    it('stores an empty object when undefined is thrown', async () => {
      prismaMock.taskJob.findMany.mockResolvedValue([retweetJob('job-1')]);
      m.getRetweetersUntilUser.mockRejectedValue(undefined);

      await runTaskJobs(db);

      expect(updateCalls()[1]).toEqual({
        where: { id: 'job-1' },
        data: { status: 'FAILED', data: '{}' }
      });
    });

    it('treats an application error with a non-numeric retryAfter as a failure', async () => {
      prismaMock.taskJob.findMany.mockResolvedValue([retweetJob('job-1')]);
      m.getRetweetersUntilUser.mockRejectedValue(
        new ApplicationError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Slow down',
          data: { retryAfter: 'soon' }
        })
      );

      await runTaskJobs(db);

      expect(updateCalls()[1]).toEqual({
        where: { id: 'job-1' },
        data: {
          status: 'FAILED',
          data: JSON.stringify({
            code: 'TOO_MANY_REQUESTS',
            message: 'Slow down',
            data: { retryAfter: 'soon' }
          })
        }
      });
    });

    it('marks the job failed when the in-progress update fails', async () => {
      prismaMock.taskJob.findMany.mockResolvedValue([inactiveJob('job-1')]);
      prismaMock.taskJob.update.mockRejectedValueOnce(new Error('locked'));

      const result = await runTaskJobs(db);

      expect(result).toEqual({ processed: 1 });
      expect(prismaMock.taskJob.delete).not.toHaveBeenCalled();
      expect(updateCalls()[1]).toEqual({
        where: { id: 'job-1' },
        data: { status: 'FAILED', data: '{}' }
      });
    });

    it('keeps processing the remaining jobs after a failure', async () => {
      prismaMock.taskJob.findMany.mockResolvedValue([
        buildTaskJob({ type: 'BONUS_TASK', job: { id: 'job-1' } }),
        inactiveJob('job-2')
      ]);

      const result = await runTaskJobs(db);

      expect(result).toEqual({ processed: 2 });
      expect(
        updateCalls().map((call) => [call.where.id, call.data.status])
      ).toEqual([
        ['job-1', 'IN_PROGRESS'],
        ['job-1', 'FAILED'],
        ['job-2', 'IN_PROGRESS'],
        ['job-2', 'COMPLETED']
      ]);
    });
  });

  describe('when processing throws a retryable error', () => {
    it('reschedules the job as pending at the retry time', async () => {
      const retryAfter = NOW.getTime() + 90_000;
      prismaMock.taskJob.findMany.mockResolvedValue([retweetJob('job-1')]);
      m.getRetweetersUntilUser.mockRejectedValue(
        new ApplicationError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Slow down',
          data: { retryAfter }
        })
      );

      const result = await runTaskJobs(db);

      expect(result).toEqual({ processed: 1 });
      expect(updateCalls()).toEqual([
        { where: { id: 'job-1' }, data: { status: 'IN_PROGRESS' } },
        {
          where: { id: 'job-1' },
          data: { status: 'PENDING', runAt: new Date(retryAfter) }
        }
      ]);
    });
  });

  describe('when recording the outcome fails', () => {
    it('keeps processing the next job when the job record no longer exists', async () => {
      prismaMock.taskJob.findMany.mockResolvedValue([
        inactiveJob('job-1'),
        inactiveJob('job-2')
      ]);
      prismaMock.taskJob.updateMany.mockResolvedValue({ count: 0 });

      await expect(runTaskJobs(db)).resolves.toEqual({ processed: 2 });
      expect(updateCalls()).toEqual([
        { where: { id: 'job-1' }, data: { status: 'IN_PROGRESS' } },
        { where: { id: 'job-1' }, data: { status: 'COMPLETED' } },
        { where: { id: 'job-2' }, data: { status: 'IN_PROGRESS' } },
        { where: { id: 'job-2' }, data: { status: 'COMPLETED' } }
      ]);
    });
  });
});
