import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processBlueskyRepostTaskJob } from '../process-bluesky-repost-task-job';
import { prismaMock, asPrismaClient } from '@giveaway/testing-server/prisma';
import {
  BLUESKY_POST_URL,
  buildTaskJob,
  taskOf
} from '@giveaway/task-model/testing/fixtures-task-procedures-verification';

const m = vi.hoisted(() => ({
  getBlueskyReposts: vi.fn(),
  getLatestTeamBlueskyCredentials: vi.fn(),
  importBlueskyUsers: vi.fn()
}));

vi.mock('@giveaway/bluesky-api/get-bluesky-reposts', () => ({
  getBlueskyReposts: m.getBlueskyReposts
}));

vi.mock('@giveaway/bluesky-api/bluesky/get-latest-team-bluesky-agent', () => ({
  getLatestTeamBlueskyCredentials: m.getLatestTeamBlueskyCredentials
}));

vi.mock('@/lib/sweepstakes/bluesky-import', () => ({
  importBlueskyUsers: m.importBlueskyUsers
}));

const NOW = new Date('2026-10-01T12:00:00.000Z');
const db = asPrismaClient(prismaMock);
const agent = { session: 'agent-session' };
const task = taskOf('BLUESKY_REPOST_IMPORT');
const job = () =>
  buildTaskJob({
    type: 'BLUESKY_REPOST_IMPORT',
    data: { runs: 2, lastProcessedDid: 'did:plc:a' }
  });

describe('processBlueskyRepostTaskJob', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    m.getBlueskyReposts.mockReset();
    m.getLatestTeamBlueskyCredentials.mockReset();
    m.getLatestTeamBlueskyCredentials.mockResolvedValue({ agent });
    m.importBlueskyUsers.mockReset();
    m.importBlueskyUsers.mockResolvedValue({ imported: [], existing: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetches the reposts of the task post with the team agent', async () => {
    m.getBlueskyReposts.mockResolvedValue({ data: [] });

    await processBlueskyRepostTaskJob(db, task, job());

    expect(m.getBlueskyReposts).toHaveBeenCalledWith(db, {
      postUrl: BLUESKY_POST_URL,
      agent
    });
  });

  it('imports the users who reposted since the last processed did', async () => {
    const users = [
      { did: 'did:plc:b', handle: 'b.bsky.social' },
      { did: 'did:plc:a', handle: 'a.bsky.social' }
    ];
    m.getBlueskyReposts.mockResolvedValue({ data: users });

    await processBlueskyRepostTaskJob(db, task, job());

    expect(m.importBlueskyUsers).toHaveBeenCalledWith(db, {
      sweepstakesId: 'sweep-1',
      taskId: 'task-1',
      blueskyUsers: [users[0]]
    });
    expect(prismaMock.taskJob.create).toHaveBeenCalledWith({
      data: {
        taskId: 'task-1',
        status: 'PENDING',
        runAt: new Date(NOW.getTime() + 25 * 60 * 1000),
        data: { runs: 3, lastProcessedDid: 'did:plc:b' }
      }
    });
  });

  it('resolves to undefined', async () => {
    m.getBlueskyReposts.mockResolvedValue({ data: [] });

    await expect(
      processBlueskyRepostTaskJob(db, task, job())
    ).resolves.toBeUndefined();
  });

  it('propagates errors from the bluesky api', async () => {
    const failure = new Error('bluesky down');
    m.getBlueskyReposts.mockRejectedValue(failure);

    await expect(processBlueskyRepostTaskJob(db, task, job())).rejects.toBe(
      failure
    );
    expect(m.importBlueskyUsers).not.toHaveBeenCalled();
  });
});
