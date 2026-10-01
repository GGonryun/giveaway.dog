import { describe, it, expect, beforeEach } from 'vitest';
import { TeamRole } from '@prisma/client';
import { regenerateDiscordKey } from '../regenerate-discord-key';
import { prismaMock, knownRequestError } from '@/test/prisma';
import { signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';
import {
  expectedTeamLookup,
  teamWithRole
} from '@/lib/discord/__tests__/fixtures-discord-procedures-workflows';

const input = { slug: 'acme', integrationId: 'integration-1' };

describe('regenerateDiscordKey', () => {
  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without touching the database', async () => {
      const result = await regenerateDiscordKey(input);

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.state.create).not.toHaveBeenCalled();
    });
  });

  describe('when the input is invalid', () => {
    it('returns UNPROCESSABLE_CONTENT when the integration id is missing', async () => {
      signIn();

      const result = await regenerateDiscordKey({
        slug: 'acme'
      } as unknown as Parameters<typeof regenerateDiscordKey>[0]);

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
      prismaMock.state.create.mockResolvedValue({ id: 'state-new' });
    });

    it('looks up the team by slug scoped to the caller membership', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);

      await regenerateDiscordKey(input);

      expect(prismaMock.team.findUnique).toHaveBeenCalledWith(
        expectedTeamLookup('acme')
      );
    });

    it('looks up the integration by id only, without scoping it to the team', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);

      await regenerateDiscordKey(input);

      expect(prismaMock.integration.findFirst).toHaveBeenCalledWith({
        where: { id: 'integration-1' }
      });
    });

    it('deletes the previous state when the integration has one', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({
        id: 'integration-1',
        stateId: 'state-old'
      });

      await regenerateDiscordKey(input);

      expect(prismaMock.state.delete).toHaveBeenCalledWith({
        where: { id: 'state-old' }
      });
    });

    it('does not delete any state when the integration has none', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({
        id: 'integration-1',
        stateId: null
      });

      await regenerateDiscordKey(input);

      expect(prismaMock.state.delete).not.toHaveBeenCalled();
    });

    it('creates a new state carrying the team and caller identity', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({
        id: 'integration-1',
        stateId: 'state-old'
      });

      await regenerateDiscordKey(input);

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

    it('stores the slug of the team record rather than the requested slug', async () => {
      prismaMock.team.findUnique.mockResolvedValue({
        ...teamWithRole(),
        slug: 'acme-from-db'
      });
      prismaMock.integration.findFirst.mockResolvedValue(null);

      await regenerateDiscordKey(input);

      expect(prismaMock.state.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { value: expect.objectContaining({ teamSlug: 'acme-from-db' }) }
        })
      );
    });

    it('points the integration at the new state and returns the new state id', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({
        id: 'integration-1',
        stateId: 'state-old'
      });

      const result = await regenerateDiscordKey(input);

      expect(expectOk(result)).toBe('state-new');
      expect(prismaMock.integration.update).toHaveBeenCalledWith({
        where: { id: 'integration-1' },
        data: { stateId: 'state-new' }
      });
    });

    it('deletes the old state before creating the new one', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({
        id: 'integration-1',
        stateId: 'state-old'
      });

      await regenerateDiscordKey(input);

      const [deleteOrder] = prismaMock.state.delete.mock.invocationCallOrder;
      const [createOrder] = prismaMock.state.create.mock.invocationCallOrder;
      const [updateOrder] =
        prismaMock.integration.update.mock.invocationCallOrder;
      expect(deleteOrder).toBeLessThan(createOrder);
      expect(createOrder).toBeLessThan(updateOrder);
    });

    it('still creates a new state and tries to update when the integration does not exist', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);

      const result = await regenerateDiscordKey(input);

      expect(expectOk(result)).toBe('state-new');
      expect(prismaMock.state.delete).not.toHaveBeenCalled();
      expect(prismaMock.state.create).toHaveBeenCalled();
      expect(prismaMock.integration.update).toHaveBeenCalledWith({
        where: { id: 'integration-1' },
        data: { stateId: 'state-new' }
      });
    });

    it('returns NOT_FOUND when updating a missing integration fails with P2025, leaving the new state behind', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);
      prismaMock.integration.update.mockRejectedValue(
        knownRequestError('P2025')
      );

      const result = await regenerateDiscordKey(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Unable to process your request. The item may no longer exist. Give us a minute before you try again.'
      );
      expect(prismaMock.state.create).toHaveBeenCalled();
    });

    it('returns UNPROCESSABLE_CONTENT when the created state id is not a string', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);
      prismaMock.state.create.mockResolvedValue({ id: 123 });

      const result = await regenerateDiscordKey(input);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Output validation failed: /
      );
    });

    it('returns NOT_FOUND when the team does not exist for the caller', async () => {
      prismaMock.team.findUnique.mockResolvedValue(null);

      const result = await regenerateDiscordKey(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Team not found');
      expect(prismaMock.integration.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.state.create).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN when a guest tries to regenerate the key', async () => {
      prismaMock.team.findUnique.mockResolvedValue(
        teamWithRole(TeamRole.GUEST)
      );

      const result = await regenerateDiscordKey(input);

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'You do not have permission to perform this action. Required permission: UPDATE_INTEGRATIONS'
      );
      expect(prismaMock.state.create).not.toHaveBeenCalled();
    });
  });
});
