import { beforeEach, describe, expect, it } from 'vitest';
import { asPrismaClient, prismaMock } from '@giveaway/testing-server/prisma';
import {
  MAX_SCORING_REQUESTS_PER_RUN,
  MAX_TRACKING_REQUESTS_PER_RUN
} from '@giveaway/scoring-model/user-scoring';
import { runTracking } from '../tracking';
import { runScoring } from '../scoring';

const db = asPrismaClient();

beforeEach(() => {
  prismaMock.userEvent.findMany.mockResolvedValue([]);
  prismaMock.userScoringRequest.findMany.mockResolvedValue([]);
});

describe('runTracking', () => {
  it('reads the oldest events of every user', async () => {
    await runTracking(db);

    expect(prismaMock.userEvent.findMany).toHaveBeenCalledWith({
      take: MAX_TRACKING_REQUESTS_PER_RUN,
      orderBy: { timestamp: 'asc' }
    });
  });

  it('reads only the events of one user when given its id', async () => {
    await runTracking(db, { userId: 'user-1' });

    expect(prismaMock.userEvent.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      take: MAX_TRACKING_REQUESTS_PER_RUN,
      orderBy: { timestamp: 'asc' }
    });
  });

  it('reports the counts of the run', async () => {
    await expect(runTracking(db)).resolves.toEqual({
      processed: 0,
      errors: 0,
      total: 0
    });
  });
});

describe('runScoring', () => {
  it('reads the oldest scoring requests of every user', async () => {
    await runScoring(db);

    expect(prismaMock.userScoringRequest.findMany).toHaveBeenCalledWith({
      take: MAX_SCORING_REQUESTS_PER_RUN,
      orderBy: { createdAt: 'asc' }
    });
  });

  it('reads only the scoring request of one user when given its id', async () => {
    await runScoring(db, { userId: 'user-1' });

    expect(prismaMock.userScoringRequest.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      take: MAX_SCORING_REQUESTS_PER_RUN,
      orderBy: { createdAt: 'asc' }
    });
  });
});
