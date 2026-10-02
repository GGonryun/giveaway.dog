import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ZodError } from 'zod';
import { ApplicationError } from '@/lib/errors';
import { getDiscordGuildChannels } from '../get-discord-channels';

const fetchMock = vi.fn<typeof fetch>();

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), { status: 200, ...init });

const channel = (overrides: Record<string, unknown> = {}) => ({
  id: 'channel-1',
  name: 'general',
  type: 0,
  position: 0,
  parent_id: null,
  ...overrides
});

const captureError = (promise: Promise<unknown>) =>
  promise.then(
    () => {
      throw new Error('Expected promise to reject');
    },
    (error: unknown) => error
  );

describe('getDiscordGuildChannels', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('DISCORD_BOT_TOKEN', 'bot-token');
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  describe('when the bot token is missing', () => {
    it('throws INTERNAL_SERVER_ERROR without calling discord', async () => {
      vi.stubEnv('DISCORD_BOT_TOKEN', undefined);

      const error = await captureError(getDiscordGuildChannels('guild-1'));

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Discord bot token is not configured'
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('treats an empty token as missing', async () => {
      vi.stubEnv('DISCORD_BOT_TOKEN', '');

      const error = await captureError(getDiscordGuildChannels('guild-1'));

      expect(error).toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('when discord responds successfully', () => {
    it('requests the guild channels endpoint with the bot authorization header', async () => {
      fetchMock.mockResolvedValue(jsonResponse([]));

      await getDiscordGuildChannels('guild-42');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://discord.com/api/v10/guilds/guild-42/channels',
        { headers: { Authorization: 'Bot bot-token' } }
      );
    });

    it('keeps only text and announcement channels in their original order', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse([
          channel({ id: 'announcements', type: 5, position: 1 }),
          channel({ id: 'voice', type: 2 }),
          channel({ id: 'category', type: 4 }),
          channel({ id: 'text', type: 0, position: 3 }),
          channel({ id: 'forum', type: 15 })
        ])
      );

      const result = await getDiscordGuildChannels('guild-1');

      expect(result.map((c) => c.id)).toEqual(['announcements', 'text']);
    });

    it('returns parsed channels without unknown properties', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse([
          channel({ id: 'c-1', parent_id: 'cat-1', topic: 'extra field' })
        ])
      );

      const result = await getDiscordGuildChannels('guild-1');

      expect(result).toEqual([
        {
          id: 'c-1',
          name: 'general',
          type: 0,
          position: 0,
          parent_id: 'cat-1'
        }
      ]);
    });

    it('accepts channels without a parent id', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse([
          { id: 'channel-1', name: 'general', type: 0, position: 0 }
        ])
      );

      const result = await getDiscordGuildChannels('guild-1');

      expect(result).toEqual([
        { id: 'channel-1', name: 'general', type: 0, position: 0 }
      ]);
    });

    it('returns an empty list when the guild has no channels', async () => {
      fetchMock.mockResolvedValue(jsonResponse([]));

      await expect(getDiscordGuildChannels('guild-1')).resolves.toEqual([]);
    });

    it('returns an empty list when no channel is a text or announcement channel', async () => {
      fetchMock.mockResolvedValue(jsonResponse([channel({ type: 2 })]));

      await expect(getDiscordGuildChannels('guild-1')).resolves.toEqual([]);
    });
  });

  describe('when discord responds with an error status', () => {
    it.each([
      [401, 'UNAUTHORIZED', 'Discord bot token is invalid'],
      [
        403,
        'FORBIDDEN',
        'Bot does not have permission to view channels in this guild'
      ],
      [404, 'NOT_FOUND', 'Guild not found or bot is not in this guild']
    ])('maps status %i to %s', async (status, code, message) => {
      fetchMock.mockResolvedValue(jsonResponse({}, { status }));

      const error = await captureError(getDiscordGuildChannels('guild-1'));

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({ code, message });
    });

    it('includes the status and status text for other failures', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({}, { status: 500, statusText: 'Internal Server Error' })
      );

      const error = await captureError(getDiscordGuildChannels('guild-1'));

      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch Discord channels: 500 Internal Server Error'
      });
    });

    it('treats a rate limit response as an internal server error', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({}, { status: 429, statusText: 'Too Many Requests' })
      );

      const error = await captureError(getDiscordGuildChannels('guild-1'));

      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch Discord channels: 429 Too Many Requests'
      });
    });
  });

  describe('when discord returns malformed data', () => {
    it('throws VALIDATION_ERROR with the zod error as cause', async () => {
      fetchMock.mockResolvedValue(jsonResponse([{ id: 'c-1', type: 0 }]));

      const error = await captureError(getDiscordGuildChannels('guild-1'));

      expect(error).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Invalid Discord channel data'
      });
      expect((error as ApplicationError).cause).toBeInstanceOf(ZodError);
    });

    it('rejects a non-array payload', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ channels: [] }));

      const error = await captureError(getDiscordGuildChannels('guild-1'));

      expect(error).toMatchObject({ code: 'VALIDATION_ERROR' });
    });

    it('propagates the error when the body is not valid json', async () => {
      fetchMock.mockResolvedValue(new Response('not json', { status: 200 }));

      const error = await captureError(getDiscordGuildChannels('guild-1'));

      expect(error).toBeInstanceOf(SyntaxError);
    });
  });
});
