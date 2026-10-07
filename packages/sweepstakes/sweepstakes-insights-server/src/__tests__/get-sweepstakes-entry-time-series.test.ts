import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import getSweepstakesEntryTimeSeries from '../get-sweepstakes-entry-time-series';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { nextCacheMock } from '@giveaway/testing-server/next-cache';
import {
  buildTeamSweepstakes,
  SWEEPSTAKES_ID,
  TEAM_SLUG
} from '@giveaway/testing-server/fixtures-procedures-sweepstakes-a';

const input = { sweepstakesId: SWEEPSTAKES_ID, slug: TEAM_SLUG };

const NOW = new Date(2026, 9, 1, 12, 0, 0);

const completionAt = (id: string, at: Date) => ({
  id,
  participantId: 'participant-1',
  taskId: 'task-1',
  completedAt: at,
  proof: null,
  reason: null,
  status: 'COMPLETED'
});

describe('getSweepstakesEntryTimeSeries', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    signIn();
    prismaMock.sweepstakes.findUnique.mockResolvedValue(buildTeamSweepstakes());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when the input is invalid', () => {
    it('rejects a missing sweepstakes id', async () => {
      const result = await getSweepstakesEntryTimeSeries({
        slug: TEAM_SLUG
      } as unknown as Parameters<typeof getSweepstakesEntryTimeSeries>[0]);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(nextCacheMock.unstable_cache).not.toHaveBeenCalled();
      expect(prismaMock.taskCompletion.findMany).not.toHaveBeenCalled();
    });

    it('rejects a missing slug', async () => {
      const result = await getSweepstakesEntryTimeSeries({
        sweepstakesId: SWEEPSTAKES_ID
      } as unknown as Parameters<typeof getSweepstakesEntryTimeSeries>[0]);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when the input is valid', () => {
    beforeEach(() => {
      prismaMock.taskCompletion.findMany.mockResolvedValue([]);
    });

    it('caches the result per sweepstakes for ten minutes', async () => {
      await getSweepstakesEntryTimeSeries(input);

      expect(nextCacheMock.unstable_cache).toHaveBeenCalledWith(
        expect.any(Function),
        [`sweepstakes-entry-time-series-${SWEEPSTAKES_ID}`],
        {
          tags: [
            `sweepstakes-${SWEEPSTAKES_ID}`,
            'sweepstakes-entry-time-series'
          ],
          revalidate: 600
        }
      );
    });

    it('queries completions of the sweepstakes from the last seven days in ascending order', async () => {
      await getSweepstakesEntryTimeSeries(input);

      expect(prismaMock.taskCompletion.findMany).toHaveBeenCalledWith({
        where: {
          task: { sweepstakesId: SWEEPSTAKES_ID },
          completedAt: { gte: new Date(2026, 8, 24, 12, 0, 0) }
        },
        orderBy: { completedAt: 'asc' }
      });
    });

    it('returns an empty series when there are no completions', async () => {
      const result = await getSweepstakesEntryTimeSeries(input);

      expect(expectOk(result)).toEqual([]);
    });

    it('does not revalidate any cache tags', async () => {
      await getSweepstakesEntryTimeSeries(input);

      expect(nextCacheMock.revalidateTag).not.toHaveBeenCalled();
    });
  });

  describe('when the series is already cached', () => {
    const cached = [{ date: '2026-09-30', entries: 3 }];

    beforeEach(() => {
      nextCacheMock.unstable_cache.mockImplementation(() => async () => cached);
    });

    it('returns the cached series to a member without reading completions', async () => {
      const result = await getSweepstakesEntryTimeSeries(input);

      expect(expectOk(result)).toEqual(cached);
      expect(prismaMock.taskCompletion.findMany).not.toHaveBeenCalled();
    });

    it('still checks the membership of each caller', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      const result = await getSweepstakesEntryTimeSeries(input);

      expectFailure(result, 'NOT_FOUND');
    });
  });

  describe('when there are completions', () => {
    it('counts completions per local calendar day in query order', async () => {
      prismaMock.taskCompletion.findMany.mockResolvedValue([
        completionAt('c-1', new Date(2026, 8, 28, 0, 5)),
        completionAt('c-2', new Date(2026, 8, 28, 23, 55)),
        completionAt('c-3', new Date(2026, 8, 30, 9, 0)),
        completionAt('c-4', new Date(2026, 9, 1, 11, 0))
      ]);

      const result = await getSweepstakesEntryTimeSeries(input);

      expect(expectOk(result)).toEqual([
        { date: '2026-09-28', entries: 2 },
        { date: '2026-09-30', entries: 1 },
        { date: '2026-10-01', entries: 1 }
      ]);
    });

    it('omits days without completions instead of filling them with zero', async () => {
      prismaMock.taskCompletion.findMany.mockResolvedValue([
        completionAt('c-1', new Date(2026, 8, 25, 12)),
        completionAt('c-2', new Date(2026, 8, 29, 12))
      ]);

      const result = await getSweepstakesEntryTimeSeries(input);

      expect(expectOk(result)).toHaveLength(2);
    });

    it('keeps the order the database returned the days in', async () => {
      prismaMock.taskCompletion.findMany.mockResolvedValue([
        completionAt('c-1', new Date(2026, 8, 30, 12)),
        completionAt('c-2', new Date(2026, 8, 26, 12)),
        completionAt('c-3', new Date(2026, 8, 30, 13))
      ]);

      const result = await getSweepstakesEntryTimeSeries(input);

      expect(expectOk(result)).toEqual([
        { date: '2026-09-30', entries: 2 },
        { date: '2026-09-26', entries: 1 }
      ]);
    });
  });
});
