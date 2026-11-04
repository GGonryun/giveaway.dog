import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { loadAutomatedPostJob, postAutomatedPostJob } from '../steps';

const mocks = vi.hoisted(() => ({
  getWorkflowMetadata: vi.fn(),
  runAutomatedPostJob: vi.fn()
}));

vi.mock('workflow', () => ({
  getWorkflowMetadata: mocks.getWorkflowMetadata
}));

vi.mock('../../run-automated-post-jobs', () => ({
  runAutomatedPostJob: mocks.runAutomatedPostJob
}));

const NOW = new Date('2026-11-05T18:00:00.000Z');
const LATER = new Date('2026-11-05T19:00:00.000Z');

describe('loadAutomatedPostJob', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    mocks.getWorkflowMetadata.mockReturnValue({ workflowRunId: 'run-1' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reads the status, run time and run of the job', async () => {
    prismaMock.automatedPostJob.findUnique.mockResolvedValue(null);

    await loadAutomatedPostJob({ jobId: 'job-1' });

    expect(prismaMock.automatedPostJob.findUnique).toHaveBeenCalledWith({
      where: { id: 'job-1' },
      select: { status: true, runAt: true, runId: true }
    });
  });

  it('returns null when the job no longer exists', async () => {
    prismaMock.automatedPostJob.findUnique.mockResolvedValue(null);

    await expect(loadAutomatedPostJob({ jobId: 'job-1' })).resolves.toBeNull();
  });

  it.each(['IN_PROGRESS', 'COMPLETED', 'FAILED'])(
    'returns null when the job is %s',
    async (status) => {
      prismaMock.automatedPostJob.findUnique.mockResolvedValue({
        status,
        runAt: NOW,
        runId: 'run-1'
      } as never);

      await expect(
        loadAutomatedPostJob({ jobId: 'job-1' })
      ).resolves.toBeNull();
    }
  );

  it('returns null when another run took over the job', async () => {
    prismaMock.automatedPostJob.findUnique.mockResolvedValue({
      status: 'PENDING',
      runAt: NOW,
      runId: 'run-2'
    } as never);

    await expect(loadAutomatedPostJob({ jobId: 'job-1' })).resolves.toBeNull();
  });

  it('returns a due job of this run', async () => {
    prismaMock.automatedPostJob.findUnique.mockResolvedValue({
      status: 'PENDING',
      runAt: NOW,
      runId: 'run-1'
    } as never);

    await expect(loadAutomatedPostJob({ jobId: 'job-1' })).resolves.toEqual({
      runAt: NOW.toISOString(),
      due: true
    });
  });

  it('returns a job that is not due yet, before its run is saved', async () => {
    prismaMock.automatedPostJob.findUnique.mockResolvedValue({
      status: 'PENDING',
      runAt: LATER,
      runId: null
    } as never);

    await expect(loadAutomatedPostJob({ jobId: 'job-1' })).resolves.toEqual({
      runAt: LATER.toISOString(),
      due: false
    });
  });

  it('returns a job one millisecond before its run time as not due', async () => {
    prismaMock.automatedPostJob.findUnique.mockResolvedValue({
      status: 'PENDING',
      runAt: new Date(NOW.getTime() + 1),
      runId: 'run-1'
    } as never);

    await expect(
      loadAutomatedPostJob({ jobId: 'job-1' })
    ).resolves.toMatchObject({ due: false });
  });
});

describe('postAutomatedPostJob', () => {
  it('runs the job with the database and returns whether it claimed it', async () => {
    mocks.runAutomatedPostJob.mockResolvedValue(true);

    await expect(postAutomatedPostJob({ jobId: 'job-1' })).resolves.toBe(true);

    expect(mocks.runAutomatedPostJob).toHaveBeenCalledWith(prismaMock, {
      jobId: 'job-1'
    });
  });
});
