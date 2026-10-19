import { beforeEach, describe, expect, it, vi } from 'vitest';
import { asPrismaClient, prismaMock } from '@giveaway/testing-server/prisma';
import { runUserScoring } from '@giveaway/scoring-server/run-user-scoring';
import { runUserTracking } from '@giveaway/scoring-server/run-user-tracking';
import { E2E_MAX_JOB_ROUNDS } from '@giveaway/e2e-model/jobs';
import { scoreE2eUser } from '../scoring';
import { NOW } from './fixtures';

vi.mock('@giveaway/scoring-server/run-user-scoring', () => ({
  runUserScoring: vi.fn()
}));
vi.mock('@giveaway/scoring-server/run-user-tracking', () => ({
  runUserTracking: vi.fn()
}));

const db = asPrismaClient();
const request = { persona: 'participant', ns: 'abc123' } as const;

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1' } as never);
  prismaMock.userQuality.findFirst.mockResolvedValue({
    score: 72,
    createdAt: NOW
  } as never);
  vi.mocked(runUserTracking).mockResolvedValue({
    processed: 0,
    errors: 0,
    total: 0
  });
  vi.mocked(runUserScoring).mockResolvedValue({
    processed: 1,
    errors: 0,
    total: 1
  });
});

describe('scoreE2eUser', () => {
  it('tracks and scores only the persona user, and returns its latest score', async () => {
    vi.mocked(runUserTracking)
      .mockResolvedValueOnce({ processed: 2, errors: 1, total: 3 })
      .mockResolvedValueOnce({ processed: 0, errors: 0, total: 0 });

    expect(await scoreE2eUser({ db, request })).toEqual({
      userId: 'user-1',
      email: 'e2e-participant-abc123@example.com',
      tracking: { processed: 2, errors: 1 },
      scoring: { processed: 1, errors: 0, total: 1 },
      quality: { score: 72, createdAt: NOW }
    });
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'e2e-participant-abc123@example.com' },
      select: { id: true }
    });
    expect(runUserTracking).toHaveBeenCalledWith(db, { userId: 'user-1' });
    expect(runUserScoring).toHaveBeenCalledWith(db, { userId: 'user-1' });
    expect(runUserTracking).toHaveBeenCalledTimes(2);
    expect(prismaMock.userQuality.findFirst).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      select: { score: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
  });

  it('scores after the tracking of every event of the user', async () => {
    vi.mocked(runUserTracking).mockResolvedValue({
      processed: 1,
      errors: 0,
      total: 1
    });

    await scoreE2eUser({ db, request });

    expect(runUserTracking).toHaveBeenCalledTimes(E2E_MAX_JOB_ROUNDS);
    const [lastTracking] = vi
      .mocked(runUserTracking)
      .mock.invocationCallOrder.slice(-1);
    const [scoring] = vi.mocked(runUserScoring).mock.invocationCallOrder;
    expect(lastTracking).toBeLessThan(scoring);
  });

  it('runs nothing for a persona that has not signed in', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(scoreE2eUser({ db, request })).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'User e2e-participant-abc123@example.com not found'
    });
    expect(runUserTracking).not.toHaveBeenCalled();
    expect(runUserScoring).not.toHaveBeenCalled();
  });
});
