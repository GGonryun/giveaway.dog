import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processLikeTaskJob } from '../process-like-task-job';
import { prismaMock, asPrismaClient } from '@/test/prisma';
import {
  TWEET_URL,
  buildTaskJob,
  taskOf
} from '@/lib/task/procedures/__tests__/fixtures-task-procedures-verification';

const m = vi.hoisted(() => ({
  getLikingUsers: vi.fn(),
  importTwitterUsers: vi.fn()
}));

vi.mock('@/lib/integrations/procedures/get-liking-users', () => ({
  getLikingUsers: m.getLikingUsers
}));

vi.mock('@/lib/sweepstakes/twitter-import', () => ({
  importTwitterUsers: m.importTwitterUsers
}));

const NOW = new Date('2026-10-01T12:00:00.000Z');
const db = asPrismaClient(prismaMock);
const task = taskOf('TWITTER_LIKE_IMPORT', 'task-1', {
  importingAccount: 'integration-9'
});

describe('processLikeTaskJob', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    m.getLikingUsers.mockReset();
    m.importTwitterUsers.mockReset();
    m.importTwitterUsers.mockResolvedValue({ imported: [], existing: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetches up to 100 liking users with the importing integration of the team', async () => {
    m.getLikingUsers.mockResolvedValue({ data: [] });
    const job = buildTaskJob({
      type: 'TWITTER_LIKE_IMPORT',
      data: { runs: 0 }
    });

    await processLikeTaskJob(db, task, job);

    expect(m.getLikingUsers).toHaveBeenCalledWith(db, {
      teamId: 'team-1',
      integrationId: 'integration-9',
      tweetId: TWEET_URL,
      maxResults: 100
    });
  });

  it('passes a null team id through when the sweepstakes has no team', async () => {
    m.getLikingUsers.mockResolvedValue({ data: [] });
    const job = buildTaskJob({
      type: 'TWITTER_LIKE_IMPORT',
      data: { runs: 0 },
      sweepstakes: { teamId: null }
    });

    await processLikeTaskJob(db, task, job);

    expect(m.getLikingUsers).toHaveBeenCalledWith(
      db,
      expect.objectContaining({ teamId: null })
    );
  });

  it('imports the liking users returned by the twitter api', async () => {
    const users = [{ id: 'u1', name: 'One', username: 'one' }];
    m.getLikingUsers.mockResolvedValue({ data: users });
    const job = buildTaskJob({
      type: 'TWITTER_LIKE_IMPORT',
      data: { runs: 0 }
    });

    await processLikeTaskJob(db, task, job);

    expect(m.importTwitterUsers).toHaveBeenCalledWith(db, {
      sweepstakesId: 'sweep-1',
      taskId: 'task-1',
      twitterUsers: users
    });
    expect(prismaMock.taskJob.create).toHaveBeenCalledWith({
      data: {
        taskId: 'task-1',
        status: 'PENDING',
        runAt: new Date(NOW.getTime() + 15 * 60 * 1000),
        data: { runs: 1, lastProcessedId: 'u1' }
      }
    });
  });

  it('resolves to undefined', async () => {
    m.getLikingUsers.mockResolvedValue({ data: [] });
    const job = buildTaskJob({
      type: 'TWITTER_LIKE_IMPORT',
      data: { runs: 0 }
    });

    await expect(processLikeTaskJob(db, task, job)).resolves.toBeUndefined();
  });

  it('propagates errors from the twitter api', async () => {
    const failure = new Error('twitter down');
    m.getLikingUsers.mockRejectedValue(failure);
    const job = buildTaskJob({
      type: 'TWITTER_LIKE_IMPORT',
      data: { runs: 0 }
    });

    await expect(processLikeTaskJob(db, task, job)).rejects.toBe(failure);
    expect(prismaMock.taskJob.create).not.toHaveBeenCalled();
  });
});
