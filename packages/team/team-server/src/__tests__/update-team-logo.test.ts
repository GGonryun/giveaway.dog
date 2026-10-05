import { describe, it, expect, beforeEach } from 'vitest';
import { TeamRole } from '@giveaway/db-model';
import updateTeamLogo from '../update-team-logo';
import { prismaMock, knownRequestError } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import {
  callerMembershipWhere,
  callerTeam,
  inputIssuePaths,
  PRISMA_NOT_FOUND_MESSAGE,
  NOT_A_MEMBER_MESSAGE,
  permissionDeniedMessage,
  rolesExcept
} from '@giveaway/team-testing/testing/fixtures-procedures-teams';

const LOGO = 'https://cdn.example.com/acme.png';

describe('updateTeamLogo', () => {
  describe('authorization', () => {
    it('rejects unauthenticated callers', async () => {
      const result = await updateTeamLogo({ slug: 'acme', logo: LOGO });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.team.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    beforeEach(() => {
      signIn();
    });

    it('rejects an empty logo with both schema messages', async () => {
      const result = await updateTeamLogo({ slug: 'acme', logo: '' });

      const failure = expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(failure.message).toContain('Team logo URL is required');
      expect(failure.message).toContain('Team logo must be a valid URL');
      expect(prismaMock.team.findFirst).not.toHaveBeenCalled();
    });

    it('rejects a logo that is not a url', async () => {
      const result = await updateTeamLogo({ slug: 'acme', logo: 'logo.png' });

      const failure = expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(failure.message).toContain('Team logo must be a valid URL');
      expect(failure.message).not.toContain('Team logo URL is required');
    });

    it('rejects input without a slug', async () => {
      const result = await updateTeamLogo({
        logo: LOGO
      } as unknown as Parameters<typeof updateTeamLogo>[0]);

      expect(inputIssuePaths(result)).toEqual([['slug']]);
      expect(prismaMock.team.findFirst).not.toHaveBeenCalled();
    });

    it('accepts non-http url schemes', async () => {
      prismaMock.team.findFirst.mockResolvedValue(callerTeam(TeamRole.OWNER));

      const result = await updateTeamLogo({
        slug: 'acme',
        logo: 'javascript:alert(1)'
      });

      expectOk(result);
      expect(prismaMock.team.update).toHaveBeenCalledWith({
        where: { id: 'team-1' },
        data: { logo: 'javascript:alert(1)' }
      });
    });
  });

  describe('team lookup and permissions', () => {
    beforeEach(() => {
      signIn();
    });

    it('queries the team with the full caller membership', async () => {
      prismaMock.team.findFirst.mockResolvedValue(callerTeam(TeamRole.OWNER));

      await updateTeamLogo({ slug: 'acme', logo: LOGO });

      expect(prismaMock.team.findFirst).toHaveBeenCalledWith({
        where: callerMembershipWhere('acme'),
        select: {
          id: true,
          members: { where: { userId: TEST_USER.id } }
        }
      });
    });

    it('returns NOT_FOUND when the caller is not on the team', async () => {
      prismaMock.team.findFirst.mockResolvedValue(null);

      const result = await updateTeamLogo({ slug: 'acme', logo: LOGO });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Team not found');
      expect(prismaMock.team.update).not.toHaveBeenCalled();
    });

    it.each(rolesExcept(TeamRole.OWNER))(
      'returns FORBIDDEN for a %s because MANAGE_ROLES is required',
      async (role) => {
        prismaMock.team.findFirst.mockResolvedValue(callerTeam(role));

        const result = await updateTeamLogo({ slug: 'acme', logo: LOGO });

        expect(expectFailure(result, 'FORBIDDEN').message).toBe(
          permissionDeniedMessage('MANAGE_ROLES')
        );
        expect(prismaMock.team.update).not.toHaveBeenCalled();
      }
    );

    it('returns FORBIDDEN when no membership row is returned', async () => {
      prismaMock.team.findFirst.mockResolvedValue(callerTeam(null));

      const result = await updateTeamLogo({ slug: 'acme', logo: LOGO });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        NOT_A_MEMBER_MESSAGE
      );
    });
  });

  describe('when the owner updates the logo', () => {
    beforeEach(() => {
      signIn();
      prismaMock.team.findFirst.mockResolvedValue(callerTeam(TeamRole.OWNER));
    });

    it('saves the new logo and reports success', async () => {
      const result = await updateTeamLogo({ slug: 'acme', logo: LOGO });

      expect(expectOk(result)).toEqual({ success: true });
      expect(prismaMock.team.update).toHaveBeenCalledWith({
        where: { id: 'team-1' },
        data: { logo: LOGO }
      });
    });

    it('maps a prisma P2025 error during the update to NOT_FOUND', async () => {
      prismaMock.team.update.mockRejectedValue(knownRequestError('P2025'));

      const result = await updateTeamLogo({ slug: 'acme', logo: LOGO });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        PRISMA_NOT_FOUND_MESSAGE
      );
    });
  });
});
