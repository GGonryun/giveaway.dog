import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SCORING_BATCH_SIZE } from '@giveaway/scoring-model/user-scoring';
import {
  createPrismaMock,
  prismaMock,
  type PrismaMock,
  asPrismaClient
} from '@giveaway/testing-server/prisma';
import { runUserScoring } from '../run-user-scoring';

const db = asPrismaClient();

const UPDATED_AT = new Date('2026-01-01T00:00:00.000Z');

const scoringRequest = (id: string, userId: string) => ({
  id,
  userId,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: UPDATED_AT
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
    tx.userScoringRequest.deleteMany.mockResolvedValue({ count: 1 });
    prismaMock.userScoringRequest.deleteMany.mockResolvedValue({ count: 1 });
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('reads a batch of the oldest scoring requests of every user', async () => {
    await expect(runUserScoring(db)).resolves.toEqual({
      processed: 0,
      errors: 0,
      total: 0
    });

    expect(SCORING_BATCH_SIZE).toBe(50);
    expect(prismaMock.userScoringRequest.findMany).toHaveBeenCalledWith({
      take: SCORING_BATCH_SIZE,
      orderBy: { createdAt: 'asc' }
    });
  });

  it('reads only the scoring request of one user when it is given', async () => {
    await runUserScoring(db, { userId: 'user-1' });

    expect(prismaMock.userScoringRequest.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      take: SCORING_BATCH_SIZE,
      orderBy: { createdAt: 'asc' }
    });
  });

  it('deletes each request it scores inside the transaction and counts them', async () => {
    prismaMock.userScoringRequest.findMany.mockResolvedValue([
      scoringRequest('request-1', 'user-1')
    ]);

    await expect(runUserScoring(db, { userId: 'user-1' })).resolves.toEqual({
      processed: 1,
      errors: 0,
      total: 1
    });
    expect(tx.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-1' } })
    );
    expect(tx.userScoringRequest.deleteMany).toHaveBeenCalledWith({
      where: { id: 'request-1', updatedAt: UPDATED_AT }
    });
    expect(prismaMock.userScoringRequest.delete).not.toHaveBeenCalled();
    expect(prismaMock.userScoringRequest.deleteMany).not.toHaveBeenCalled();
  });

  it('keeps a request that was updated while it was scored', async () => {
    prismaMock.userScoringRequest.findMany.mockResolvedValue([
      scoringRequest('request-1', 'user-1')
    ]);
    tx.userScoringRequest.deleteMany.mockResolvedValue({ count: 0 });

    await runUserScoring(db);

    expect(tx.userScoringRequest.deleteMany).toHaveBeenCalledWith({
      where: { id: 'request-1', updatedAt: UPDATED_AT }
    });
    expect(tx.userScoringRequest.delete).not.toHaveBeenCalled();
  });

  describe('when scoring one request fails', () => {
    beforeEach(() => {
      prismaMock.userScoringRequest.findMany.mockResolvedValue([
        scoringRequest('request-1', 'user-1'),
        scoringRequest('request-2', 'user-2')
      ]);
      tx.user.findUnique
        .mockRejectedValueOnce(new Error('bad data'))
        .mockResolvedValue(null);
    });

    it('still scores the requests after it', async () => {
      await expect(runUserScoring(db)).resolves.toEqual({
        processed: 1,
        errors: 1,
        total: 2
      });
      expect(tx.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-2' } })
      );
      expect(tx.userScoringRequest.deleteMany).toHaveBeenCalledTimes(1);
      expect(tx.userScoringRequest.deleteMany).toHaveBeenCalledWith({
        where: { id: 'request-2', updatedAt: UPDATED_AT }
      });
    });

    it('deletes the failed request unless it changed, and logs the error', async () => {
      await runUserScoring(db);

      expect(prismaMock.userScoringRequest.deleteMany).toHaveBeenCalledTimes(1);
      expect(prismaMock.userScoringRequest.deleteMany).toHaveBeenCalledWith({
        where: { id: 'request-1', updatedAt: UPDATED_AT }
      });
      expect(console.error).toHaveBeenCalledWith(
        'Error processing scoring request for user user-1:',
        expect.objectContaining({ message: 'bad data' })
      );
    });

    it('throws when deleting the failed request also fails', async () => {
      prismaMock.userScoringRequest.deleteMany.mockRejectedValue(
        new Error('db down')
      );

      await expect(runUserScoring(db)).rejects.toThrow('db down');
    });
  });
});
