import { describe, it, expect, beforeEach } from 'vitest';
import { IntegrationProvider, TeamRole, TeamTier } from '@giveaway/db-model';
import { disconnectBluesky } from '../disconnect-bluesky';
import { prismaMock, knownRequestError } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';

const team = (role: TeamRole = TeamRole.ADMIN) => ({
  id: 'team-1',
  slug: 'acme',
  tier: TeamTier.FREE,
  members: [{ id: 'm-1', userId: TEST_USER.id, role }]
});

describe('disconnectBluesky', () => {
  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without touching integrations', async () => {
      const result = await disconnectBluesky({ slug: 'acme' });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.integration.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('when the caller is signed in', () => {
    beforeEach(() => {
      signIn();
    });

    it('rejects input without a slug', async () => {
      const result = await disconnectBluesky(
        {} as unknown as Parameters<typeof disconnectBluesky>[0]
      );

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    });

    it('looks up the team by slug scoped to the caller membership', async () => {
      prismaMock.team.findUnique.mockResolvedValue(team());

      await disconnectBluesky({ slug: 'acme' });

      expect(prismaMock.team.findUnique).toHaveBeenCalledWith({
        where: { slug: 'acme', members: { some: { userId: TEST_USER.id } } },
        include: { members: true }
      });
    });

    it('returns NOT_FOUND when the team is not found', async () => {
      prismaMock.team.findUnique.mockResolvedValue(null);

      const result = await disconnectBluesky({ slug: 'acme' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Team not found');
      expect(prismaMock.integration.deleteMany).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN for a guest member', async () => {
      prismaMock.team.findUnique.mockResolvedValue(team(TeamRole.GUEST));

      const result = await disconnectBluesky({ slug: 'acme' });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'You do not have permission to perform this action. Required permission: UPDATE_INTEGRATIONS'
      );
      expect(prismaMock.integration.deleteMany).not.toHaveBeenCalled();
    });

    it('deletes every bluesky integration of the team', async () => {
      prismaMock.team.findUnique.mockResolvedValue(team());
      prismaMock.integration.deleteMany.mockResolvedValue({ count: 2 });

      await disconnectBluesky({ slug: 'acme' });

      expect(prismaMock.integration.deleteMany).toHaveBeenCalledWith({
        where: { teamId: 'team-1', provider: IntegrationProvider.BLUESKY }
      });
    });

    it('returns success even when there was nothing to delete', async () => {
      prismaMock.team.findUnique.mockResolvedValue(team(TeamRole.MEMBER));
      prismaMock.integration.deleteMany.mockResolvedValue({ count: 0 });

      const result = await disconnectBluesky({ slug: 'acme' });

      expect(expectOk(result)).toEqual({ success: true });
    });

    it('maps a prisma error while deleting to INTERNAL_SERVER_ERROR', async () => {
      prismaMock.team.findUnique.mockResolvedValue(team());
      prismaMock.integration.deleteMany.mockRejectedValue(
        knownRequestError('P2003')
      );

      const result = await disconnectBluesky({ slug: 'acme' });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toMatch(
        /^We f\*\*\*\*d up\. Try again or contact giveaway\.dog support staff/
      );
    });
  });
});
