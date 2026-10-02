import { describe, it, expect, beforeEach } from 'vitest';
import { IntegrationProvider, TeamRole, TeamTier } from '@prisma/client';
import { disconnectTwitter } from '../disconnect-twitter';
import { prismaMock, knownRequestError } from '@/test/prisma';
import { signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';

const team = (
  role: TeamRole = TeamRole.OWNER,
  tier: TeamTier = TeamTier.PRO
) => ({
  id: 'team-1',
  slug: 'acme',
  tier,
  members: [{ id: 'm-1', userId: TEST_USER.id, role }]
});

const input = { slug: 'acme', integrationId: 'int-1' };

describe('disconnectTwitter', () => {
  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without touching integrations', async () => {
      const result = await disconnectTwitter(input);

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.integration.delete).not.toHaveBeenCalled();
    });
  });

  describe('when the caller is signed in', () => {
    beforeEach(() => {
      signIn();
    });

    it('rejects input without an integration id', async () => {
      const result = await disconnectTwitter({
        slug: 'acme'
      } as unknown as Parameters<typeof disconnectTwitter>[0]);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    });

    it('looks up the team by slug scoped to the caller membership', async () => {
      prismaMock.team.findUnique.mockResolvedValue(team());

      await disconnectTwitter(input);

      expect(prismaMock.team.findUnique).toHaveBeenCalledWith({
        where: { slug: 'acme', members: { some: { userId: TEST_USER.id } } },
        include: { members: true }
      });
    });

    it('returns NOT_FOUND when the team is not found', async () => {
      prismaMock.team.findUnique.mockResolvedValue(null);

      const result = await disconnectTwitter(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Team not found');
      expect(prismaMock.integration.delete).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN for a blocked member', async () => {
      prismaMock.team.findUnique.mockResolvedValue(team(TeamRole.BLOCKED));

      const result = await disconnectTwitter(input);

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'You do not have permission to perform this action. Required permission: UPDATE_INTEGRATIONS'
      );
      expect(prismaMock.integration.delete).not.toHaveBeenCalled();
    });

    it('deletes the twitter integration scoped to the team', async () => {
      prismaMock.team.findUnique.mockResolvedValue(team());

      await disconnectTwitter(input);

      expect(prismaMock.integration.delete).toHaveBeenCalledWith({
        where: {
          id: 'int-1',
          teamId: 'team-1',
          provider: IntegrationProvider.TWITTER
        }
      });
    });

    it('allows a member of a FREE tier team to disconnect', async () => {
      prismaMock.team.findUnique.mockResolvedValue(
        team(TeamRole.MEMBER, TeamTier.FREE)
      );

      const result = await disconnectTwitter(input);

      expect(expectOk(result)).toEqual({ success: true });
      expect(prismaMock.integration.delete).toHaveBeenCalledTimes(1);
    });

    it('returns FORBIDDEN when the team tier is not recognised', async () => {
      prismaMock.team.findUnique.mockResolvedValue(
        team(TeamRole.OWNER, 'LEGACY' as TeamTier)
      );

      const result = await disconnectTwitter(input);

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'This feature requires a team with at least the FREE tier.'
      );
      expect(prismaMock.integration.delete).not.toHaveBeenCalled();
    });

    it('returns success after deleting', async () => {
      prismaMock.team.findUnique.mockResolvedValue(team());
      prismaMock.integration.delete.mockResolvedValue({ id: 'int-1' });

      const result = await disconnectTwitter(input);

      expect(expectOk(result)).toEqual({ success: true });
    });

    it('returns NOT_FOUND when the integration does not belong to the team', async () => {
      prismaMock.team.findUnique.mockResolvedValue(team());
      prismaMock.integration.delete.mockRejectedValue(
        knownRequestError('P2025')
      );

      const result = await disconnectTwitter(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Unable to process your request. The item may no longer exist. Give us a minute before you try again.'
      );
    });
  });
});
