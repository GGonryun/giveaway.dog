import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TeamRole } from '@prisma/client';
import { getDiscordChannels } from '../get-discord-channels';
import { prismaMock } from '@/test/prisma';
import { signIn } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';
import {
  expectedTeamLookup,
  jsonResponse,
  teamWithRole
} from '@/lib/discord/__tests__/fixtures-discord-procedures-workflows';

const input = { slug: 'acme', integrationId: 'integration-1' };

const integration = {
  id: 'integration-1',
  teamId: 'team-1',
  provider: 'DISCORD',
  account_id: 'guild-42'
};

describe('getDiscordChannels', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    vi.stubEnv('DISCORD_BOT_TOKEN', 'bot-token');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without calling discord', async () => {
      const result = await getDiscordChannels(input);

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('when the input is invalid', () => {
    it('returns UNPROCESSABLE_CONTENT when the integration id is missing', async () => {
      signIn();

      const result = await getDiscordChannels({
        slug: 'acme'
      } as unknown as Parameters<typeof getDiscordChannels>[0]);

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
      prismaMock.integration.findFirst.mockResolvedValue(integration);
    });

    it('looks up the team and the discord integration scoped to that team', async () => {
      fetchMock.mockResolvedValue(jsonResponse([]));

      await getDiscordChannels(input);

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

    it('requests the guild channels with the bot token', async () => {
      fetchMock.mockResolvedValue(jsonResponse([]));

      await getDiscordChannels(input);

      expect(fetchMock).toHaveBeenCalledWith(
        'https://discord.com/api/v10/guilds/guild-42/channels',
        { headers: { Authorization: 'Bot bot-token' } }
      );
    });

    it('requests a guild named null when the integration has no guild id yet', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({
        ...integration,
        account_id: null
      });
      fetchMock.mockResolvedValue(jsonResponse([]));

      await getDiscordChannels(input);

      expect(fetchMock).toHaveBeenCalledWith(
        'https://discord.com/api/v10/guilds/null/channels',
        expect.any(Object)
      );
    });

    it('sends the literal string undefined when the bot token is not configured', async () => {
      vi.stubEnv('DISCORD_BOT_TOKEN', undefined);
      fetchMock.mockResolvedValue(jsonResponse([]));

      await getDiscordChannels(input);

      expect(fetchMock).toHaveBeenCalledWith(expect.any(String), {
        headers: { Authorization: 'Bot undefined' }
      });
    });

    it('returns only text channels mapped to id and name, sorted by name', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse([
          { id: 'c-3', name: 'zebra', type: 0, position: 1 },
          { id: 'c-voice', name: 'voice', type: 2, position: 2 },
          { id: 'c-1', name: 'announcements', type: 0, position: 3 },
          { id: 'c-cat', name: 'category', type: 4, position: 4 },
          { id: 'c-2', name: 'general', type: 0, position: 5 }
        ])
      );

      const result = await getDiscordChannels(input);

      expect(expectOk(result)).toEqual({
        channels: [
          { id: 'c-1', name: 'announcements' },
          { id: 'c-2', name: 'general' },
          { id: 'c-3', name: 'zebra' }
        ]
      });
    });

    it('returns an empty list when the guild has no text channels', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse([{ id: 'c-voice', name: 'voice', type: 2 }])
      );

      const result = await getDiscordChannels(input);

      expect(expectOk(result)).toEqual({ channels: [] });
    });

    it('allows a guest to list channels', async () => {
      prismaMock.team.findUnique.mockResolvedValue(
        teamWithRole(TeamRole.GUEST)
      );
      fetchMock.mockResolvedValue(jsonResponse([]));

      const result = await getDiscordChannels(input);

      expect(expectOk(result)).toEqual({ channels: [] });
    });

    it('returns FORBIDDEN for a blocked member', async () => {
      prismaMock.team.findUnique.mockResolvedValue(
        teamWithRole(TeamRole.BLOCKED)
      );

      const result = await getDiscordChannels(input);

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'You do not have permission to perform this action. Required permission: VIEW_INTEGRATIONS'
      );
      expect(prismaMock.integration.findFirst).not.toHaveBeenCalled();
    });

    it('returns NOT_FOUND when the team does not exist for the caller', async () => {
      prismaMock.team.findUnique.mockResolvedValue(null);

      const result = await getDiscordChannels(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Team not found');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('returns NOT_FOUND when the integration does not exist', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);

      const result = await getDiscordChannels(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Discord integration not found'
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('returns INTERNAL_SERVER_ERROR when discord responds with an error status', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ message: 'Missing Access' }, { status: 403 })
      );

      const result = await getDiscordChannels(input);

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Failed to fetch Discord channels'
      );
    });

    it('returns INTERNAL_SERVER_ERROR with the network error message when fetch rejects', async () => {
      fetchMock.mockRejectedValue(new Error('socket hang up'));

      const result = await getDiscordChannels(input);

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'socket hang up'
      );
    });

    it('returns INTERNAL_SERVER_ERROR when discord returns a non-array payload', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ channels: [] }));

      const result = await getDiscordChannels(input);

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'allChannels.filter is not a function'
      );
    });

    it('returns UNPROCESSABLE_CONTENT when a text channel has no id', async () => {
      fetchMock.mockResolvedValue(jsonResponse([{ name: 'general', type: 0 }]));

      const result = await getDiscordChannels(input);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Output validation failed: /
      );
    });
  });
});
