import { describe, it, expect } from 'vitest';
import { TeamTier } from '@prisma/client';
import {
  TEAM_TIER_LABEL,
  assertMinimumTeamTier,
  hasMinimumTeamTier
} from '../util';
import { ApplicationError } from '../../errors';

const ORDER = [TeamTier.FREE, TeamTier.PRO, TeamTier.ELITE, TeamTier.ALPHA];

const matrix = ORDER.flatMap((teamTier, teamIndex) =>
  ORDER.map(
    (required, requiredIndex) =>
      [teamTier, required, teamIndex >= requiredIndex] as const
  )
);

const catchError = (fn: () => unknown): unknown => {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error('Expected function to throw');
};

describe('team tier utils', () => {
  describe('hasMinimumTeamTier', () => {
    it.each(matrix)(
      'a %s team meets the %s requirement: %s',
      (teamTier, tier, expected) => {
        expect(hasMinimumTeamTier({ tier, team: { tier: teamTier } })).toBe(
          expected
        );
      }
    );

    it('returns false for an unknown required tier', () => {
      expect(
        hasMinimumTeamTier({
          tier: 'PLATINUM' as TeamTier,
          team: { tier: TeamTier.ALPHA }
        })
      ).toBe(false);
    });

    it('returns false when the team tier is unknown', () => {
      expect(
        hasMinimumTeamTier({
          tier: TeamTier.FREE,
          team: { tier: 'LEGACY' as TeamTier }
        })
      ).toBe(false);
    });
  });

  describe('assertMinimumTeamTier', () => {
    it('does not throw when the team meets the tier', () => {
      expect(
        assertMinimumTeamTier({
          tier: TeamTier.PRO,
          team: { tier: TeamTier.ELITE }
        })
      ).toBeUndefined();
    });

    it('throws a FORBIDDEN error naming the required tier', () => {
      const error = catchError(() =>
        assertMinimumTeamTier({
          tier: TeamTier.ELITE,
          team: { tier: TeamTier.PRO }
        })
      );

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'FORBIDDEN',
        message: 'This feature requires a team with at least the ELITE tier.'
      });
    });

    it('throws for an unknown required tier', () => {
      const error = catchError(() =>
        assertMinimumTeamTier({
          tier: 'PLATINUM' as TeamTier,
          team: { tier: TeamTier.ALPHA }
        })
      );

      expect(error).toMatchObject({
        code: 'FORBIDDEN',
        message: 'This feature requires a team with at least the PLATINUM tier.'
      });
    });
  });

  describe('TEAM_TIER_LABEL', () => {
    it('labels every tier', () => {
      expect(TEAM_TIER_LABEL).toEqual({
        FREE: 'Free',
        PRO: 'Pro',
        ELITE: 'Elite',
        ALPHA: 'Alpha'
      });
    });

    it('covers every TeamTier value', () => {
      expect(Object.keys(TEAM_TIER_LABEL).sort()).toEqual(
        Object.values(TeamTier).sort()
      );
    });
  });
});
