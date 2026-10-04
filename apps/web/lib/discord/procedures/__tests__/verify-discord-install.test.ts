import { describe, it, expect, beforeEach } from 'vitest';
import { IntegrationStatus, TeamRole } from '@prisma/client';
import { verifyDiscordInstall } from '../verify-discord-install';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import {
  expectedTeamLookup,
  teamWithRole
} from '@giveaway/discord-model/testing/fixtures-discord-procedures-workflows';

const input = { slug: 'acme', integrationId: 'integration-1' };

const NOT_ACTIVE_MESSAGE =
  'Integration is not active. Are you sure you completed the installation?';

describe('verifyDiscordInstall', () => {
  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without touching the database', async () => {
      const result = await verifyDiscordInstall(input);

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.integration.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('when the input is invalid', () => {
    it('returns UNPROCESSABLE_CONTENT when the slug is missing', async () => {
      signIn();

      const result = await verifyDiscordInstall({
        integrationId: 'integration-1'
      } as unknown as Parameters<typeof verifyDiscordInstall>[0]);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
    });
  });

  describe('when the caller is signed in', () => {
    beforeEach(() => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(teamWithRole());
    });

    it('looks up the team and the discord integration scoped to that team', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({
        id: 'integration-1',
        status: IntegrationStatus.ACTIVE
      });

      await verifyDiscordInstall(input);

      expect(prismaMock.team.findUnique).toHaveBeenCalledWith(
        expectedTeamLookup('acme')
      );
      expect(prismaMock.integration.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'integration-1',
          teamId: 'team-1',
          provider: 'DISCORD'
        }
      });
    });

    it('reports success when the integration is active', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({
        id: 'integration-1',
        status: IntegrationStatus.ACTIVE
      });

      const result = await verifyDiscordInstall(input);

      expect(expectOk(result)).toEqual({ success: true });
    });

    it('returns CONFLICT when the integration is still pending', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({
        id: 'integration-1',
        status: IntegrationStatus.PENDING
      });

      const result = await verifyDiscordInstall(input);

      expect(expectFailure(result, 'CONFLICT').message).toBe(
        NOT_ACTIVE_MESSAGE
      );
    });

    it('returns CONFLICT when the integration is in an error state', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({
        id: 'integration-1',
        status: IntegrationStatus.ERROR
      });

      const result = await verifyDiscordInstall(input);

      expect(expectFailure(result, 'CONFLICT').message).toBe(
        NOT_ACTIVE_MESSAGE
      );
    });

    it('returns NOT_FOUND when the integration does not exist', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);

      const result = await verifyDiscordInstall(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Integration not found'
      );
    });

    it('returns NOT_FOUND when the team does not exist for the caller', async () => {
      prismaMock.team.findUnique.mockResolvedValue(null);

      const result = await verifyDiscordInstall(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Team not found');
      expect(prismaMock.integration.findFirst).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN when a guest tries to verify the install', async () => {
      prismaMock.team.findUnique.mockResolvedValue(
        teamWithRole(TeamRole.GUEST)
      );

      const result = await verifyDiscordInstall(input);

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'You do not have permission to perform this action. Required permission: UPDATE_INTEGRATIONS'
      );
      expect(prismaMock.integration.findFirst).not.toHaveBeenCalled();
    });

    it('does not modify the integration', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({
        id: 'integration-1',
        status: IntegrationStatus.ACTIVE
      });

      await verifyDiscordInstall(input);

      expect(prismaMock.integration.update).not.toHaveBeenCalled();
    });
  });
});
