import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Prisma, TeamRole, UserSource } from '@prisma/client';
import updateWinnerCriteria from '../update-winner-criteria';
import { TEAM_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import { knownRequestError, prismaMock } from '@/test/prisma';
import { signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';
import { nextCacheMock } from '@/test/next-cache';
import {
  SWEEPSTAKES_ID,
  TEAM_SLUG,
  buildMembership,
  buildTeam,
  buildTeamSweepstakes
} from './fixtures-procedures-sweepstakes-b';

type Input = Parameters<typeof updateWinnerCriteria>[0];

const input = (overrides: Partial<Input> = {}): Input => ({
  sweepstakesId: SWEEPSTAKES_ID,
  slug: TEAM_SLUG,
  minTasksCompleted: 2,
  minQualityScore: 60,
  allowMultipleWins: true,
  allowUserSelection: false,
  ...overrides
});

type CriteriaRow = {
  minTasksCompleted: number | null;
  minQualityScore: number | null;
  allowMultipleWins: boolean | null;
  allowUserSelection: boolean | null;
  externalPlatforms: unknown;
};

const criteriaRow = (overrides: Partial<CriteriaRow> = {}): CriteriaRow => ({
  minTasksCompleted: 2,
  minQualityScore: 60,
  allowMultipleWins: true,
  allowUserSelection: false,
  externalPlatforms: null,
  ...overrides
});

describe('updateWinnerCriteria', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    prismaMock.sweepstakes.findUnique.mockResolvedValue(buildTeamSweepstakes());
    prismaMock.sweepstakesWinnerCriteria.update.mockResolvedValue(
      criteriaRow()
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('access control', () => {
    it('returns UNAUTHORIZED when signed out', async () => {
      const result = await updateWinnerCriteria(input());

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });

    it('loads the sweepstakes from the input sweepstakes id scoped to the caller', async () => {
      signIn();

      await updateWinnerCriteria(input());

      expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
        where: {
          id: SWEEPSTAKES_ID,
          team: { members: { some: { userId: TEST_USER.id } } }
        },
        include: TEAM_SWEEPSTAKES_PAYLOAD
      });
    });

    it('returns NOT_FOUND when the sweepstakes is not accessible', async () => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      const result = await updateWinnerCriteria(input());

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Sweepstakes not found'
      );
      expect(
        prismaMock.sweepstakesWinnerCriteria.update
      ).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN for a guest member', async () => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes({
          team: buildTeam({
            members: [buildMembership({ role: TeamRole.GUEST })]
          })
        })
      );

      const result = await updateWinnerCriteria(input());

      expectFailure(result, 'FORBIDDEN');
      expect(
        prismaMock.sweepstakesWinnerCriteria.update
      ).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    beforeEach(() => {
      signIn();
    });

    it.each([
      [
        'minTasksCompleted below one',
        { minTasksCompleted: 0 },
        'minTasksCompleted'
      ],
      [
        'fractional minTasksCompleted',
        { minTasksCompleted: 1.5 },
        'minTasksCompleted'
      ],
      ['negative minQualityScore', { minQualityScore: -1 }, 'minQualityScore'],
      [
        'minQualityScore above 100',
        { minQualityScore: 101 },
        'minQualityScore'
      ],
      [
        'fractional minQualityScore',
        { minQualityScore: 50.5 },
        'minQualityScore'
      ],
      [
        'non boolean allowMultipleWins',
        { allowMultipleWins: 'yes' },
        'allowMultipleWins'
      ],
      [
        'non boolean allowUserSelection',
        { allowUserSelection: 1 },
        'allowUserSelection'
      ],
      [
        'an empty external platform list',
        { externalPlatforms: [] },
        'externalPlatforms'
      ],
      [
        'more than five external platforms',
        {
          externalPlatforms: [
            UserSource.SIGNUP,
            UserSource.ANONYMOUS,
            UserSource.TWITTER_IMPORT,
            UserSource.BLUESKY_IMPORT,
            UserSource.MANUAL_IMPORT,
            UserSource.DISCORD_IMPORT
          ]
        },
        'externalPlatforms'
      ],
      [
        'an unknown external platform',
        { externalPlatforms: ['MYSPACE'] },
        'externalPlatforms'
      ],
      ['a missing slug', { slug: undefined }, 'slug'],
      [
        'a missing sweepstakes id',
        { sweepstakesId: undefined },
        'sweepstakesId'
      ]
    ])('rejects %s', async (_label, overrides, field) => {
      const result = await updateWinnerCriteria(
        input(overrides as unknown as Partial<Input>)
      );

      const failure = expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(failure.message).toMatch(/^Input validation failed: /);
      expect(failure.message).toContain(`"${field}"`);
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });

    it('accepts the boundary values for the thresholds', async () => {
      const result = await updateWinnerCriteria(
        input({ minTasksCompleted: 1, minQualityScore: 0 })
      );

      expectOk(result);
    });

    it('accepts a quality score of exactly 100', async () => {
      const result = await updateWinnerCriteria(
        input({ minQualityScore: 100 })
      );

      expectOk(result);
    });

    it('accepts exactly five external platforms', async () => {
      const result = await updateWinnerCriteria(
        input({
          externalPlatforms: [
            UserSource.SIGNUP,
            UserSource.ANONYMOUS,
            UserSource.TWITTER_IMPORT,
            UserSource.BLUESKY_IMPORT,
            UserSource.MANUAL_IMPORT
          ]
        })
      );

      expectOk(result);
    });
  });

  describe('persisting the criteria', () => {
    beforeEach(() => {
      signIn();
    });

    it('updates the criteria row for the sweepstakes', async () => {
      await updateWinnerCriteria(
        input({ externalPlatforms: [UserSource.TWITTER_IMPORT] })
      );

      expect(prismaMock.sweepstakesWinnerCriteria.update).toHaveBeenCalledWith({
        where: { sweepstakesId: SWEEPSTAKES_ID },
        data: {
          minTasksCompleted: 2,
          minQualityScore: 60,
          allowMultipleWins: true,
          allowUserSelection: false,
          externalPlatforms: [UserSource.TWITTER_IMPORT]
        }
      });
    });

    it('stores a JSON null when external platforms are null', async () => {
      await updateWinnerCriteria(input({ externalPlatforms: null }));

      expect(
        prismaMock.sweepstakesWinnerCriteria.update.mock.calls[0][0].data
          .externalPlatforms
      ).toBe(Prisma.JsonNull);
    });

    it('stores a JSON null when external platforms are omitted', async () => {
      await updateWinnerCriteria(input());

      expect(
        prismaMock.sweepstakesWinnerCriteria.update.mock.calls[0][0].data
          .externalPlatforms
      ).toBe(Prisma.JsonNull);
    });

    it('does not invalidate any cache tags', async () => {
      await updateWinnerCriteria(input());

      expect(nextCacheMock.revalidateTag).not.toHaveBeenCalled();
    });

    it('returns NOT_FOUND when the criteria row does not exist', async () => {
      prismaMock.sweepstakesWinnerCriteria.update.mockRejectedValue(
        knownRequestError('P2025')
      );

      const result = await updateWinnerCriteria(input());

      expectFailure(result, 'NOT_FOUND');
    });
  });

  describe('returned criteria', () => {
    beforeEach(() => {
      signIn();
    });

    it('returns the stored values', async () => {
      prismaMock.sweepstakesWinnerCriteria.update.mockResolvedValue(
        criteriaRow({
          minTasksCompleted: 3,
          minQualityScore: 80,
          allowMultipleWins: false,
          allowUserSelection: true,
          externalPlatforms: [UserSource.DISCORD_IMPORT]
        })
      );

      const result = await updateWinnerCriteria(input());

      expect(expectOk(result)).toEqual({
        minTasksCompleted: 3,
        minQualityScore: 80,
        allowMultipleWins: false,
        allowUserSelection: true,
        externalPlatforms: [UserSource.DISCORD_IMPORT]
      });
    });

    it('falls back to defaults for null stored values', async () => {
      prismaMock.sweepstakesWinnerCriteria.update.mockResolvedValue(
        criteriaRow({
          minTasksCompleted: null,
          minQualityScore: null,
          allowMultipleWins: null,
          allowUserSelection: null,
          externalPlatforms: null
        })
      );

      const result = await updateWinnerCriteria(input());

      expect(expectOk(result)).toEqual({
        minTasksCompleted: 1,
        minQualityScore: 50,
        allowMultipleWins: false,
        allowUserSelection: false,
        externalPlatforms: null
      });
    });

    it('returns null external platforms for an empty stored list', async () => {
      prismaMock.sweepstakesWinnerCriteria.update.mockResolvedValue(
        criteriaRow({ externalPlatforms: '' })
      );

      const result = await updateWinnerCriteria(input());

      expect(expectOk(result).externalPlatforms).toBeNull();
    });

    it('returns VALIDATION_ERROR when stored platforms are malformed', async () => {
      prismaMock.sweepstakesWinnerCriteria.update.mockResolvedValue(
        criteriaRow({ externalPlatforms: ['MYSPACE'] })
      );

      const result = await updateWinnerCriteria(input());

      expect(expectFailure(result, 'VALIDATION_ERROR').message).toBe(
        'Invalid external platforms format'
      );
    });

    it('returns UNPROCESSABLE_CONTENT when stored platforms violate the output limits', async () => {
      prismaMock.sweepstakesWinnerCriteria.update.mockResolvedValue(
        criteriaRow({ externalPlatforms: [] })
      );

      const result = await updateWinnerCriteria(input());

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Output validation failed/
      );
    });
  });
});
