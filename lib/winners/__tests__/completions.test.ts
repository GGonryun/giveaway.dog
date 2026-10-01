import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApplicationError } from '@/lib/errors';
import { ELIGIBLE_TASK_COMPLETION_INCLUDE_QUERY } from '@/lib/task/queries';
import { TEAM_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import {
  expandCompletionsByValue,
  getEligibleCompletions,
  isEligibleTaskCompletion,
  toUserCompletionCounts
} from '../completions';
import type { SweepstakesCriteriaSchema } from '../criteria';
import { asPrismaClient, prismaMock } from '@/test/prisma';
import { TEST_USER } from '@/test/session';
import {
  bonusTaskConfig,
  buildCompletion,
  buildTeamSweepstakes,
  twitterLikeImportTaskConfig,
  twitterProof
} from './fixtures-sweepstakes-winners-email';

type EligibilityCriteria = Parameters<
  typeof isEligibleTaskCompletion
>[0]['criteria'];

const criteria = (
  overrides: Partial<SweepstakesCriteriaSchema> = {}
): SweepstakesCriteriaSchema => ({
  minQualityScore: 0,
  minTasksCompleted: 0,
  allowMultipleWins: false,
  allowUserSelection: false,
  externalPlatforms: null,
  ...overrides
});

const eligibility = (
  overrides: Partial<EligibilityCriteria> = {},
  counts: [string, number][] = [['user-a', 1]]
) =>
  isEligibleTaskCompletion({
    userCompletionCounts: new Map(counts),
    criteria: criteria(overrides)
  });

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('expandCompletionsByValue', () => {
  it('returns an empty list for no completions', () => {
    expect(expandCompletionsByValue([])).toEqual([]);
  });

  it('adds the task value to each completion and keeps its fields', () => {
    const completion = buildCompletion({ taskConfig: bonusTaskConfig(3) });

    expect(expandCompletionsByValue([completion])).toEqual([
      { ...completion, value: 3 }
    ]);
  });

  it('preserves completion order', () => {
    const first = buildCompletion({
      id: 'c-1',
      taskConfig: bonusTaskConfig(2)
    });
    const second = buildCompletion({
      id: 'c-2',
      taskConfig: bonusTaskConfig(5)
    });

    expect(
      expandCompletionsByValue([first, second]).map((c) => [c.id, c.value])
    ).toEqual([
      ['c-1', 2],
      ['c-2', 5]
    ]);
  });

  it('adds the verified bonus for a verified twitter import proof', () => {
    const completion = buildCompletion({
      taskConfig: twitterLikeImportTaskConfig(2, 3),
      proof: twitterProof(true)
    });

    expect(expandCompletionsByValue([completion])[0].value).toBe(5);
  });

  it('uses the base value for an unverified twitter import proof', () => {
    const completion = buildCompletion({
      taskConfig: twitterLikeImportTaskConfig(2, 3),
      proof: twitterProof(false)
    });

    expect(expandCompletionsByValue([completion])[0].value).toBe(2);
  });

  it('throws when a task config cannot be parsed', () => {
    const completion = buildCompletion({ taskConfig: { type: 'BONUS_TASK' } });

    expect(() => expandCompletionsByValue([completion])).toThrow(
      'Failed to parse task config'
    );
  });
});

describe('toUserCompletionCounts', () => {
  it('returns an empty map for no completions', () => {
    expect(toUserCompletionCounts([]).size).toBe(0);
  });

  it('counts completions per participant user id', () => {
    const counts = toUserCompletionCounts([
      buildCompletion({ id: 'c-1', userId: 'user-a' }),
      buildCompletion({ id: 'c-2', userId: 'user-b' }),
      buildCompletion({ id: 'c-3', userId: 'user-a' })
    ]);

    expect(Object.fromEntries(counts)).toEqual({ 'user-a': 2, 'user-b': 1 });
  });
});

describe('isEligibleTaskCompletion', () => {
  describe('external platform filter', () => {
    it('ignores the source when external platforms is null', () => {
      expect(
        eligibility({ externalPlatforms: null })(
          buildCompletion({ source: 'TWITCH_IMPORT' })
        )
      ).toBe(true);
    });

    it('ignores the source when external platforms is empty', () => {
      expect(
        eligibility({ externalPlatforms: [] })(
          buildCompletion({ source: 'TWITCH_IMPORT' })
        )
      ).toBe(true);
    });

    it('accepts a user whose source is listed', () => {
      expect(
        eligibility({ externalPlatforms: ['TWITTER_IMPORT', 'SIGNUP'] })(
          buildCompletion({ source: 'SIGNUP' })
        )
      ).toBe(true);
    });

    it('rejects a user whose source is not listed', () => {
      expect(
        eligibility({ externalPlatforms: ['TWITTER_IMPORT'] })(
          buildCompletion({ source: 'SIGNUP' })
        )
      ).toBe(false);
    });
  });

  describe('quality score', () => {
    it('accepts a score equal to the minimum', () => {
      expect(
        eligibility({ minQualityScore: 50 })(
          buildCompletion({ qualityScore: 50 })
        )
      ).toBe(true);
    });

    it('rejects a score below the minimum', () => {
      expect(
        eligibility({ minQualityScore: 50 })(
          buildCompletion({ qualityScore: 49 })
        )
      ).toBe(false);
    });

    it('treats a user without quality records as score zero', () => {
      const completion = buildCompletion({ qualityScore: null });

      expect(eligibility({ minQualityScore: 0 })(completion)).toBe(true);
      expect(eligibility({ minQualityScore: 1 })(completion)).toBe(false);
    });
  });

  describe('minimum tasks completed', () => {
    it('accepts a user whose completion count equals the minimum', () => {
      expect(
        eligibility({ minTasksCompleted: 2 }, [['user-a', 2]])(
          buildCompletion()
        )
      ).toBe(true);
    });

    it('rejects a user with fewer completions than the minimum', () => {
      expect(
        eligibility({ minTasksCompleted: 2 }, [['user-a', 1]])(
          buildCompletion()
        )
      ).toBe(false);
    });

    it('treats a user missing from the counts as zero completions', () => {
      const completion = buildCompletion({ userId: 'user-z' });

      expect(eligibility({ minTasksCompleted: 0 })(completion)).toBe(true);
      expect(eligibility({ minTasksCompleted: 1 })(completion)).toBe(false);
    });
  });
});

describe('getEligibleCompletions', () => {
  const db = asPrismaClient();
  const user = TEST_USER as unknown as Parameters<
    typeof getEligibleCompletions
  >[0]['user'];

  const run = (overrides: Partial<SweepstakesCriteriaSchema> = {}) =>
    getEligibleCompletions({
      db,
      user,
      sweepstakesId: 'sw-1',
      criteria: criteria(overrides)
    });

  beforeEach(() => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue(
      buildTeamSweepstakes({ userId: TEST_USER.id })
    );
  });

  describe('authorization', () => {
    it('looks up the sweepstakes through a team the user belongs to', async () => {
      prismaMock.taskCompletion.findMany.mockResolvedValue([buildCompletion()]);

      await run();

      expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'sw-1',
          team: { members: { some: { userId: TEST_USER.id } } }
        },
        include: TEAM_SWEEPSTAKES_PAYLOAD
      });
    });

    it('throws NOT_FOUND when the user cannot see the sweepstakes', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      const error = await run().catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'NOT_FOUND',
        message: 'Sweepstakes not found'
      });
      expect(prismaMock.taskCompletion.findMany).not.toHaveBeenCalled();
    });

    it('throws FORBIDDEN when the user has no membership on the team', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes({ userId: 'someone-else' })
      );

      await expect(run()).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: 'You are not a member of this team'
      });
    });

    it('throws FORBIDDEN when the member role cannot view sweepstakes', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes({ userId: TEST_USER.id, role: 'BLOCKED' })
      );

      await expect(run()).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message:
          'You do not have permission to perform this action. Required permission: VIEW_SWEEPSTAKES'
      });
    });

    it('allows a guest member on a free team', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes({ userId: TEST_USER.id, role: 'GUEST' })
      );
      prismaMock.taskCompletion.findMany.mockResolvedValue([buildCompletion()]);

      await expect(run()).resolves.toHaveLength(1);
    });
  });

  describe('completion query', () => {
    it('loads non rejected completions of the sweepstakes tasks', async () => {
      prismaMock.taskCompletion.findMany.mockResolvedValue([buildCompletion()]);

      await run();

      expect(prismaMock.taskCompletion.findMany).toHaveBeenCalledWith({
        where: {
          task: { sweepstakesId: 'sw-1' },
          status: { notIn: ['REJECTED'] }
        },
        include: ELIGIBLE_TASK_COMPLETION_INCLUDE_QUERY
      });
    });
  });

  describe('filtering', () => {
    it('returns only eligible completions expanded with their value', async () => {
      const good = buildCompletion({
        id: 'c-good',
        userId: 'user-a',
        qualityScore: 80,
        taskConfig: bonusTaskConfig(4)
      });
      const bad = buildCompletion({
        id: 'c-bad',
        userId: 'user-b',
        qualityScore: 10
      });
      prismaMock.taskCompletion.findMany.mockResolvedValue([good, bad]);

      await expect(run({ minQualityScore: 50 })).resolves.toEqual([
        { ...good, value: 4 }
      ]);
    });

    it('counts all of a user completions toward the minimum task requirement', async () => {
      prismaMock.taskCompletion.findMany.mockResolvedValue([
        buildCompletion({ id: 'c-1', userId: 'user-a' }),
        buildCompletion({ id: 'c-2', userId: 'user-a' }),
        buildCompletion({ id: 'c-3', userId: 'user-b' })
      ]);

      const result = await run({ minTasksCompleted: 2 });

      expect(result.map((c) => c.id)).toEqual(['c-1', 'c-2']);
    });

    it('throws VALIDATION_ERROR when no completion meets the criteria', async () => {
      prismaMock.taskCompletion.findMany.mockResolvedValue([
        buildCompletion({ qualityScore: 10 })
      ]);

      await expect(run({ minQualityScore: 50 })).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'No eligible participants meet the criteria'
      });
    });

    it('throws VALIDATION_ERROR when there are no completions at all', async () => {
      prismaMock.taskCompletion.findMany.mockResolvedValue([]);

      await expect(run()).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'No eligible participants meet the criteria'
      });
    });
  });
});
