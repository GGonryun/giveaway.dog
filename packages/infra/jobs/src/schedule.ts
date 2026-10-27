import 'server-only';

import {
  AutomatedPostJobStatus,
  PrismaClient,
  SweepstakesJobStatus,
  TaskJobStatus
} from '@giveaway/db-model';

export const JOB_REQUESTS_KEY = 'jobs:requests';
export const JOB_SCHEDULE_KEY = 'jobs:schedule';
export const MAX_IDLE_MS = 6 * 60 * 60 * 1000;

export type JobSchedule = {
  nextRunAt: number;
  requests: number;
};

export type JobScheduleCheck = {
  due: boolean;
  requests: number | null;
  nextRunAt: number | null;
};

const loadRedis = async () => {
  if (!process.env.REDIS_URL) {
    return null;
  }
  const { redis } = await import('@giveaway/cache/redis');
  return redis;
};

export const requestJobRun = async () => {
  try {
    const redis = await loadRedis();
    await redis?.incr(JOB_REQUESTS_KEY);
  } catch (error) {
    console.error('Failed to request a job run', error);
  }
};

export const checkJobSchedule = async (
  now: Date = new Date()
): Promise<JobScheduleCheck> => {
  try {
    const redis = await loadRedis();
    if (!redis) {
      return { due: true, requests: null, nextRunAt: null };
    }
    const [schedule, stored] = await redis.mget<
      [JobSchedule | null, number | null]
    >(JOB_SCHEDULE_KEY, JOB_REQUESTS_KEY);
    const requests = Number(stored ?? 0);
    const due =
      !schedule ||
      schedule.requests !== requests ||
      schedule.nextRunAt <= now.getTime();
    return { due, requests, nextRunAt: schedule?.nextRunAt ?? null };
  } catch (error) {
    console.error('Failed to read the job schedule', error);
    return { due: true, requests: null, nextRunAt: null };
  }
};

export const findNextRunAt = async (
  db: PrismaClient,
  now: Date = new Date()
) => {
  const [task, sweepstakes, post] = await Promise.all([
    db.taskJob.findFirst({
      where: { status: TaskJobStatus.PENDING, runAt: { not: null } },
      orderBy: { runAt: 'asc' },
      select: { runAt: true }
    }),
    db.sweepstakesJob.findFirst({
      where: { status: SweepstakesJobStatus.PENDING },
      orderBy: { runAt: 'asc' },
      select: { runAt: true }
    }),
    db.automatedPostJob.findFirst({
      where: { status: AutomatedPostJobStatus.PENDING },
      orderBy: { runAt: 'asc' },
      select: { runAt: true }
    })
  ]);

  return Math.min(
    now.getTime() + MAX_IDLE_MS,
    ...[task?.runAt, sweepstakes?.runAt, post?.runAt]
      .filter((runAt): runAt is Date => runAt instanceof Date)
      .map((runAt) => runAt.getTime())
  );
};

export const saveJobSchedule = async (schedule: JobSchedule) => {
  try {
    const redis = await loadRedis();
    await redis?.set(JOB_SCHEDULE_KEY, schedule);
  } catch (error) {
    console.error('Failed to save the job schedule', error);
  }
};
