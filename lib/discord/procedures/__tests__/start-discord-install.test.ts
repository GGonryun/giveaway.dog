import { describe, it, expect, beforeEach } from 'vitest';
import { TeamRole } from '@prisma/client';
import { startDiscordInstall } from '../start-discord-install';
import { prismaMock, knownRequestError } from '@/test/prisma';
import { signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';
import {
  expectedTeamLookup,
  teamWithRole
} from '@/lib/discord/__tests__/fixtures-discord-procedures-workflows';

describe('startDiscordInstall', () => {
  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without touching the database', async () => {
      const result = await startDiscordInstall({ slug: 'acme' });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.state.create).not.toHaveBeenCalled();
    });
  });

  describe('when the input is invalid', () => {
    it('returns UNPROCESSABLE_CONTENT when the slug is missing', async () => {
      signIn();

      const result = await startDiscordInstall(
        {} as unknown as Parameters<typeof startDiscordInstall>[0]
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
      prismaMock.team.findUnique.mockResolvedValue(teamWithRole());
      prismaMock.state.create.mockResolvedValue({ id: 'state-1' });
    });

    it('looks up the team by slug scoped to the caller membership', async () => {
      await startDiscordInstall({ slug: 'acme' });

      expect(prismaMock.team.findUnique).toHaveBeenCalledWith(
        expectedTeamLookup('acme')
      );
    });

    it('creates a state carrying the team and caller identity', async () => {
      await startDiscordInstall({ slug: 'acme' });

      expect(prismaMock.state.create).toHaveBeenCalledWith({
        data: {
          value: {
            teamId: 'team-1',
            userId: TEST_USER.id,
            teamSlug: 'acme'
          }
        },
        select: { id: true }
      });
    });

    it('removes previously pending discord integrations of the team', async () => {
      await startDiscordInstall({ slug: 'acme' });

      expect(prismaMock.integration.deleteMany).toHaveBeenCalledWith({
        where: { teamId: 'team-1', provider: 'DISCORD', status: 'PENDING' }
      });
    });

    it('creates a pending discord integration linked to the new state', async () => {
      await startDiscordInstall({ slug: 'acme' });

      expect(prismaMock.integration.create).toHaveBeenCalledWith({
        data: {
          teamId: 'team-1',
          ownerId: TEST_USER.id,
          provider: 'DISCORD',
          status: 'PENDING',
          stateId: 'state-1',
          settings: {}
        }
      });
    });

    it('returns the new state id as the registration key', async () => {
      const result = await startDiscordInstall({ slug: 'acme' });

      expect(expectOk(result)).toBe('state-1');
    });

    it('creates the state, then clears pending integrations, then creates the integration', async () => {
      await startDiscordInstall({ slug: 'acme' });

      const [stateOrder] = prismaMock.state.create.mock.invocationCallOrder;
      const [deleteOrder] =
        prismaMock.integration.deleteMany.mock.invocationCallOrder;
      const [createOrder] =
        prismaMock.integration.create.mock.invocationCallOrder;
      expect(stateOrder).toBeLessThan(deleteOrder);
      expect(deleteOrder).toBeLessThan(createOrder);
    });

    it('allows a regular member to start the install', async () => {
      prismaMock.team.findUnique.mockResolvedValue(
        teamWithRole(TeamRole.MEMBER)
      );

      const result = await startDiscordInstall({ slug: 'acme' });

      expect(expectOk(result)).toBe('state-1');
    });

    it('returns NOT_FOUND when the team does not exist for the caller', async () => {
      prismaMock.team.findUnique.mockResolvedValue(null);

      const result = await startDiscordInstall({ slug: 'acme' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Team not found');
      expect(prismaMock.state.create).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN when a guest tries to start the install', async () => {
      prismaMock.team.findUnique.mockResolvedValue(
        teamWithRole(TeamRole.GUEST)
      );

      const result = await startDiscordInstall({ slug: 'acme' });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'You do not have permission to perform this action. Required permission: UPDATE_INTEGRATIONS'
      );
      expect(prismaMock.state.create).not.toHaveBeenCalled();
      expect(prismaMock.integration.create).not.toHaveBeenCalled();
    });

    it('maps a prisma error while creating the integration to INTERNAL_SERVER_ERROR, after the state was created', async () => {
      prismaMock.integration.create.mockRejectedValue(
        knownRequestError('P2002')
      );

      const result = await startDiscordInstall({ slug: 'acme' });

      expectFailure(result, 'INTERNAL_SERVER_ERROR');
      expect(prismaMock.state.create).toHaveBeenCalled();
    });

    it('returns UNPROCESSABLE_CONTENT when the created state id is not a string', async () => {
      prismaMock.state.create.mockResolvedValue({ id: null });

      const result = await startDiscordInstall({ slug: 'acme' });

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Output validation failed: /
      );
      expect(prismaMock.integration.create).toHaveBeenCalled();
    });
  });
});
