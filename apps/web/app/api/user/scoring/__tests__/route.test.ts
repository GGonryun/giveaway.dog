import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { UserSource } from '@prisma/client';
import { GET } from '../route';
import {
  createPrismaMock,
  prismaMock,
  type PrismaMock
} from '@giveaway/testing-server/prisma';
import { MAX_SCORING_REQUESTS_PER_RUN } from '@giveaway/scoring-model/user-scoring';
import { IMPORTED_BASE_SCORE } from '@giveaway/scoring-model/schemas/imported';

const CRON_SECRET = 'cron-secret';

const buildRequest = (headers: Record<string, string> = {}) =>
  new NextRequest('http://localhost:3000/api/user/scoring', { headers });

const authorizedRequest = () =>
  buildRequest({ authorization: `Bearer ${CRON_SECRET}` });

const scoringRequest = (id: string, userId: string) => ({
  id,
  userId,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z')
});

describe('GET /api/user/scoring', () => {
  let tx: PrismaMock;

  beforeEach(() => {
    vi.stubEnv('CRON_SECRET', CRON_SECRET);
    tx = createPrismaMock();
    prismaMock.$transaction.mockImplementation(
      async (fn: (client: PrismaMock) => Promise<unknown>) => fn(tx)
    );
    prismaMock.userScoringRequest.findMany.mockResolvedValue([]);
    tx.user.findUnique.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('when the cron secret is not valid', () => {
    it('returns 401 with an error body', async () => {
      const res = await GET(buildRequest({ authorization: 'Bearer wrong' }));

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'Unauthorized' });
    });

    it('does not read any scoring requests', async () => {
      await GET(buildRequest());

      expect(prismaMock.userScoringRequest.findMany).not.toHaveBeenCalled();
    });
  });

  describe('when there are no scoring requests', () => {
    it('reports zero processed requests', async () => {
      const res = await GET(authorizedRequest());

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ processed: 0 });
    });

    it('does not open a transaction', async () => {
      await GET(authorizedRequest());

      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('when scoring requests are queued', () => {
    beforeEach(() => {
      prismaMock.userScoringRequest.findMany.mockResolvedValue([
        scoringRequest('req-1', 'user-1'),
        scoringRequest('req-2', 'user-2')
      ]);
    });

    it('reads a bounded batch of the oldest requests', async () => {
      await GET(authorizedRequest());

      expect(MAX_SCORING_REQUESTS_PER_RUN).toBe(15);
      expect(prismaMock.userScoringRequest.findMany).toHaveBeenCalledWith({
        take: MAX_SCORING_REQUESTS_PER_RUN,
        orderBy: { createdAt: 'asc' }
      });
    });

    it('returns the number of requests that were read', async () => {
      const res = await GET(authorizedRequest());

      expect(await res.json()).toEqual({ processed: 2 });
    });

    it('opens one transaction per request', async () => {
      await GET(authorizedRequest());

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(2);
    });

    it('loads each user through the transaction client', async () => {
      await GET(authorizedRequest());

      expect(tx.user.findUnique).toHaveBeenNthCalledWith(1, {
        where: { id: 'user-1' },
        select: { id: true, source: true, createdAt: true }
      });
      expect(tx.user.findUnique).toHaveBeenNthCalledWith(2, {
        where: { id: 'user-2' },
        select: { id: true, source: true, createdAt: true }
      });
    });

    it('deletes each processed request with the root client instead of the transaction client', async () => {
      await GET(authorizedRequest());

      expect(prismaMock.userScoringRequest.delete).toHaveBeenNthCalledWith(1, {
        where: { id: 'req-1' }
      });
      expect(prismaMock.userScoringRequest.delete).toHaveBeenNthCalledWith(2, {
        where: { id: 'req-2' }
      });
      expect(tx.userScoringRequest.delete).not.toHaveBeenCalled();
    });

    it('deletes a request even when its user no longer exists', async () => {
      await GET(authorizedRequest());

      expect(prismaMock.userScoringRequest.delete).toHaveBeenCalledTimes(2);
      expect(tx.userQuality.create).not.toHaveBeenCalled();
    });

    it('stores a base quality score for imported users', async () => {
      tx.user.findUnique.mockResolvedValue({
        id: 'user-1',
        source: UserSource.TWITTER_IMPORT,
        createdAt: new Date('2026-01-01T00:00:00.000Z')
      });

      await GET(authorizedRequest());

      expect(tx.userQuality.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', score: IMPORTED_BASE_SCORE }
      });
    });

    it('scores a user before deleting its request', async () => {
      await GET(authorizedRequest());

      const [firstScore] = tx.user.findUnique.mock.invocationCallOrder;
      const [firstDelete] =
        prismaMock.userScoringRequest.delete.mock.invocationCallOrder;
      expect(firstScore).toBeLessThan(firstDelete);
    });

    it('rejects and stops processing when scoring a user fails', async () => {
      tx.user.findUnique.mockRejectedValueOnce(new Error('scoring failed'));

      await expect(GET(authorizedRequest())).rejects.toThrow('scoring failed');
      expect(prismaMock.userScoringRequest.delete).not.toHaveBeenCalled();
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    });
  });
});
