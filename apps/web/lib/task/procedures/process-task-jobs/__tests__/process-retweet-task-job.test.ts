import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processRetweetTaskJob } from '../process-retweet-task-job';
import { prismaMock, asPrismaClient } from '@/test/prisma';
import {
  TWEET_URL,
  buildTaskJob,
  taskOf
} from '@/lib/task/procedures/__tests__/fixtures-task-procedures-verification';

const m = vi.hoisted(() => ({
  getRetweetedBy: vi.fn(),
  importTwitterUsers: vi.fn()
}));

vi.mock('@/lib/integrations/procedures/get-retweets', () => ({
  getRetweetedBy: m.getRetweetedBy
}));

vi.mock('@/lib/sweepstakes/twitter-import', () => ({
  importTwitterUsers: m.importTwitterUsers
}));

const NOW = new Date('2026-10-01T12:00:00.000Z');
const db = asPrismaClient(prismaMock);
const task = taskOf('TWITTER_RETWEET_IMPORT', 'task-1', {
  importingAccount: 'integration-7'
});

describe('processRetweetTaskJob', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    m.getRetweetedBy.mockReset();
    m.importTwitterUsers.mockReset();
    m.importTwitterUsers.mockResolvedValue({ imported: [], existing: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetches up to 100 retweeting users with the importing integration of the team', async () => {
    m.getRetweetedBy.mockResolvedValue({ data: [] });
    const job = buildTaskJob({
      type: 'TWITTER_RETWEET_IMPORT',
      data: { runs: 0 }
    });

    await processRetweetTaskJob(db, task, job);

    expect(m.getRetweetedBy).toHaveBeenCalledWith(db, {
      teamId: 'team-1',
      integrationId: 'integration-7',
      tweetId: TWEET_URL,
      maxResults: 100
    });
  });

  it('passes a null team id through when the sweepstakes has no team', async () => {
    m.getRetweetedBy.mockResolvedValue({ data: [] });
    const job = buildTaskJob({
      type: 'TWITTER_RETWEET_IMPORT',
      data: { runs: 0 },
      sweepstakes: { teamId: null }
    });

    await processRetweetTaskJob(db, task, job);

    expect(m.getRetweetedBy).toHaveBeenCalledWith(
      db,
      expect.objectContaining({ teamId: null })
    );
  });

  it('imports the retweeting users returned by the twitter api', async () => {
    const users = [
      { id: 'u2', name: 'Two', username: 'two' },
      { id: 'u1', name: 'One', username: 'one' }
    ];
    m.getRetweetedBy.mockResolvedValue({ data: users });
    const job = buildTaskJob({
      type: 'TWITTER_RETWEET_IMPORT',
      data: { runs: 2, lastProcessedId: 'u1' }
    });

    await processRetweetTaskJob(db, task, job);

    expect(m.importTwitterUsers).toHaveBeenCalledWith(db, {
      sweepstakesId: 'sweep-1',
      taskId: 'task-1',
      twitterUsers: [users[0]]
    });
    expect(prismaMock.taskJob.create).toHaveBeenCalledWith({
      data: {
        taskId: 'task-1',
        status: 'PENDING',
        runAt: new Date(NOW.getTime() + 25 * 60 * 1000),
        data: { runs: 3, lastProcessedId: 'u2' }
      }
    });
  });

  it('resolves to undefined', async () => {
    m.getRetweetedBy.mockResolvedValue({ data: [] });
    const job = buildTaskJob({
      type: 'TWITTER_RETWEET_IMPORT',
      data: { runs: 0 }
    });

    await expect(processRetweetTaskJob(db, task, job)).resolves.toBeUndefined();
  });

  it('propagates errors from the twitter api', async () => {
    const failure = new Error('twitter down');
    m.getRetweetedBy.mockRejectedValue(failure);
    const job = buildTaskJob({
      type: 'TWITTER_RETWEET_IMPORT',
      data: { runs: 0 }
    });

    await expect(processRetweetTaskJob(db, task, job)).rejects.toBe(failure);
    expect(prismaMock.taskJob.create).not.toHaveBeenCalled();
  });
});
