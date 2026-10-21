import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import getTeamSweepstake from '../get-team-sweepstake';
import { PARTICIPANT_SWEEPSTAKES_PAYLOAD } from '@giveaway/sweepstakes-model/db';
import { ELIGIBLE_TASK_COMPLETION_INCLUDE_QUERY } from '@giveaway/task-model/queries';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn } from '@giveaway/testing-server/session';
import { nextCacheMock } from '@giveaway/testing-server/next-cache';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { FIXED_NOW } from '@giveaway/testing-server/fixtures-procedures-browse-marketing-pickers';
import {
  describeTeamAccess,
  teamSweepstakes,
  teamSweepstakesQuery
} from '@giveaway/sweepstakes-access/testing/team-sweepstakes';
import { sweepstakesRow } from '../testing/participant-sweepstake';

const input = { sweepstakesId: 'sw-1', slug: 'acme' };

describe('getTeamSweepstake', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describeTeamAccess(
    () => getTeamSweepstake(input),
    () => [prismaMock.sweepstakes.findFirst, prismaMock.taskCompletion.findMany]
  );

  describe('when the caller is a member of the team', () => {
    beforeEach(() => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        teamSweepstakes('GUEST') as never
      );
    });

    it('checks that the sweepstakes belongs to the team of the slug', async () => {
      prismaMock.sweepstakes.findFirst.mockResolvedValue(
        sweepstakesRow() as never
      );
      prismaMock.taskCompletion.findMany.mockResolvedValue([]);

      await getTeamSweepstake(input);

      expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith(
        teamSweepstakesQuery('acme', 'sw-1')
      );
    });

    it('loads the sweepstakes by the id that the team check returned, without the cache', async () => {
      prismaMock.sweepstakes.findFirst.mockResolvedValue(
        sweepstakesRow() as never
      );
      prismaMock.taskCompletion.findMany.mockResolvedValue([]);

      const result = await getTeamSweepstake(input);

      expect(expectOk(result).sweepstakes.id).toBe('sw-1');
      expect(prismaMock.sweepstakes.findFirst).toHaveBeenCalledWith({
        where: { id: 'sw-1' },
        include: PARTICIPANT_SWEEPSTAKES_PAYLOAD
      });
      expect(prismaMock.taskCompletion.findMany).toHaveBeenCalledWith({
        where: { task: { sweepstakesId: 'sw-1' } },
        include: ELIGIBLE_TASK_COMPLETION_INCLUDE_QUERY
      });
      expect(nextCacheMock.unstable_cache).not.toHaveBeenCalled();
    });

    it('returns a draft of the team', async () => {
      prismaMock.sweepstakes.findFirst.mockResolvedValue(
        sweepstakesRow({ status: 'DRAFT' }) as never
      );
      prismaMock.taskCompletion.findMany.mockResolvedValue([]);

      const result = await getTeamSweepstake(input);

      expect(expectOk(result).sweepstakes.status).toBe('DRAFT');
    });

    it('returns NOT_FOUND when the sweepstakes is gone after the team check', async () => {
      prismaMock.sweepstakes.findFirst.mockResolvedValue(null);

      const result = await getTeamSweepstake(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Sweepstakes with ID sw-1 not found'
      );
      expect(prismaMock.taskCompletion.findMany).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    it('returns UNPROCESSABLE_CONTENT without a slug', async () => {
      signIn();

      const result = await getTeamSweepstake({
        sweepstakesId: 'sw-1'
      } as never);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });
  });
});
