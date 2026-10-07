import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApplicationError } from '@giveaway/util-errors';
import { getDiscordGuildInfo } from '../get-discord-guild-name';

const fetchMock = vi.fn<typeof fetch>();

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), { status: 200, ...init });

const guild = (overrides: Record<string, unknown> = {}) => ({
  id: 'guild-1',
  name: 'Dog Park',
  icon: 'icon-hash',
  owner_id: 'owner-1',
  ...overrides
});

const captureError = (promise: Promise<unknown>) =>
  promise.then(
    () => {
      throw new Error('Expected promise to reject');
    },
    (error: unknown) => error
  );

describe('getDiscordGuildInfo', () => {
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
    it('requests the guild endpoint with the bot authorization header', async () => {
      fetchMock.mockResolvedValue(jsonResponse(guild()));

      await getDiscordGuildInfo('guild-9');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://discord.com/api/v10/guilds/guild-9',
        { headers: { Authorization: 'Bot bot-token' } }
      );
    });

    it('returns only the id, name, icon and owner id', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse(guild({ features: ['COMMUNITY'], region: 'us-west' }))
      );

      const result = await getDiscordGuildInfo('guild-1');

      expect(result).toEqual({
        id: 'guild-1',
        name: 'Dog Park',
        icon: 'icon-hash',
        owner_id: 'owner-1'
      });
    });

    it('accepts a guild without an icon when icon is null', async () => {
      fetchMock.mockResolvedValue(jsonResponse(guild({ icon: null })));

      const result = await getDiscordGuildInfo('guild-1');

      expect(result.icon).toBeNull();
    });

    it('sends "Bot undefined" when the bot token is not configured', async () => {
      vi.stubEnv('DISCORD_BOT_TOKEN', undefined);
      fetchMock.mockResolvedValue(jsonResponse(guild()));

      await getDiscordGuildInfo('guild-1');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://discord.com/api/v10/guilds/guild-1',
        { headers: { Authorization: 'Bot undefined' } }
      );
    });
  });

  describe('when discord responds with an error status', () => {
    it.each([400, 401, 403, 404, 500])(
      'throws INTERNAL_SERVER_ERROR for status %i',
      async (status) => {
        fetchMock.mockResolvedValue(jsonResponse({}, { status }));

        const error = await captureError(getDiscordGuildInfo('guild-1'));

        expect(error).toBeInstanceOf(ApplicationError);
        expect(error).toMatchObject({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch Discord guild information'
        });
      }
    );
  });

  describe('when discord returns malformed data', () => {
    it('throws BAD_GATEWAY naming the call when the guild does not match the schema', async () => {
      fetchMock.mockResolvedValue(jsonResponse(guild({ name: 42 })));

      const error = await captureError(getDiscordGuildInfo('guild-1'));

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'BAD_GATEWAY',
        message: 'Unexpected response from Discord',
        data: { provider: 'discord', call: 'GET /guilds/:id' }
      });
    });

    it('rejects a guild whose icon property is missing', async () => {
      const { id, name, owner_id } = guild();
      fetchMock.mockResolvedValue(jsonResponse({ id, name, owner_id }));

      const error = await captureError(getDiscordGuildInfo('guild-1'));

      expect(error).toMatchObject({ code: 'BAD_GATEWAY' });
    });

    it('rejects a guild without an owner id', async () => {
      fetchMock.mockResolvedValue(jsonResponse(guild({ owner_id: null })));

      const error = await captureError(getDiscordGuildInfo('guild-1'));

      expect(error).toMatchObject({ code: 'BAD_GATEWAY' });
    });

    it('rejects a null body', async () => {
      fetchMock.mockResolvedValue(jsonResponse(null));

      const error = await captureError(getDiscordGuildInfo('guild-1'));

      expect(error).toMatchObject({ code: 'BAD_GATEWAY' });
    });
  });
});
