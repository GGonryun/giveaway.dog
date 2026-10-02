import { describe, it, expect, beforeEach } from 'vitest';
import { TeamRole, TeamTier } from '@prisma/client';
import { disconnectDiscord } from '../disconnect-discord';
import { prismaMock, knownRequestError } from '@/test/prisma';
import { signIn } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';
import { nextCacheMock } from '@/test/next-cache';
import {
  expectedTeamLookup,
  teamWithRole
} from '@/lib/discord/__tests__/fixtures-discord-procedures-workflows';

describe('disconnectDiscord', () => {
  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without touching the database', async () => {
      const result = await disconnectDiscord({ slug: 'acme' });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.integration.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('when the input is invalid', () => {
    it('returns UNPROCESSABLE_CONTENT when the slug is missing', async () => {
      signIn();

      const result = await disconnectDiscord(
        {} as unknown as Parameters<typeof disconnectDiscord>[0]
      );

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when the caller is signed in', () => {
    beforeEach(() => {
      signIn();
    });

    it('looks up the team by slug scoped to the caller membership', async () => {
      prismaMock.team.findUnique.mockResolvedValue(teamWithRole());

      await disconnectDiscord({ slug: 'acme' });

      expect(prismaMock.team.findUnique).toHaveBeenCalledWith(
        expectedTeamLookup('acme')
      );
    });

    it('deletes every discord integration of the team and reports success', async () => {
      prismaMock.team.findUnique.mockResolvedValue(teamWithRole());
      prismaMock.integration.deleteMany.mockResolvedValue({ count: 2 });

      const result = await disconnectDiscord({ slug: 'acme' });

      expect(expectOk(result)).toEqual({ success: true });
      expect(prismaMock.integration.deleteMany).toHaveBeenCalledWith({
        where: { teamId: 'team-1', provider: 'DISCORD' }
      });
    });

    it('reports success even when no integration was deleted', async () => {
      prismaMock.team.findUnique.mockResolvedValue(teamWithRole());
      prismaMock.integration.deleteMany.mockResolvedValue({ count: 0 });

      const result = await disconnectDiscord({ slug: 'acme' });

      expect(expectOk(result)).toEqual({ success: true });
    });

    it('allows a regular member to disconnect', async () => {
      prismaMock.team.findUnique.mockResolvedValue(
        teamWithRole(TeamRole.MEMBER)
      );

      const result = await disconnectDiscord({ slug: 'acme' });

      expect(expectOk(result)).toEqual({ success: true });
    });

    it('does not revalidate any cache tag', async () => {
      prismaMock.team.findUnique.mockResolvedValue(teamWithRole());

      await disconnectDiscord({ slug: 'acme' });

      expect(nextCacheMock.revalidateTag).not.toHaveBeenCalled();
    });

    it('returns NOT_FOUND when the team does not exist for the caller', async () => {
      prismaMock.team.findUnique.mockResolvedValue(null);

      const result = await disconnectDiscord({ slug: 'acme' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Team not found');
      expect(prismaMock.integration.deleteMany).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN when the caller has no membership on the team', async () => {
      prismaMock.team.findUnique.mockResolvedValue(
        teamWithRole(TeamRole.OWNER, { userId: 'someone-else' })
      );

      const result = await disconnectDiscord({ slug: 'acme' });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'You are not a member of this team'
      );
      expect(prismaMock.integration.deleteMany).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN when a guest tries to disconnect', async () => {
      prismaMock.team.findUnique.mockResolvedValue(
        teamWithRole(TeamRole.GUEST)
      );

      const result = await disconnectDiscord({ slug: 'acme' });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'You do not have permission to perform this action. Required permission: UPDATE_INTEGRATIONS'
      );
      expect(prismaMock.integration.deleteMany).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN when the team tier is not recognised', async () => {
      prismaMock.team.findUnique.mockResolvedValue(
        teamWithRole(TeamRole.OWNER, {
          tier: 'UNKNOWN' as unknown as TeamTier
        })
      );

      const result = await disconnectDiscord({ slug: 'acme' });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'This feature requires a team with at least the FREE tier.'
      );
    });

    it('maps a prisma error during deletion to INTERNAL_SERVER_ERROR', async () => {
      prismaMock.team.findUnique.mockResolvedValue(teamWithRole());
      prismaMock.integration.deleteMany.mockRejectedValue(
        knownRequestError('P2003')
      );

      const result = await disconnectDiscord({ slug: 'acme' });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toMatch(
        /^We f\*\*\*\*d up\./
      );
    });
  });
});
