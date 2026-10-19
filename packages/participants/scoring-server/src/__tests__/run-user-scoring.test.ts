import { describe, it, expect, beforeEach } from 'vitest';
import { MAX_SCORING_REQUESTS_PER_RUN } from '@giveaway/scoring-model/user-scoring';
import {
  createPrismaMock,
  prismaMock,
  type PrismaMock,
  asPrismaClient
} from '@giveaway/testing-server/prisma';
import { runUserScoring } from '../run-user-scoring';

const db = asPrismaClient();

const scoringRequest = (id: string, userId: string) => ({
  id,
  userId,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z')
});

describe('runUserScoring', () => {
  let tx: PrismaMock;

  beforeEach(() => {
    tx = createPrismaMock();
    prismaMock.$transaction.mockImplementation(
      async (fn: (client: PrismaMock) => Promise<unknown>) => fn(tx)
    );
    prismaMock.userScoringRequest.findMany.mockResolvedValue([]);
    tx.user.findUnique.mockResolvedValue(null);
  });

  it('reads the oldest scoring requests of every user', async () => {
    await runUserScoring(db);

    expect(prismaMock.userScoringRequest.findMany).toHaveBeenCalledWith({
      take: MAX_SCORING_REQUESTS_PER_RUN,
      orderBy: { createdAt: 'asc' }
    });
  });

  it('reads only the scoring request of one user when it is given', async () => {
    await runUserScoring(db, { userId: 'user-1' });

    expect(prismaMock.userScoringRequest.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      take: MAX_SCORING_REQUESTS_PER_RUN,
      orderBy: { createdAt: 'asc' }
    });
  });

  it('deletes each request it scores and counts them', async () => {
    prismaMock.userScoringRequest.findMany.mockResolvedValue([
      scoringRequest('request-1', 'user-1')
    ]);

    await expect(runUserScoring(db, { userId: 'user-1' })).resolves.toEqual({
      processed: 1
    });
    expect(tx.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-1' } })
    );
    expect(prismaMock.userScoringRequest.delete).toHaveBeenCalledWith({
      where: { id: 'request-1' }
    });
  });
});
