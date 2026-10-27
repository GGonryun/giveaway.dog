import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prismaMock, asPrismaClient } from '@giveaway/testing-server/prisma';
import {
  JOB_REQUESTS_KEY,
  JOB_SCHEDULE_KEY,
  MAX_IDLE_MS,
  checkJobSchedule,
  findNextRunAt,
  requestJobRun,
  saveJobSchedule
} from '../schedule';

const redis = vi.hoisted(() => ({
  incr: vi.fn(),
  mget: vi.fn(),
  set: vi.fn()
}));

vi.mock('@giveaway/cache/redis', () => ({ redis }));

const NOW = new Date('2026-03-01T12:00:00.000Z');
const LATER = new Date('2026-03-01T13:00:00.000Z');
const EVEN_LATER = new Date('2026-03-01T14:00:00.000Z');

describe('job schedule', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.stubEnv('REDIS_URL', 'https://default:token@redis.example.com');
    redis.incr.mockReset();
    redis.mget.mockReset();
    redis.set.mockReset();
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('requestJobRun', () => {
    it('increments the request counter', async () => {
      await requestJobRun();

      expect(redis.incr).toHaveBeenCalledExactlyOnceWith('jobs:requests');
    });

    it('logs and swallows a Redis error', async () => {
      const error = new Error('down');
      redis.incr.mockRejectedValue(error);

      await expect(requestJobRun()).resolves.toBeUndefined();
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to request a job run',
        error
      );
    });

    it('does nothing without REDIS_URL', async () => {
      vi.stubEnv('REDIS_URL', undefined);

      await requestJobRun();

      expect(redis.incr).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
    });
  });

  describe('checkJobSchedule', () => {
    it('reads the schedule and the request counter', async () => {
      redis.mget.mockResolvedValue([null, null]);

      await checkJobSchedule(NOW);

      expect(redis.mget).toHaveBeenCalledExactlyOnceWith(
        'jobs:schedule',
        'jobs:requests'
      );
    });

    it('is not due when the next run is later and no run was requested since', async () => {
      redis.mget.mockResolvedValue([
        { nextRunAt: LATER.getTime(), requests: 3 },
        3
      ]);

      expect(await checkJobSchedule(NOW)).toEqual({
        due: false,
        requests: 3,
        nextRunAt: LATER.getTime()
      });
    });

    it('reads a counter that Redis returns as a string', async () => {
      redis.mget.mockResolvedValue([
        { nextRunAt: LATER.getTime(), requests: 3 },
        '3'
      ]);

      expect(await checkJobSchedule(NOW)).toEqual({
        due: false,
        requests: 3,
        nextRunAt: LATER.getTime()
      });
    });

    it('is not due when no run was ever requested and the next run is later', async () => {
      redis.mget.mockResolvedValue([
        { nextRunAt: LATER.getTime(), requests: 0 },
        null
      ]);

      expect(await checkJobSchedule(NOW)).toEqual({
        due: false,
        requests: 0,
        nextRunAt: LATER.getTime()
      });
    });

    it('is due when a run was requested after the schedule was saved', async () => {
      redis.mget.mockResolvedValue([
        { nextRunAt: LATER.getTime(), requests: 3 },
        4
      ]);

      expect(await checkJobSchedule(NOW)).toEqual({
        due: true,
        requests: 4,
        nextRunAt: LATER.getTime()
      });
    });

    it('is due at the next run time', async () => {
      redis.mget.mockResolvedValue([
        { nextRunAt: NOW.getTime(), requests: 3 },
        3
      ]);

      expect((await checkJobSchedule(NOW)).due).toBe(true);
    });

    it('is not due one millisecond before the next run time', async () => {
      redis.mget.mockResolvedValue([
        { nextRunAt: NOW.getTime() + 1, requests: 3 },
        3
      ]);

      expect((await checkJobSchedule(NOW)).due).toBe(false);
    });

    it('is due when no schedule was saved', async () => {
      redis.mget.mockResolvedValue([null, 2]);

      expect(await checkJobSchedule(NOW)).toEqual({
        due: true,
        requests: 2,
        nextRunAt: null
      });
    });

    it('is due without REDIS_URL, and reports no counter', async () => {
      vi.stubEnv('REDIS_URL', undefined);

      expect(await checkJobSchedule(NOW)).toEqual({
        due: true,
        requests: null,
        nextRunAt: null
      });
      expect(redis.mget).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
    });

    it('is due when Redis fails, and reports no counter', async () => {
      const error = new Error('down');
      redis.mget.mockRejectedValue(error);

      expect(await checkJobSchedule(NOW)).toEqual({
        due: true,
        requests: null,
        nextRunAt: null
      });
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to read the job schedule',
        error
      );
    });

    it('uses the current time by default', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(LATER);
      redis.mget.mockResolvedValue([
        { nextRunAt: LATER.getTime() + 1, requests: 0 },
        0
      ]);

      expect((await checkJobSchedule()).due).toBe(false);
      vi.useRealTimers();
    });
  });

  describe('findNextRunAt', () => {
    beforeEach(() => {
      prismaMock.taskJob.findFirst.mockResolvedValue(null);
      prismaMock.sweepstakesJob.findFirst.mockResolvedValue(null);
      prismaMock.automatedPostJob.findFirst.mockResolvedValue(null);
    });

    it('looks up the earliest pending job of each kind', async () => {
      await findNextRunAt(asPrismaClient(), NOW);

      expect(prismaMock.taskJob.findFirst).toHaveBeenCalledExactlyOnceWith({
        where: { status: 'PENDING', runAt: { not: null } },
        orderBy: { runAt: 'asc' },
        select: { runAt: true }
      });
      expect(
        prismaMock.sweepstakesJob.findFirst
      ).toHaveBeenCalledExactlyOnceWith({
        where: { status: 'PENDING' },
        orderBy: { runAt: 'asc' },
        select: { runAt: true }
      });
      expect(
        prismaMock.automatedPostJob.findFirst
      ).toHaveBeenCalledExactlyOnceWith({
        where: { status: 'PENDING' },
        orderBy: { runAt: 'asc' },
        select: { runAt: true }
      });
    });

    it('waits at most the maximum idle time when no job is pending', async () => {
      expect(await findNextRunAt(asPrismaClient(), NOW)).toBe(
        NOW.getTime() + 6 * 60 * 60 * 1000
      );
      expect(MAX_IDLE_MS).toBe(6 * 60 * 60 * 1000);
    });

    it('returns the earliest run time of the three kinds', async () => {
      prismaMock.taskJob.findFirst.mockResolvedValue({ runAt: EVEN_LATER });
      prismaMock.sweepstakesJob.findFirst.mockResolvedValue({ runAt: LATER });
      prismaMock.automatedPostJob.findFirst.mockResolvedValue({
        runAt: EVEN_LATER
      });

      expect(await findNextRunAt(asPrismaClient(), NOW)).toBe(LATER.getTime());
    });

    it.each(['taskJob', 'sweepstakesJob', 'automatedPostJob'] as const)(
      'returns the run time of a %s alone',
      async (model) => {
        prismaMock[model].findFirst.mockResolvedValue({ runAt: LATER });

        expect(await findNextRunAt(asPrismaClient(), NOW)).toBe(
          LATER.getTime()
        );
      }
    );

    it('returns a past run time of an overdue job', async () => {
      const past = new Date('2026-03-01T11:00:00.000Z');
      prismaMock.taskJob.findFirst.mockResolvedValue({ runAt: past });

      expect(await findNextRunAt(asPrismaClient(), NOW)).toBe(past.getTime());
    });

    it('ignores a task job without a run time', async () => {
      prismaMock.taskJob.findFirst.mockResolvedValue({ runAt: null });

      expect(await findNextRunAt(asPrismaClient(), NOW)).toBe(
        NOW.getTime() + MAX_IDLE_MS
      );
    });

    it('caps a run time later than the maximum idle time', async () => {
      prismaMock.automatedPostJob.findFirst.mockResolvedValue({
        runAt: new Date('2026-04-01T00:00:00.000Z')
      });

      expect(await findNextRunAt(asPrismaClient(), NOW)).toBe(
        NOW.getTime() + MAX_IDLE_MS
      );
    });

    it('uses the current time by default', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(LATER);

      expect(await findNextRunAt(asPrismaClient())).toBe(
        LATER.getTime() + MAX_IDLE_MS
      );
      vi.useRealTimers();
    });

    it('propagates database errors', async () => {
      prismaMock.sweepstakesJob.findFirst.mockRejectedValue(new Error('down'));

      await expect(findNextRunAt(asPrismaClient(), NOW)).rejects.toThrow(
        'down'
      );
    });
  });

  describe('saveJobSchedule', () => {
    it('stores the next run time with the request counter it was computed for', async () => {
      await saveJobSchedule({ nextRunAt: LATER.getTime(), requests: 7 });

      expect(redis.set).toHaveBeenCalledExactlyOnceWith(JOB_SCHEDULE_KEY, {
        nextRunAt: LATER.getTime(),
        requests: 7
      });
      expect(JOB_REQUESTS_KEY).toBe('jobs:requests');
    });

    it('logs and swallows a Redis error', async () => {
      const error = new Error('down');
      redis.set.mockRejectedValue(error);

      await expect(
        saveJobSchedule({ nextRunAt: LATER.getTime(), requests: 7 })
      ).resolves.toBeUndefined();
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to save the job schedule',
        error
      );
    });

    it('does nothing without REDIS_URL', async () => {
      vi.stubEnv('REDIS_URL', undefined);

      await saveJobSchedule({ nextRunAt: LATER.getTime(), requests: 7 });

      expect(redis.set).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
    });
  });
});
