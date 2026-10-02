import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processBlueskyLikeTaskJob } from '../process-bluesky-like-task-job';
import { prismaMock, asPrismaClient } from '@giveaway/testing-server/prisma';
import {
  BLUESKY_POST_URL,
  buildTaskJob,
  taskOf
} from '@/lib/task/procedures/__tests__/fixtures-task-procedures-verification';

const m = vi.hoisted(() => ({
  getBlueskyLikes: vi.fn(),
  getLatestTeamBlueskyCredentials: vi.fn(),
  importBlueskyUsers: vi.fn()
}));

vi.mock('@/lib/integrations/procedures/get-bluesky-likes', () => ({
  getBlueskyLikes: m.getBlueskyLikes
}));

vi.mock('@/lib/bluesky/get-latest-team-bluesky-agent', () => ({
  getLatestTeamBlueskyCredentials: m.getLatestTeamBlueskyCredentials
}));

vi.mock('@/lib/sweepstakes/bluesky-import', () => ({
  importBlueskyUsers: m.importBlueskyUsers
}));

const NOW = new Date('2026-10-01T12:00:00.000Z');
const db = asPrismaClient(prismaMock);
const agent = { session: 'agent-session' };
const task = taskOf('BLUESKY_LIKE_IMPORT');
const job = () =>
  buildTaskJob({ type: 'BLUESKY_LIKE_IMPORT', data: { runs: 0 } });

describe('processBlueskyLikeTaskJob', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    m.getBlueskyLikes.mockReset();
    m.getLatestTeamBlueskyCredentials.mockReset();
    m.getLatestTeamBlueskyCredentials.mockResolvedValue({ agent });
    m.importBlueskyUsers.mockReset();
    m.importBlueskyUsers.mockResolvedValue({ imported: [], existing: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetches the likes of the task post with the team agent', async () => {
    m.getBlueskyLikes.mockResolvedValue({ data: [] });

    await processBlueskyLikeTaskJob(db, task, job());

    expect(m.getBlueskyLikes).toHaveBeenCalledWith(db, {
      postUrl: BLUESKY_POST_URL,
      agent
    });
  });

  it('imports the users who liked the post', async () => {
    const users = [{ did: 'did:plc:a', handle: 'a.bsky.social' }];
    m.getBlueskyLikes.mockResolvedValue({ data: users, cursor: 'next' });

    await processBlueskyLikeTaskJob(db, task, job());

    expect(m.importBlueskyUsers).toHaveBeenCalledWith(db, {
      sweepstakesId: 'sweep-1',
      taskId: 'task-1',
      blueskyUsers: users
    });
    expect(prismaMock.taskJob.create).toHaveBeenCalledWith({
      data: {
        taskId: 'task-1',
        status: 'PENDING',
        runAt: new Date(NOW.getTime() + 15 * 60 * 1000),
        data: { runs: 1, lastProcessedDid: 'did:plc:a' }
      }
    });
  });

  it('resolves to undefined', async () => {
    m.getBlueskyLikes.mockResolvedValue({ data: [] });

    await expect(
      processBlueskyLikeTaskJob(db, task, job())
    ).resolves.toBeUndefined();
  });

  it('propagates errors from the bluesky api', async () => {
    const failure = new Error('bluesky down');
    m.getBlueskyLikes.mockRejectedValue(failure);

    await expect(processBlueskyLikeTaskJob(db, task, job())).rejects.toBe(
      failure
    );
    expect(m.importBlueskyUsers).not.toHaveBeenCalled();
  });
});
