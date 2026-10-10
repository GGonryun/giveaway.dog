import { beforeEach, describe, expect, it, vi } from 'vitest';
import { asPrismaClient, prismaMock } from '@giveaway/testing-server/prisma';
import { nextCacheMock } from '@giveaway/testing-server/next-cache';
import { runTaskJobs } from '@giveaway/task-jobs/process-task-jobs';
import { runSweepstakesJobs } from '@giveaway/sweepstakes-jobs/process-sweepstakes-jobs';
import { runAutomatedPostJobs } from '@giveaway/automation-server/process-automated-post-jobs';
import { runTracking } from '@giveaway/scoring-server/tracking';
import { runScoring } from '@giveaway/scoring-server/scoring';
import {
  E2E_MAX_JOB_ROUNDS,
  readE2eJobs,
  runE2eJobs,
  runE2eUserJobs
} from '../jobs';
import { NOW, realUser, teamRow } from './fixtures';

vi.mock('@giveaway/task-jobs/process-task-jobs', () => ({
  runTaskJobs: vi.fn()
}));
vi.mock('@giveaway/sweepstakes-jobs/process-sweepstakes-jobs', () => ({
  runSweepstakesJobs: vi.fn()
}));
vi.mock('@giveaway/automation-server/process-automated-post-jobs', () => ({
  runAutomatedPostJobs: vi.fn()
}));
vi.mock('@giveaway/scoring-server/tracking', () => ({
  runTracking: vi.fn()
}));
vi.mock('@giveaway/scoring-server/scoring', () => ({
  runScoring: vi.fn()
}));

const db = asPrismaClient();

const processed = (count: number) => ({ processed: count });

beforeEach(() => {
  prismaMock.sweepstakes.findUnique.mockResolvedValue({
    id: 'sw-1',
    team: teamRow()
  });
  prismaMock.sweepstakesJob.findMany.mockResolvedValue([]);
  prismaMock.automatedPostJob.findMany.mockResolvedValue([]);
  prismaMock.taskJob.findMany.mockResolvedValue([]);
  vi.mocked(runTaskJobs).mockReset().mockResolvedValue(processed(0));
  vi.mocked(runSweepstakesJobs).mockReset().mockResolvedValue(processed(0));
  vi.mocked(runAutomatedPostJobs).mockReset().mockResolvedValue(processed(0));
});

describe('runE2eJobs', () => {
  it('runs each kind of job for the one giveaway only', async () => {
    await runE2eJobs({ db, request: { sweepstakesId: 'sw-1' } });

    for (const run of [runTaskJobs, runSweepstakesJobs, runAutomatedPostJobs]) {
      expect(run).toHaveBeenCalledWith(db, { sweepstakesId: 'sw-1' });
    }
  });

  it('runs again while a round processes jobs, and adds up the counts', async () => {
    vi.mocked(runSweepstakesJobs)
      .mockResolvedValueOnce(processed(5))
      .mockResolvedValueOnce(processed(2))
      .mockResolvedValue(processed(0));
    vi.mocked(runTaskJobs).mockResolvedValueOnce(processed(1));

    const result = await runE2eJobs({ db, request: { sweepstakesId: 'sw-1' } });

    expect(result).toMatchObject({
      processed: { tasks: 1, sweepstakes: 7, posts: 0 },
      rounds: 3
    });
  });

  it(`stops after ${E2E_MAX_JOB_ROUNDS} rounds`, async () => {
    vi.mocked(runSweepstakesJobs).mockResolvedValue(processed(1));

    const result = await runE2eJobs({ db, request: { sweepstakesId: 'sw-1' } });

    expect(result.rounds).toBe(E2E_MAX_JOB_ROUNDS);
    expect(runSweepstakesJobs).toHaveBeenCalledTimes(E2E_MAX_JOB_ROUNDS);
  });

  it('refuses a giveaway outside e2e and runs nothing', async () => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue({
      id: 'sw-1',
      team: teamRow({
        members: [{ role: 'OWNER', user: realUser() }]
      })
    });

    await expect(
      runE2eJobs({ db, request: { sweepstakesId: 'sw-1' } })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(runTaskJobs).not.toHaveBeenCalled();
    expect(runSweepstakesJobs).not.toHaveBeenCalled();
    expect(runAutomatedPostJobs).not.toHaveBeenCalled();
  });

  it('expires the cache tags of the giveaway after the jobs ran', async () => {
    await runE2eJobs({ db, request: { sweepstakesId: 'sw-1' } });

    expect(nextCacheMock.revalidateTag).toHaveBeenCalledWith(
      'sweepstakes-sw-1',
      {
        expire: 0
      }
    );
  });

  it('returns the jobs of the giveaway after the run', async () => {
    const job = {
      type: 'PROCESS_ACTIVATION',
      status: 'COMPLETED',
      runAt: NOW,
      error: null
    };
    prismaMock.sweepstakesJob.findMany.mockResolvedValue([job]);

    const result = await runE2eJobs({ db, request: { sweepstakesId: 'sw-1' } });

    expect(result.jobs).toEqual({ sweepstakes: [job], posts: [], tasks: [] });
  });
});

describe('readE2eJobs', () => {
  it('reads the three kinds of jobs of the giveaway', async () => {
    await readE2eJobs(db, 'sw-1');

    expect(prismaMock.sweepstakesJob.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sweepstakesId: 'sw-1' } })
    );
    expect(prismaMock.automatedPostJob.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sweepstakesId: 'sw-1' } })
    );
    expect(prismaMock.taskJob.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { task: { sweepstakesId: 'sw-1' } } })
    );
  });

  it('reads nothing for a giveaway that does not exist', async () => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

    await expect(readE2eJobs(db, 'sw-1')).rejects.toMatchObject({
      code: 'NOT_FOUND'
    });
    expect(prismaMock.sweepstakesJob.findMany).not.toHaveBeenCalled();
  });
});

describe('runE2eUserJobs', () => {
  beforeEach(() => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-participant' });
    prismaMock.userQuality.findFirst.mockResolvedValue({ score: 82 });
    vi.mocked(runTracking).mockReset().mockResolvedValue({
      processed: 1,
      errors: 0,
      total: 1
    });
    vi.mocked(runScoring).mockReset().mockResolvedValue(processed(1));
  });

  it('runs tracking, then scoring, for the persona user only', async () => {
    const result = await runE2eUserJobs({
      db,
      request: { persona: 'participant', ns: 'abc123' }
    });

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'e2e-participant-abc123@example.com' },
      select: { id: true }
    });
    expect(runTracking).toHaveBeenCalledWith(db, {
      userId: 'user-participant'
    });
    expect(runScoring).toHaveBeenCalledWith(db, { userId: 'user-participant' });
    expect(vi.mocked(runTracking).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(runScoring).mock.invocationCallOrder[0]
    );
    expect(result).toEqual({
      userId: 'user-participant',
      tracking: { processed: 1, errors: 0, total: 1 },
      scoring: { processed: 1 },
      score: 82
    });
  });

  it('reports no score when the user has none', async () => {
    prismaMock.userQuality.findFirst.mockResolvedValue(null);

    const result = await runE2eUserJobs({
      db,
      request: { persona: 'participant', ns: 'abc123' }
    });

    expect(result.score).toBeNull();
  });

  it('refuses a persona user that does not exist and runs nothing', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      runE2eUserJobs({ db, request: { persona: 'participant', ns: 'abc123' } })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(runTracking).not.toHaveBeenCalled();
    expect(runScoring).not.toHaveBeenCalled();
  });
});
