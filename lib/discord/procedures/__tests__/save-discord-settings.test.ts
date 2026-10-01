import { describe, it, expect, beforeEach } from 'vitest';
import { TeamRole } from '@prisma/client';
import { saveDiscordSettings } from '../save-discord-settings';
import { prismaMock } from '@/test/prisma';
import { signIn } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';
import {
  expectedTeamLookup,
  teamWithRole
} from '@/lib/discord/__tests__/fixtures-discord-procedures-workflows';

const input = {
  slug: 'acme',
  integrationId: 'integration-1',
  channelId: 'channel-9',
  channelName: 'giveaways',
  notifyOnNewGiveaway: true
};

describe('saveDiscordSettings', () => {
  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without touching the database', async () => {
      const result = await saveDiscordSettings(input);

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.integration.update).not.toHaveBeenCalled();
    });
  });

  describe('when the input is invalid', () => {
    beforeEach(() => {
      signIn();
    });

    it('returns UNPROCESSABLE_CONTENT when notifyOnNewGiveaway is not a boolean', async () => {
      const result = await saveDiscordSettings({
        ...input,
        notifyOnNewGiveaway: 'yes'
      } as unknown as Parameters<typeof saveDiscordSettings>[0]);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    });

    it('returns UNPROCESSABLE_CONTENT when the channel name is missing', async () => {
      const result = await saveDiscordSettings({
        slug: 'acme',
        integrationId: 'integration-1',
        channelId: 'channel-9',
        notifyOnNewGiveaway: true
      } as unknown as Parameters<typeof saveDiscordSettings>[0]);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toContain(
        'channelName'
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
        settings: null
      });

      await saveDiscordSettings(input);

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

    it('merges the new channel settings over the existing settings', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({
        id: 'integration-1',
        settings: {
          guild: { id: 'guild-1' },
          channelId: 'channel-old',
          channelName: 'old',
          notifyOnNewGiveaway: false
        }
      });

      const result = await saveDiscordSettings(input);

      expect(expectOk(result)).toEqual({ success: true });
      expect(prismaMock.integration.update).toHaveBeenCalledWith({
        where: { id: 'integration-1' },
        data: {
          settings: {
            guild: { id: 'guild-1' },
            channelId: 'channel-9',
            channelName: 'giveaways',
            notifyOnNewGiveaway: true
          }
        }
      });
    });

    it('starts from empty settings when the integration has none', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({
        id: 'integration-1',
        settings: null
      });

      await saveDiscordSettings({ ...input, notifyOnNewGiveaway: false });

      expect(prismaMock.integration.update).toHaveBeenCalledWith({
        where: { id: 'integration-1' },
        data: {
          settings: {
            channelId: 'channel-9',
            channelName: 'giveaways',
            notifyOnNewGiveaway: false
          }
        }
      });
    });

    it('updates the integration by the id returned from the lookup', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({
        id: 'integration-from-db',
        settings: {}
      });

      await saveDiscordSettings(input);

      expect(prismaMock.integration.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'integration-from-db' } })
      );
    });

    it('returns NOT_FOUND when the integration does not exist', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);

      const result = await saveDiscordSettings(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Discord integration not found'
      );
      expect(prismaMock.integration.update).not.toHaveBeenCalled();
    });

    it('returns NOT_FOUND when the team does not exist for the caller', async () => {
      prismaMock.team.findUnique.mockResolvedValue(null);

      const result = await saveDiscordSettings(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Team not found');
      expect(prismaMock.integration.findFirst).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN when a guest tries to save settings', async () => {
      prismaMock.team.findUnique.mockResolvedValue(
        teamWithRole(TeamRole.GUEST)
      );

      const result = await saveDiscordSettings(input);

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'You do not have permission to perform this action. Required permission: UPDATE_INTEGRATIONS'
      );
      expect(prismaMock.integration.update).not.toHaveBeenCalled();
    });
  });
});
