import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ZodError } from 'zod';
import { processBlueskyTaskJob } from '../process-bluesky-task-job';
import { ApplicationError } from '@/lib/errors';
import type { Prisma } from '@prisma/client';
import type { BlueskyUserSchema } from '@/lib/integrations/procedures/get-bluesky-likes';
import { prismaMock, asPrismaClient } from '@giveaway/testing-server/prisma';
import {
  buildTaskJob,
  taskOf
} from '@/lib/task/procedures/__tests__/fixtures-task-procedures-verification';

const m = vi.hoisted(() => ({
  getLatestTeamBlueskyCredentials: vi.fn(),
  importBlueskyUsers: vi.fn()
}));

vi.mock('@/lib/bluesky/get-latest-team-bluesky-agent', () => ({
  getLatestTeamBlueskyCredentials: m.getLatestTeamBlueskyCredentials
}));

vi.mock('@/lib/sweepstakes/bluesky-import', () => ({
  importBlueskyUsers: m.importBlueskyUsers
}));

const NOW = new Date('2026-10-01T12:00:00.000Z');
const MINUTE = 60 * 1000;
const db = asPrismaClient(prismaMock);
const agent = { session: 'agent-session' };
const likeTask = taskOf('BLUESKY_LIKE_IMPORT');
const repostTask = taskOf('BLUESKY_REPOST_IMPORT');

const blueskyUser = (did: string): BlueskyUserSchema => ({
  did,
  handle: `${did}.bsky.social`
});

const imported = (userId: string) => ({
  userId,
  blueskyDid: `did:plc:${userId}`,
  blueskyHandle: `${userId}.bsky.social`
});

const jobWith = (
  data: Prisma.JsonValue,
  options: Parameters<typeof buildTaskJob>[0] = {}
) => buildTaskJob({ type: 'BLUESKY_LIKE_IMPORT', data, ...options });

const actionReturning = (data?: BlueskyUserSchema[]) =>
  vi.fn().mockResolvedValue({ data });

const importResult = (
  importedUsers: ReturnType<typeof imported>[] = [],
  existingUsers: ReturnType<typeof imported>[] = []
) =>
  m.importBlueskyUsers.mockResolvedValue({
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

describe('processBlueskyTaskJob', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    m.getLatestTeamBlueskyCredentials.mockReset();
    m.getLatestTeamBlueskyCredentials.mockResolvedValue({
      agent,
      did: 'did:plc:team',
      handle: 'team.bsky.social'
    });
    m.importBlueskyUsers.mockReset();
    importResult();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when the job data is invalid', () => {
    it.each([
      ['missing', null],
      ['without runs', { lastProcessedDid: 'did:plc:a' }],
      ['with negative runs', { runs: -2 }],
      ['with a numeric checkpoint', { runs: 0, lastProcessedDid: 1 }]
    ])(
      'throws INTERNAL_SERVER_ERROR when the data is %s',
      async (_label, data) => {
        const action = actionReturning([]);

        const error = await captureError(
          processBlueskyTaskJob(db, likeTask, jobWith(data), action)
        );

        expect(error).toBeInstanceOf(ApplicationError);
        expect(error).toMatchObject({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Invalid task job data for Bluesky import task',
          data: likeTask
        });
        expect((error as ApplicationError).cause).toBeInstanceOf(ZodError);
        expect(m.getLatestTeamBlueskyCredentials).not.toHaveBeenCalled();
        expect(action).not.toHaveBeenCalled();
      }
    );
  });

  describe('fetching users', () => {
    it('loads the bluesky credentials of the sweepstakes team', async () => {
      await processBlueskyTaskJob(
        db,
        likeTask,
        jobWith({ runs: 0 }),
        actionReturning([])
      );

      expect(m.getLatestTeamBlueskyCredentials).toHaveBeenCalledWith(
        db,
        'team-1'
      );
    });

    it('passes a null team id to the credential lookup when the sweepstakes has no team', async () => {
      await processBlueskyTaskJob(
        db,
        likeTask,
        jobWith({ runs: 0 }, { sweepstakes: { teamId: null } }),
        actionReturning([])
      );

      expect(m.getLatestTeamBlueskyCredentials).toHaveBeenCalledWith(db, null);
    });

    it('propagates credential errors without running the action', async () => {
      const failure = new ApplicationError({
        code: 'FORBIDDEN',
        message: 'Team does not have a connected Bluesky integration'
      });
      m.getLatestTeamBlueskyCredentials.mockRejectedValue(failure);
      const action = actionReturning([]);

      await expect(
        processBlueskyTaskJob(db, likeTask, jobWith({ runs: 0 }), action)
      ).rejects.toBe(failure);
      expect(action).not.toHaveBeenCalled();
    });

    it('runs the action with the database client and the team agent', async () => {
      const action = actionReturning([]);

      await processBlueskyTaskJob(db, repostTask, jobWith({ runs: 0 }), action);

      expect(action).toHaveBeenCalledWith(db, agent);
    });

    it('imports only the users newer than the last processed did', async () => {
      const action = actionReturning([
        blueskyUser('did:plc:c'),
        blueskyUser('did:plc:b'),
        blueskyUser('did:plc:a')
      ]);

      await processBlueskyTaskJob(
        db,
        likeTask,
        jobWith({ runs: 1, lastProcessedDid: 'did:plc:b' }),
        action
      );

      expect(m.importBlueskyUsers).toHaveBeenCalledWith(db, {
        sweepstakesId: 'sweep-1',
        taskId: 'task-1',
        blueskyUsers: [blueskyUser('did:plc:c')]
      });
    });

    it('imports every user when the last processed did is not in the response', async () => {
      const users = [blueskyUser('did:plc:c'), blueskyUser('did:plc:b')];

      await processBlueskyTaskJob(
        db,
        likeTask,
        jobWith({ runs: 1, lastProcessedDid: 'did:plc:gone' }),
        actionReturning(users)
      );

      expect(m.importBlueskyUsers).toHaveBeenCalledWith(db, {
        sweepstakesId: 'sweep-1',
        taskId: 'task-1',
        blueskyUsers: users
      });
    });

    it('imports no users when the response has no data', async () => {
      await processBlueskyTaskJob(
        db,
        likeTask,
        jobWith({ runs: 1 }),
        actionReturning(undefined)
      );

      expect(m.importBlueskyUsers).toHaveBeenCalledWith(db, {
        sweepstakesId: 'sweep-1',
        taskId: 'task-1',
        blueskyUsers: []
      });
    });
  });

  describe('recording task completions', () => {
    const action = () => actionReturning([blueskyUser('did:plc:a')]);

    it('looks up an existing completed or pending completion for each user', async () => {
      importResult([imported('a')], [imported('b')]);
      prismaMock.taskCompletion.findFirst.mockResolvedValue(null);

      await processBlueskyTaskJob(db, likeTask, jobWith({ runs: 0 }), action());

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

    it('creates a completed completion with a bluesky import proof for new participants', async () => {
      importResult([imported('a')]);
      prismaMock.taskCompletion.findFirst.mockResolvedValue(null);

      await processBlueskyTaskJob(db, likeTask, jobWith({ runs: 0 }), action());

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
            source: 'bluesky_import',
            blueskyDid: 'did:plc:a',
            blueskyHandle: 'a.bsky.social',
            importedAt: NOW.toISOString(),
            validatedBy: 'job_processor'
          }
        }
      });
    });

    it('schedules the prize allocation job when a completion is created', async () => {
      importResult([], [imported('b')]);
      prismaMock.taskCompletion.findFirst.mockResolvedValue(null);

      await processBlueskyTaskJob(db, likeTask, jobWith({ runs: 0 }), action());

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

    it('marks a pending completion as completed without attaching a proof', async () => {
      importResult([imported('a')]);
      prismaMock.taskCompletion.findFirst.mockResolvedValue({
        id: 'completion-1',
        status: 'PENDING'
      });

      await processBlueskyTaskJob(db, likeTask, jobWith({ runs: 0 }), action());

      expect(prismaMock.taskCompletion.update).toHaveBeenCalledWith({
        where: { id: 'completion-1' },
        data: { status: 'COMPLETED' }
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

      await processBlueskyTaskJob(db, likeTask, jobWith({ runs: 0 }), action());

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
        await processBlueskyTaskJob(
          db,
          likeTask,
          jobWith({ runs }),
          actionReturning([blueskyUser('did:plc:b'), blueskyUser('did:plc:a')])
        );

        expect(prismaMock.taskJob.create).toHaveBeenCalledWith({
          data: {
            taskId: 'task-1',
            status: 'PENDING',
            runAt: new Date(NOW.getTime() + expectedMinutes * MINUTE),
            data: { runs: runs + 1, lastProcessedDid: 'did:plc:b' }
          }
        });
      }
    );

    it('checkpoints the newest user even when it was already processed', async () => {
      await processBlueskyTaskJob(
        db,
        likeTask,
        jobWith({ runs: 1, lastProcessedDid: 'did:plc:a' }),
        actionReturning([blueskyUser('did:plc:a'), blueskyUser('did:plc:z')])
      );

      expect(m.importBlueskyUsers).toHaveBeenCalledWith(db, {
        sweepstakesId: 'sweep-1',
        taskId: 'task-1',
        blueskyUsers: []
      });
      expect(prismaMock.taskJob.create).toHaveBeenCalledWith({
        data: {
          taskId: 'task-1',
          status: 'PENDING',
          runAt: new Date(NOW.getTime() + 20 * MINUTE),
          data: { runs: 2, lastProcessedDid: 'did:plc:a' }
        }
      });
    });

    it('clears the checkpoint when the response has no data', async () => {
      await processBlueskyTaskJob(
        db,
        likeTask,
        jobWith({ runs: 1, lastProcessedDid: 'did:plc:a' }),
        actionReturning(undefined)
      );

      expect(prismaMock.taskJob.create).toHaveBeenCalledWith({
        data: {
          taskId: 'task-1',
          status: 'PENDING',
          runAt: new Date(NOW.getTime() + 20 * MINUTE),
          data: { runs: 2, lastProcessedDid: undefined }
        }
      });
    });

    it('resolves to undefined', async () => {
      await expect(
        processBlueskyTaskJob(
          db,
          likeTask,
          jobWith({ runs: 0 }),
          actionReturning([])
        )
      ).resolves.toBeUndefined();
    });
  });
});
