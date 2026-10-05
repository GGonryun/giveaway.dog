import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TeamRole } from '@giveaway/db-model';
import { getDiscordRoles } from '../get-discord-roles';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import {
  expectedTeamLookup,
  jsonResponse,
  teamWithRole
} from '@giveaway/discord-model/testing/fixtures-discord-procedures-workflows';

const input = { slug: 'acme', integrationId: 'integration-1' };

const integration = {
  id: 'integration-1',
  teamId: 'team-1',
  provider: 'DISCORD',
  account_id: 'guild-42'
};

const role = (
  id: string,
  name: string,
  position: number,
  extra: Record<string, unknown> = {}
) => ({
  id,
  name,
  color: 0,
  position,
  hoist: false,
  managed: false,
  mentionable: true,
  permissions: '0',
  ...extra
});

describe('getDiscordRoles', () => {
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
      const result = await getDiscordRoles(input);

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('when the input is invalid', () => {
    it('returns UNPROCESSABLE_CONTENT when the slug is not a string', async () => {
      signIn();

      const result = await getDiscordRoles({
        slug: 42,
        integrationId: 'integration-1'
      } as unknown as Parameters<typeof getDiscordRoles>[0]);

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

      await getDiscordRoles(input);

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

    it('requests the guild roles with the bot token', async () => {
      fetchMock.mockResolvedValue(jsonResponse([]));

      await getDiscordRoles(input);

      expect(fetchMock).toHaveBeenCalledWith(
        'https://discord.com/api/v10/guilds/guild-42/roles',
        { headers: { Authorization: 'Bot bot-token' } }
      );
    });

    it('requests a guild named null when the integration has no guild id yet', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({
        ...integration,
        account_id: null
      });
      fetchMock.mockResolvedValue(jsonResponse([]));

      await getDiscordRoles(input);

      expect(fetchMock).toHaveBeenCalledWith(
        'https://discord.com/api/v10/guilds/null/roles',
        expect.any(Object)
      );
    });

    it('sends the literal string undefined when the bot token is not configured', async () => {
      vi.stubEnv('DISCORD_BOT_TOKEN', undefined);
      fetchMock.mockResolvedValue(jsonResponse([]));

      await getDiscordRoles(input);

      expect(fetchMock).toHaveBeenCalledWith(expect.any(String), {
        headers: { Authorization: 'Bot undefined' }
      });
    });

    it('drops the @everyone role, keeps only id, name, color and position, and sorts by position descending', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse([
          role('guild-42', '@everyone', 0),
          role('r-low', 'Member', 1, { color: 111 }),
          role('r-high', 'Admin', 5, { color: 222 }),
          role('r-mid', 'Moderator', 3, { color: 333 })
        ])
      );

      const result = await getDiscordRoles(input);

      expect(expectOk(result)).toEqual({
        roles: [
          { id: 'r-high', name: 'Admin', color: 222, position: 5 },
          { id: 'r-mid', name: 'Moderator', color: 333, position: 3 },
          { id: 'r-low', name: 'Member', color: 111, position: 1 }
        ]
      });
    });

    it('returns an empty list when the guild only has the @everyone role', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse([role('guild-42', '@everyone', 0)])
      );

      const result = await getDiscordRoles(input);

      expect(expectOk(result)).toEqual({ roles: [] });
    });

    it('allows a guest to list roles', async () => {
      prismaMock.team.findUnique.mockResolvedValue(
        teamWithRole(TeamRole.GUEST)
      );
      fetchMock.mockResolvedValue(jsonResponse([]));

      const result = await getDiscordRoles(input);

      expect(expectOk(result)).toEqual({ roles: [] });
    });

    it('returns FORBIDDEN for a blocked member', async () => {
      prismaMock.team.findUnique.mockResolvedValue(
        teamWithRole(TeamRole.BLOCKED)
      );

      const result = await getDiscordRoles(input);

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'You do not have permission to perform this action. Required permission: VIEW_INTEGRATIONS'
      );
      expect(prismaMock.integration.findFirst).not.toHaveBeenCalled();
    });

    it('returns NOT_FOUND when the team does not exist for the caller', async () => {
      prismaMock.team.findUnique.mockResolvedValue(null);

      const result = await getDiscordRoles(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Team not found');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('returns NOT_FOUND when the integration does not exist', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);

      const result = await getDiscordRoles(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Discord integration not found'
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('returns INTERNAL_SERVER_ERROR when discord responds with an error status', async () => {
      fetchMock.mockResolvedValue(jsonResponse({}, { status: 500 }));

      const result = await getDiscordRoles(input);

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Failed to fetch Discord roles'
      );
    });

    it('returns INTERNAL_SERVER_ERROR when discord returns a non-array payload', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ roles: [] }));

      const result = await getDiscordRoles(input);

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'allRoles.filter is not a function'
      );
    });

    it('returns UNPROCESSABLE_CONTENT when a role has no color', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse([{ id: 'r-1', name: 'Member', position: 1 }])
      );

      const result = await getDiscordRoles(input);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Output validation failed: /
      );
    });
  });
});
