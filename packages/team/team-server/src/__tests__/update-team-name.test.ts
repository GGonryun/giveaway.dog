import { describe, it, expect, beforeEach } from 'vitest';
import { TeamRole } from '@giveaway/db-model';
import updateTeamName from '../update-team-name';
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

describe('updateTeamName', () => {
  describe('authorization', () => {
    it('rejects unauthenticated callers', async () => {
      const result = await updateTeamName({ slug: 'acme', name: 'New Name' });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.team.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    beforeEach(() => {
      signIn();
      prismaMock.team.findFirst.mockResolvedValue(callerTeam(TeamRole.OWNER));
    });

    it('rejects an empty name with the schema message', async () => {
      const result = await updateTeamName({ slug: 'acme', name: '' });

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toContain(
        'Team name must be at least 1 character'
      );
      expect(prismaMock.team.findFirst).not.toHaveBeenCalled();
    });

    it('rejects a name longer than 100 characters', async () => {
      const result = await updateTeamName({
        slug: 'acme',
        name: 'n'.repeat(101)
      });

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toContain(
        'String must contain at most 100 character(s)'
      );
    });

    it('rejects input without a slug', async () => {
      const result = await updateTeamName({
        name: 'New Name'
      } as unknown as Parameters<typeof updateTeamName>[0]);

      expect(inputIssuePaths(result)).toEqual([['slug']]);
      expect(prismaMock.team.findFirst).not.toHaveBeenCalled();
    });

    it('accepts a single character name', async () => {
      const result = await updateTeamName({ slug: 'acme', name: 'n' });

      expectOk(result);
    });

    it('accepts a 100 character name', async () => {
      const result = await updateTeamName({
        slug: 'acme',
        name: 'n'.repeat(100)
      });

      expectOk(result);
    });

    it('saves a whitespace-only name without trimming', async () => {
      await updateTeamName({ slug: 'acme', name: '   ' });

      expect(prismaMock.team.update).toHaveBeenCalledWith({
        where: { id: 'team-1' },
        data: { name: '   ' }
      });
    });
  });

  describe('team lookup and permissions', () => {
    beforeEach(() => {
      signIn();
    });

    it('queries the team with the full caller membership', async () => {
      prismaMock.team.findFirst.mockResolvedValue(callerTeam(TeamRole.OWNER));

      await updateTeamName({ slug: 'acme', name: 'New Name' });

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

      const result = await updateTeamName({ slug: 'acme', name: 'New Name' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Team not found');
      expect(prismaMock.team.update).not.toHaveBeenCalled();
    });

    it.each(rolesExcept(TeamRole.OWNER))(
      'returns FORBIDDEN for a %s because MANAGE_ROLES is required',
      async (role) => {
        prismaMock.team.findFirst.mockResolvedValue(callerTeam(role));

        const result = await updateTeamName({
          slug: 'acme',
          name: 'New Name'
        });

        expect(expectFailure(result, 'FORBIDDEN').message).toBe(
          permissionDeniedMessage('MANAGE_ROLES')
        );
        expect(prismaMock.team.update).not.toHaveBeenCalled();
      }
    );

    it('returns FORBIDDEN when no membership row is returned', async () => {
      prismaMock.team.findFirst.mockResolvedValue(callerTeam(null));

      const result = await updateTeamName({ slug: 'acme', name: 'New Name' });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        NOT_A_MEMBER_MESSAGE
      );
    });
  });

  describe('when the owner renames the team', () => {
    beforeEach(() => {
      signIn();
      prismaMock.team.findFirst.mockResolvedValue(callerTeam(TeamRole.OWNER));
    });

    it('saves the new name and reports success', async () => {
      const result = await updateTeamName({ slug: 'acme', name: 'New Name' });

      expect(expectOk(result)).toEqual({ success: true });
      expect(prismaMock.team.update).toHaveBeenCalledWith({
        where: { id: 'team-1' },
        data: { name: 'New Name' }
      });
    });

    it('does not change the slug', async () => {
      await updateTeamName({ slug: 'acme', name: 'New Name' });

      const [args] = prismaMock.team.update.mock.calls[0];
      expect(args.data).not.toHaveProperty('slug');
    });

    it('maps a prisma P2025 error during the update to NOT_FOUND', async () => {
      prismaMock.team.update.mockRejectedValue(knownRequestError('P2025'));

      const result = await updateTeamName({ slug: 'acme', name: 'New Name' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        PRISMA_NOT_FOUND_MESSAGE
      );
    });
  });
});
