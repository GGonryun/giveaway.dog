import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prismaMock, asPrismaClient } from '@giveaway/testing-server/prisma';
import {
  cancelAutomatedPostRun,
  rescheduleAutomatedPostWorkflows,
  startAutomatedPostWorkflow
} from '../start';
import { automatedPostWorkflow } from '../workflow';

const mocks = vi.hoisted(() => ({
  start: vi.fn(),
  get: vi.fn(),
  cancel: vi.fn()
}));

vi.mock('workflow/api', () => ({ start: mocks.start }));

vi.mock('workflow/runtime', () => ({
  getWorld: () => ({ runs: { get: mocks.get, cancel: mocks.cancel } })
}));

vi.mock('../workflow', () => ({ automatedPostWorkflow: vi.fn() }));

const db = asPrismaClient();

describe('cancelAutomatedPostRun', () => {
  beforeEach(() => {
    mocks.get.mockReset();
    mocks.cancel.mockReset().mockResolvedValue(undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(['running', 'pending'])('cancels a %s run', async (status) => {
    mocks.get.mockResolvedValue({ status });

    await cancelAutomatedPostRun('run-1');

    expect(mocks.get).toHaveBeenCalledWith('run-1');
    expect(mocks.cancel).toHaveBeenCalledExactlyOnceWith('run-1');
  });

  it.each(['completed', 'failed', 'cancelled'])(
    'leaves a %s run alone',
    async (status) => {
      mocks.get.mockResolvedValue({ status });

      await cancelAutomatedPostRun('run-1');

      expect(mocks.cancel).not.toHaveBeenCalled();
    }
  );

  it('logs and swallows an error', async () => {
    const error = new Error('world down');
    mocks.get.mockRejectedValue(error);

    await expect(cancelAutomatedPostRun('run-1')).resolves.toBeUndefined();
    expect(console.warn).toHaveBeenCalledWith(
      'Failed to cancel automated post run run-1:',
      error
    );
  });
});

describe('startAutomatedPostWorkflow', () => {
  beforeEach(() => {
    mocks.start.mockReset().mockResolvedValue({ runId: 'run-new' });
    mocks.get.mockReset().mockResolvedValue({ status: 'running' });
    mocks.cancel.mockReset().mockResolvedValue(undefined);
    prismaMock.automatedPostJob.findUnique.mockResolvedValue({
      runId: null
    } as never);
    prismaMock.automatedPostJob.updateMany.mockResolvedValue({ count: 1 });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts nothing when the job no longer exists', async () => {
    prismaMock.automatedPostJob.findUnique.mockResolvedValue(null);

    await startAutomatedPostWorkflow(db, 'job-1');

    expect(prismaMock.automatedPostJob.findUnique).toHaveBeenCalledWith({
      where: { id: 'job-1' },
      select: { runId: true }
    });
    expect(mocks.start).not.toHaveBeenCalled();
    expect(prismaMock.automatedPostJob.updateMany).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('starts a run for the job and saves its id', async () => {
    await startAutomatedPostWorkflow(db, 'job-1');

    expect(mocks.start).toHaveBeenCalledExactlyOnceWith(automatedPostWorkflow, [
      { jobId: 'job-1' }
    ]);
    expect(prismaMock.automatedPostJob.updateMany.mock.calls).toEqual([
      [{ where: { id: 'job-1', runId: null }, data: { runId: null } }],
      [{ where: { id: 'job-1', runId: null }, data: { runId: 'run-new' } }]
    ]);
    expect(mocks.cancel).not.toHaveBeenCalled();
  });

  it('frees the job before it starts the new run, then cancels the old run', async () => {
    prismaMock.automatedPostJob.findUnique.mockResolvedValue({
      runId: 'run-old'
    } as never);

    await startAutomatedPostWorkflow(db, 'job-1');

    expect(prismaMock.automatedPostJob.updateMany).toHaveBeenNthCalledWith(1, {
      where: { id: 'job-1', runId: 'run-old' },
      data: { runId: null }
    });
    const [free, save] =
      prismaMock.automatedPostJob.updateMany.mock.invocationCallOrder;
    const [start] = mocks.start.mock.invocationCallOrder;
    const [cancel] = mocks.cancel.mock.invocationCallOrder;
    expect(free).toBeLessThan(start);
    expect(start).toBeLessThan(save);
    expect(save).toBeLessThan(cancel);
    expect(mocks.cancel).toHaveBeenCalledExactlyOnceWith('run-old');
  });

  it('cancels its own run when another run took the job first', async () => {
    prismaMock.automatedPostJob.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    await startAutomatedPostWorkflow(db, 'job-1');

    expect(mocks.cancel).toHaveBeenCalledExactlyOnceWith('run-new');
  });

  it('logs and swallows an error, so the cron can still run the job', async () => {
    const error = new Error('queue down');
    mocks.start.mockRejectedValue(error);

    await expect(
      startAutomatedPostWorkflow(db, 'job-1')
    ).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledWith(
      'Failed to start the workflow of automated post job job-1:',
      error
    );
    expect(prismaMock.automatedPostJob.updateMany).toHaveBeenCalledTimes(1);
  });
});

describe('rescheduleAutomatedPostWorkflows', () => {
  beforeEach(() => {
    mocks.start.mockReset().mockResolvedValue({ runId: 'run-new' });
    prismaMock.automatedPostJob.findUnique.mockResolvedValue({
      runId: null
    } as never);
    prismaMock.automatedPostJob.updateMany.mockResolvedValue({ count: 1 });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts a new run for each pending post of the sweepstakes', async () => {
    prismaMock.automatedPostJob.findMany.mockResolvedValue([
      { id: 'job-1' },
      { id: 'job-2' }
    ] as never);

    await rescheduleAutomatedPostWorkflows(db, 'sweep-1');

    expect(prismaMock.automatedPostJob.findMany).toHaveBeenCalledWith({
      where: { sweepstakesId: 'sweep-1', status: 'PENDING' },
      select: { id: true }
    });
    expect(mocks.start.mock.calls).toEqual([
      [automatedPostWorkflow, [{ jobId: 'job-1' }]],
      [automatedPostWorkflow, [{ jobId: 'job-2' }]]
    ]);
  });

  it('logs and swallows an error', async () => {
    const error = new Error('db down');
    prismaMock.automatedPostJob.findMany.mockRejectedValue(error);

    await expect(
      rescheduleAutomatedPostWorkflows(db, 'sweep-1')
    ).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledWith(
      'Failed to reschedule the automated posts of sweepstakes sweep-1:',
      error
    );
  });
});
