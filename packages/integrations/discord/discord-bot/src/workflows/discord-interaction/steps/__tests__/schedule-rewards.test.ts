import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scheduleRewards } from '../schedule-rewards';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { ensureScoringDrain } from '@giveaway/scoring-jobs/scoring-drain/ensure';

vi.mock('@giveaway/scoring-jobs/scoring-drain/ensure', () => ({
  ensureScoringDrain: vi.fn()
}));

const NOW = new Date('2026-06-01T12:00:00.000Z');

describe('scheduleRewards', () => {
  beforeEach(() => {
    vi.mocked(ensureScoringDrain).mockReset();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('schedules a pending random prize assignment job to run now', async () => {
    await scheduleRewards({ sweepstakesId: 'sweep-1', userId: 'user-9' });

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
      update: {
        status: 'PENDING',
        runAt: NOW
      }
    });
  });

  it('requests a scoring refresh for the user', async () => {
    await scheduleRewards({ sweepstakesId: 'sweep-1', userId: 'user-9' });

    expect(prismaMock.userScoringRequest.upsert).toHaveBeenCalledWith({
      where: { userId: 'user-9' },
      create: { userId: 'user-9' },
      update: { updatedAt: NOW }
    });
  });

  it('starts the scoring drain after the scoring request is written', async () => {
    await scheduleRewards({ sweepstakesId: 'sweep-1', userId: 'user-9' });

    expect(ensureScoringDrain).toHaveBeenCalledTimes(1);
    const [write] =
      prismaMock.userScoringRequest.upsert.mock.invocationCallOrder;
    const [drain] = vi.mocked(ensureScoringDrain).mock.invocationCallOrder;
    expect(write).toBeLessThan(drain);
  });

  it('schedules the prize job before the scoring request', async () => {
    await scheduleRewards({ sweepstakesId: 'sweep-1', userId: 'user-9' });

    const [jobOrder] =
      prismaMock.sweepstakesJob.upsert.mock.invocationCallOrder;
    const [scoringOrder] =
      prismaMock.userScoringRequest.upsert.mock.invocationCallOrder;
    expect(jobOrder).toBeLessThan(scoringOrder);
  });

  it('resolves to undefined', async () => {
    await expect(
      scheduleRewards({ sweepstakesId: 'sweep-1', userId: 'user-9' })
    ).resolves.toBeUndefined();
  });

  it('does not request scoring when scheduling the prize job fails', async () => {
    prismaMock.sweepstakesJob.upsert.mockRejectedValue(new Error('db down'));

    await expect(
      scheduleRewards({ sweepstakesId: 'sweep-1', userId: 'user-9' })
    ).rejects.toThrow('db down');
    expect(prismaMock.userScoringRequest.upsert).not.toHaveBeenCalled();
    expect(ensureScoringDrain).not.toHaveBeenCalled();
  });

  it('propagates a failure of the scoring request', async () => {
    prismaMock.userScoringRequest.upsert.mockRejectedValue(
      new Error('scoring failed')
    );

    await expect(
      scheduleRewards({ sweepstakesId: 'sweep-1', userId: 'user-9' })
    ).rejects.toThrow('scoring failed');
  });
});
