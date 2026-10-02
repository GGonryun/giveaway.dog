import { describe, it, expect } from 'vitest';
import getTotalEngagements from '../get-total-engagements';
import {
  X_PICKER_LIKES_KEY,
  X_PICKER_QUOTES_KEY,
  X_PICKER_REPLIES_KEY,
  X_PICKER_RETWEETS_KEY
} from '@/lib/pickers/x/constants';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn } from '@giveaway/testing-server/session';
import { nextCacheMock } from '@giveaway/testing-server/next-cache';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';

const metric = (key: string, value: bigint) => ({
  key,
  value,
  updatedAt: new Date('2026-01-01T00:00:00.000Z')
});

describe('getTotalEngagements', () => {
  describe('query shape', () => {
    it('loads only the four X picker metrics', async () => {
      prismaMock.siteMetric.findMany.mockResolvedValue([]);

      await getTotalEngagements();

      expect(prismaMock.siteMetric.findMany).toHaveBeenCalledWith({
        where: {
          key: {
            in: [
              'x_picker_likes',
              'x_picker_retweets',
              'x_picker_replies',
              'x_picker_quotes'
            ]
          }
        }
      });
    });

    it('caches under the total-engagements key and tag for an hour', async () => {
      prismaMock.siteMetric.findMany.mockResolvedValue([]);

      await getTotalEngagements();

      expect(nextCacheMock.unstable_cache).toHaveBeenCalledWith(
        expect.any(Function),
        ['total-engagements'],
        { tags: ['total-engagements'], revalidate: 3600 }
      );
    });
  });

  describe('result mapping', () => {
    it('returns zeros when no metric rows exist', async () => {
      prismaMock.siteMetric.findMany.mockResolvedValue([]);

      const result = await getTotalEngagements();

      expect(expectOk(result)).toEqual({
        total: 0,
        likes: 0,
        retweets: 0,
        replies: 0,
        quotes: 0
      });
    });

    it('converts each bigint metric to a number and sums them into the total', async () => {
      prismaMock.siteMetric.findMany.mockResolvedValue([
        metric(X_PICKER_LIKES_KEY, BigInt(100)),
        metric(X_PICKER_RETWEETS_KEY, BigInt(20)),
        metric(X_PICKER_REPLIES_KEY, BigInt(3)),
        metric(X_PICKER_QUOTES_KEY, BigInt(4))
      ]);

      const result = await getTotalEngagements();

      expect(expectOk(result)).toEqual({
        total: 127,
        likes: 100,
        retweets: 20,
        replies: 3,
        quotes: 4
      });
    });

    it('treats a missing metric as zero', async () => {
      prismaMock.siteMetric.findMany.mockResolvedValue([
        metric(X_PICKER_LIKES_KEY, BigInt(7)),
        metric(X_PICKER_QUOTES_KEY, BigInt(1))
      ]);

      const result = await getTotalEngagements();

      expect(expectOk(result)).toEqual({
        total: 8,
        likes: 7,
        retweets: 0,
        replies: 0,
        quotes: 1
      });
    });

    it('ignores rows with unrelated keys', async () => {
      prismaMock.siteMetric.findMany.mockResolvedValue([
        metric('other_metric', BigInt(999)),
        metric(X_PICKER_REPLIES_KEY, BigInt(2))
      ]);

      const result = await getTotalEngagements();

      expect(expectOk(result)).toEqual({
        total: 2,
        likes: 0,
        retweets: 0,
        replies: 2,
        quotes: 0
      });
    });

    it('uses the first row when a key appears more than once', async () => {
      prismaMock.siteMetric.findMany.mockResolvedValue([
        metric(X_PICKER_LIKES_KEY, BigInt(5)),
        metric(X_PICKER_LIKES_KEY, BigInt(50))
      ]);

      const result = await getTotalEngagements();

      expect(expectOk(result).likes).toBe(5);
    });

    it('serves signed in callers the same way', async () => {
      signIn();
      prismaMock.siteMetric.findMany.mockResolvedValue([
        metric(X_PICKER_LIKES_KEY, BigInt(1))
      ]);

      const result = await getTotalEngagements();

      expect(expectOk(result).total).toBe(1);
    });
  });

  describe('when the database fails', () => {
    it('returns INTERNAL_SERVER_ERROR with the error message', async () => {
      prismaMock.siteMetric.findMany.mockRejectedValue(new Error('offline'));

      const result = await getTotalEngagements();

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'offline'
      );
    });
  });
});
