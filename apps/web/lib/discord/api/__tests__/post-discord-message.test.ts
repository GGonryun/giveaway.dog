import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ZodError } from 'zod';
import { ApplicationError } from '@giveaway/util-errors';
import { postDiscordMessage } from '../post-discord-message';
import type { PostDiscordMessageOptions } from '../schemas';

const fetchMock = vi.fn<typeof fetch>();

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), { status: 200, ...init });

const options = (
  overrides: Partial<PostDiscordMessageOptions> = {}
): PostDiscordMessageOptions => ({
  channelId: 'channel-1',
  embed: {
    title: 'New Giveaway!',
    description: '**Name:** Treats',
    fields: [],
    color: 0x5865f2
  },
  components: [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 5,
          label: 'View Details',
          url: 'https://giveaway.dog/browse/treats'
        }
      ]
    }
  ],
  ...overrides
});

const captureError = (promise: Promise<unknown>) =>
  promise.then(
    () => {
      throw new Error('Expected promise to reject');
    },
    (error: unknown) => error
  );

describe('postDiscordMessage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('DISCORD_BOT_TOKEN', 'bot-token');
    fetchMock.mockReset();
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('when the bot token is missing', () => {
    it('throws INTERNAL_SERVER_ERROR without calling discord', async () => {
      vi.stubEnv('DISCORD_BOT_TOKEN', undefined);

      const error = await captureError(postDiscordMessage(options()));

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Discord bot token is not configured'
      });
      expect(fetchMock).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
    });

    it('treats an empty token as missing', async () => {
      vi.stubEnv('DISCORD_BOT_TOKEN', '');

      const error = await captureError(postDiscordMessage(options()));

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Discord bot token is not configured'
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('when discord accepts the message', () => {
    it('posts the embed and components to the channel messages endpoint', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ id: 'message-1', channel_id: 'channel-1' })
      );
      const input = options();

      await postDiscordMessage(input);

      expect(fetchMock).toHaveBeenCalledWith(
        'https://discord.com/api/v10/channels/channel-1/messages',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bot bot-token',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            embeds: [input.embed],
            components: input.components
          })
        }
      );
    });

    it('wraps the single embed in an embeds array', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ id: 'message-1', channel_id: 'channel-1' })
      );
      const input = options({ components: [] });

      await postDiscordMessage(input);

      const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
      expect(body).toEqual({ embeds: [input.embed], components: [] });
    });

    it('logs the serialized options before posting', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ id: 'message-1', channel_id: 'channel-1' })
      );
      const input = options();

      await postDiscordMessage(input);

      expect(console.info).toHaveBeenCalledWith(
        'Posting message to Discord channel',
        JSON.stringify(input)
      );
    });

    it('returns the parsed message response', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          id: 'message-1',
          channel_id: 'channel-1',
          guild_id: 'guild-1',
          content: '',
          embeds: []
        })
      );

      const result = await postDiscordMessage(options());

      expect(result).toEqual({
        id: 'message-1',
        channel_id: 'channel-1',
        guild_id: 'guild-1'
      });
    });

    it('returns a response without a guild id', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ id: 'message-1', channel_id: 'channel-1' })
      );

      const result = await postDiscordMessage(options());

      expect(result).toEqual({ id: 'message-1', channel_id: 'channel-1' });
    });
  });

  describe('when discord rejects the message', () => {
    it.each([
      [401, 'UNAUTHORIZED', 'Discord bot token is invalid'],
      [
        403,
        'FORBIDDEN',
        'Bot does not have permission to send messages in this channel. Please check bot permissions.'
      ],
      [404, 'NOT_FOUND', 'Channel not found or bot does not have access to it']
    ])('maps status %i to %s', async (status, code, message) => {
      fetchMock.mockResolvedValue(jsonResponse({}, { status }));

      const error = await captureError(postDiscordMessage(options()));

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({ code, message });
    });

    it('returns BAD_REQUEST with the stringified discord error body for status 400', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse(
          { code: 50035, message: 'Invalid Form Body' },
          { status: 400 }
        )
      );

      const error = await captureError(postDiscordMessage(options()));

      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Invalid message data sent to Discord',
        data: '{"code":50035,"message":"Invalid Form Body"}'
      });
    });

    it('falls back to an empty object string when the 400 body is not json', async () => {
      fetchMock.mockResolvedValue(new Response('oops', { status: 400 }));

      const error = await captureError(postDiscordMessage(options()));

      expect(error).toMatchObject({ code: 'BAD_REQUEST', data: '{}' });
    });

    it('includes the status and status text for other failures', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({}, { status: 502, statusText: 'Bad Gateway' })
      );

      const error = await captureError(postDiscordMessage(options()));

      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to post Discord message: 502 Bad Gateway'
      });
    });

    it('treats a rate limit response as an internal server error', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({}, { status: 429, statusText: 'Too Many Requests' })
      );

      const error = await captureError(postDiscordMessage(options()));

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to post Discord message: 429 Too Many Requests'
      });
    });
  });

  describe('when discord returns malformed data', () => {
    it('throws VALIDATION_ERROR with the zod error as cause', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ id: 'message-1' }));

      const error = await captureError(postDiscordMessage(options()));

      expect(error).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Invalid Discord message response'
      });
      expect((error as ApplicationError).cause).toBeInstanceOf(ZodError);
    });
  });
});
