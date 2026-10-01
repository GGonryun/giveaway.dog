import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ZodError } from 'zod';
import { ApplicationError } from '@/lib/errors';
import { getDiscordGuildRoles } from '../get-discord-guild-roles';

const fetchMock = vi.fn<typeof fetch>();

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), { status: 200, ...init });

const role = (overrides: Record<string, unknown> = {}) => ({
  id: 'role-1',
  name: 'Members',
  color: 0,
  hoist: false,
  icon: null,
  unicode_emoji: null,
  position: 1,
  permissions: '104324673',
  managed: false,
  mentionable: true,
  ...overrides
});

const captureError = (promise: Promise<unknown>) =>
  promise.then(
    () => {
      throw new Error('Expected promise to reject');
    },
    (error: unknown) => error
  );

describe('getDiscordGuildRoles', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('DISCORD_BOT_TOKEN', 'bot-token');
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  describe('when discord responds successfully', () => {
    it('requests the guild roles endpoint with the bot authorization header', async () => {
      fetchMock.mockResolvedValue(jsonResponse([]));

      await getDiscordGuildRoles('guild-7');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://discord.com/api/v10/guilds/guild-7/roles',
        { headers: { Authorization: 'Bot bot-token' } }
      );
    });

    it('returns every role including managed and everyone roles', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse([
          role({ id: 'everyone', name: '@everyone', position: 0 }),
          role({ id: 'bot', name: 'Giveaway Dog', managed: true }),
          role({ id: 'vip', name: 'VIP', color: 16711680, hoist: true })
        ])
      );

      const result = await getDiscordGuildRoles('guild-1');

      expect(result.map((r) => r.id)).toEqual(['everyone', 'bot', 'vip']);
    });

    it('strips unknown properties from each role', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse([role({ tags: { bot_id: 'b-1' }, flags: 0 })])
      );

      const [result] = await getDiscordGuildRoles('guild-1');

      expect(result).toEqual(role());
    });

    it('accepts roles that omit the optional icon and emoji', async () => {
      const minimalRole = {
        id: 'role-2',
        name: 'Plain',
        color: 0,
        hoist: false,
        position: 2,
        permissions: '0',
        managed: false,
        mentionable: false
      };
      fetchMock.mockResolvedValue(jsonResponse([minimalRole]));

      const [result] = await getDiscordGuildRoles('guild-1');

      expect(result).toEqual(minimalRole);
    });

    it('returns an empty list when the guild has no roles', async () => {
      fetchMock.mockResolvedValue(jsonResponse([]));

      await expect(getDiscordGuildRoles('guild-1')).resolves.toEqual([]);
    });

    it('sends "Bot undefined" when the bot token is not configured', async () => {
      vi.stubEnv('DISCORD_BOT_TOKEN', undefined);
      fetchMock.mockResolvedValue(jsonResponse([]));

      await getDiscordGuildRoles('guild-1');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://discord.com/api/v10/guilds/guild-1/roles',
        { headers: { Authorization: 'Bot undefined' } }
      );
    });
  });

  describe('when discord responds with an error status', () => {
    it.each([401, 403, 404, 500])(
      'throws INTERNAL_SERVER_ERROR for status %i',
      async (status) => {
        fetchMock.mockResolvedValue(jsonResponse({}, { status }));

        const error = await captureError(getDiscordGuildRoles('guild-1'));

        expect(error).toBeInstanceOf(ApplicationError);
        expect(error).toMatchObject({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch Discord guild roles'
        });
      }
    );
  });

  describe('when discord returns malformed data', () => {
    it('throws VALIDATION_ERROR with the zod error as cause', async () => {
      fetchMock.mockResolvedValue(jsonResponse([role({ permissions: 8 })]));

      const error = await captureError(getDiscordGuildRoles('guild-1'));

      expect(error).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Invalid Discord guild roles data'
      });
      expect((error as ApplicationError).cause).toBeInstanceOf(ZodError);
    });

    it('rejects a non-array payload', async () => {
      fetchMock.mockResolvedValue(jsonResponse(role()));

      const error = await captureError(getDiscordGuildRoles('guild-1'));

      expect(error).toMatchObject({ code: 'VALIDATION_ERROR' });
    });
  });
});
