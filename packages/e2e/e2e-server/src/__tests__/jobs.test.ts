import { beforeEach, describe, expect, it, vi } from 'vitest';
import { asPrismaClient, prismaMock } from '@giveaway/testing-server/prisma';
import { runTaskJobs } from '@giveaway/task-jobs/run-task-jobs';
import { runSweepstakesJobs } from '@giveaway/sweepstakes-jobs/run-sweepstakes-jobs';
import { runAutomatedPostJobs } from '@giveaway/automation-server/run-automated-post-jobs';
import { E2E_MAX_JOB_ROUNDS } from '@giveaway/e2e-model/jobs';
import { revalidateTag } from 'next/cache';
import { readE2eJobs, runE2eJobs } from '../jobs';
import { realUser, teamRow } from './fixtures';

vi.mock('@giveaway/task-jobs/run-task-jobs', () => ({
  runTaskJobs: vi.fn()
}));
vi.mock('@giveaway/sweepstakes-jobs/run-sweepstakes-jobs', () => ({
  runSweepstakesJobs: vi.fn()
}));
vi.mock('@giveaway/automation-server/run-automated-post-jobs', () => ({
  runAutomatedPostJobs: vi.fn()
}));

const db = asPrismaClient();
const request = { sweepstakesId: 'sw-1' };
const RUN_AT = new Date('2026-10-06T12:00:00.000Z');

const ownedGiveaway = () =>
  prismaMock.sweepstakes.findUnique.mockResolvedValue({
    id: 'sw-1',
    team: teamRow()
  });

const processed = (...counts: number[]) => {
  const mock = vi.fn();
  for (const count of counts) mock.mockResolvedValueOnce({ processed: count });
  return mock.mockResolvedValue({ processed: 0 });
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  prismaMock.sweepstakesJob.findMany.mockResolvedValue([]);
  prismaMock.taskJob.findMany.mockResolvedValue([]);
  prismaMock.automatedPostJob.findMany.mockResolvedValue([]);
  vi.mocked(runTaskJobs).mockResolvedValue({ processed: 0 });
  vi.mocked(runSweepstakesJobs).mockResolvedValue({ processed: 0 });
  vi.mocked(runAutomatedPostJobs).mockResolvedValue({ processed: 0 });
});

describe('readE2eJobs', () => {
  it('reads the three kinds of jobs of an e2e giveaway', async () => {
    ownedGiveaway();
    prismaMock.sweepstakesJob.findMany.mockResolvedValue([
      {
        id: 'job-1',
        type: 'PROCESS_ACTIVATION',
        status: 'COMPLETED',
        runAt: RUN_AT,
        error: null
      }
    ] as never);
    prismaMock.taskJob.findMany.mockResolvedValue([
      { id: 'job-2', taskId: 'task-1', status: 'PENDING', runAt: RUN_AT }
    ] as never);

    expect(await readE2eJobs({ db, request })).toEqual({
      sweepstakesId: 'sw-1',
      jobs: {
        sweepstakes: [
          {
            id: 'job-1',
            type: 'PROCESS_ACTIVATION',
            status: 'COMPLETED',
            runAt: RUN_AT,
            error: null
          }
        ],
        tasks: [
          { id: 'job-2', taskId: 'task-1', status: 'PENDING', runAt: RUN_AT }
        ],
        posts: []
      }
    });
    const order = [{ createdAt: 'asc' }, { id: 'asc' }];
    expect(prismaMock.sweepstakesJob.findMany).toHaveBeenCalledWith({
      where: { sweepstakesId: 'sw-1' },
      select: { id: true, type: true, status: true, runAt: true, error: true },
      orderBy: order,
      take: 100
    });
    expect(prismaMock.taskJob.findMany).toHaveBeenCalledWith({
      where: { task: { sweepstakesId: 'sw-1' } },
      select: { id: true, taskId: true, status: true, runAt: true },
      orderBy: order,
      take: 100
    });
    expect(prismaMock.automatedPostJob.findMany).toHaveBeenCalledWith({
      where: { sweepstakesId: 'sw-1' },
      select: {
        id: true,
        type: true,
        status: true,
        runAt: true,
        response: true
      },
      orderBy: order,
      take: 100
    });
  });

  it('refuses a giveaway of a team with a member who is not an e2e user', async () => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue({
      id: 'sw-1',
      team: teamRow({ members: [{ role: 'OWNER', user: realUser() }] })
    });

    await expect(readE2eJobs({ db, request })).rejects.toMatchObject({
      code: 'NOT_FOUND'
    });
    expect(prismaMock.sweepstakesJob.findMany).not.toHaveBeenCalled();
  });
});

describe('runE2eJobs', () => {
  it('runs only the jobs of the giveaway, in the order of the cron', async () => {
    ownedGiveaway();

    await runE2eJobs({ db, request });

    for (const run of [runTaskJobs, runSweepstakesJobs, runAutomatedPostJobs]) {
      expect(run).toHaveBeenCalledWith(db, { sweepstakesId: 'sw-1' });
    }
    const [tasks] = vi.mocked(runTaskJobs).mock.invocationCallOrder;
    const [sweepstakes] =
      vi.mocked(runSweepstakesJobs).mock.invocationCallOrder;
    const [posts] = vi.mocked(runAutomatedPostJobs).mock.invocationCallOrder;
    expect(tasks).toBeLessThan(sweepstakes);
    expect(sweepstakes).toBeLessThan(posts);
  });

  it('runs again while a round processed a job', async () => {
    ownedGiveaway();
    vi.mocked(runSweepstakesJobs).mockImplementation(processed(5, 2));

    const result = await runE2eJobs({ db, request });

    expect(result).toMatchObject({
      rounds: 3,
      tasks: { ok: true, processed: 0 },
      sweepstakes: { ok: true, processed: 7 },
      posts: { ok: true, processed: 0 }
    });
    expect(runTaskJobs).toHaveBeenCalledTimes(3);
  });

  it('runs one round when nothing is due', async () => {
    ownedGiveaway();

    const result = await runE2eJobs({ db, request });

    expect(result).toMatchObject({
      rounds: 1,
      tasks: { ok: true, processed: 0 },
      sweepstakes: { ok: true, processed: 0 },
      posts: { ok: true, processed: 0 }
    });
  });

  it('runs again when only one processor processed a job', async () => {
    ownedGiveaway();
    vi.mocked(runTaskJobs).mockImplementation(processed(1));

    expect((await runE2eJobs({ db, request })).rounds).toBe(2);
  });

  it(`stops after ${E2E_MAX_JOB_ROUNDS} rounds`, async () => {
    ownedGiveaway();
    vi.mocked(runTaskJobs).mockResolvedValue({ processed: 1 });

    const result = await runE2eJobs({ db, request });

    expect(result.rounds).toBe(E2E_MAX_JOB_ROUNDS);
    expect(runTaskJobs).toHaveBeenCalledTimes(E2E_MAX_JOB_ROUNDS);
  });

  it('reports a processor that throws and still runs the others', async () => {
    ownedGiveaway();
    vi.mocked(runSweepstakesJobs).mockRejectedValue(new Error('db down'));
    vi.mocked(runAutomatedPostJobs).mockImplementation(processed(1));

    const result = await runE2eJobs({ db, request });

    expect(result).toMatchObject({
      rounds: 2,
      sweepstakes: { ok: false, processed: 0, error: 'db down' },
      posts: { ok: true, processed: 1 }
    });
    expect(runSweepstakesJobs).toHaveBeenCalledTimes(1);
  });

  it('reports a processor that throws something that is not an error', async () => {
    ownedGiveaway();
    vi.mocked(runTaskJobs).mockRejectedValue('nope');

    expect((await runE2eJobs({ db, request })).tasks).toEqual({
      ok: false,
      processed: 0,
      error: 'The jobs failed'
    });
  });

  it('expires the cache tags of the giveaway and returns its jobs', async () => {
    ownedGiveaway();

    const result = await runE2eJobs({ db, request });

    expect(result.jobs).toEqual({ sweepstakes: [], tasks: [], posts: [] });
    expect(revalidateTag).toHaveBeenCalledWith('sweepstakes-sw-1', {
      expire: 0
    });
    expect(revalidateTag).not.toHaveBeenCalledWith(
      'public-sweepstakes-list',
      expect.anything()
    );
    expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledTimes(1);
    expect(prismaMock.sweepstakesJob.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sweepstakesId: 'sw-1' } })
    );
  });

  it('runs nothing for a giveaway that is not an e2e giveaway', async () => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

    await expect(runE2eJobs({ db, request })).rejects.toMatchObject({
      code: 'NOT_FOUND'
    });
    expect(runTaskJobs).not.toHaveBeenCalled();
    expect(runSweepstakesJobs).not.toHaveBeenCalled();
    expect(runAutomatedPostJobs).not.toHaveBeenCalled();
  });
});
