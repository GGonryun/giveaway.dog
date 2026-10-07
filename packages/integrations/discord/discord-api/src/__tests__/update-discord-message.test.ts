import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApplicationError } from '@giveaway/util-errors';
import { updateDiscordMessage } from '../update-discord-message';
import type { UpdateDiscordMessageOptions } from '@giveaway/discord-model/schemas';

const fetchMock = vi.fn<typeof fetch>();

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), { status: 200, ...init });

const options = (
  overrides: Partial<UpdateDiscordMessageOptions> = {}
): UpdateDiscordMessageOptions => ({
  channelId: 'channel-1',
  messageId: 'message-1',
  embed: {
    title: 'Giveaway Completed!',
    description: '**Winners:** Rex',
    fields: []
  },
  components: [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 5,
          label: 'Browse Giveaways',
          url: 'https://giveaway.dog/browse'
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

describe('updateDiscordMessage', () => {
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

      const error = await captureError(updateDiscordMessage(options()));

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Discord bot token is not configured'
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('treats an empty token as missing', async () => {
      vi.stubEnv('DISCORD_BOT_TOKEN', '');

      const error = await captureError(updateDiscordMessage(options()));

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Discord bot token is not configured'
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('when discord accepts the edit', () => {
    it('patches the message endpoint with the embed and components', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ id: 'message-1', channel_id: 'channel-1' })
      );
      const input = options();

      await updateDiscordMessage(input);

      expect(fetchMock).toHaveBeenCalledWith(
        'https://discord.com/api/v10/channels/channel-1/messages/message-1',
        {
          method: 'PATCH',
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

    it('omits the components key from the body when no components are given', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ id: 'message-1', channel_id: 'channel-1' })
      );
      const input = options({ components: undefined });

      await updateDiscordMessage(input);

      const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
      expect(body).toEqual({ embeds: [input.embed] });
      expect(body).not.toHaveProperty('components');
    });

    it('returns the parsed message response', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          id: 'message-1',
          channel_id: 'channel-1',
          guild_id: 'guild-1',
          edited_timestamp: '2024-01-01T00:00:00.000Z'
        })
      );

      const result = await updateDiscordMessage(options());

      expect(result).toEqual({
        id: 'message-1',
        channel_id: 'channel-1',
        guild_id: 'guild-1'
      });
    });
  });

  describe('when discord rejects the edit', () => {
    it.each([
      [401, 'UNAUTHORIZED', 'Discord bot token is invalid'],
      [
        403,
        'FORBIDDEN',
        'Bot does not have permission to edit messages in this channel. Please check bot permissions.'
      ],
      [404, 'NOT_FOUND', 'Message or channel not found']
    ])('maps status %i to %s', async (status, code, message) => {
      fetchMock.mockResolvedValue(jsonResponse({}, { status }));

      const error = await captureError(updateDiscordMessage(options()));

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({ code, message });
    });

    it('returns BAD_REQUEST with the raw discord error object for status 400', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse(
          { code: 50035, message: 'Invalid Form Body' },
          { status: 400 }
        )
      );

      const error = await captureError(updateDiscordMessage(options()));

      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Invalid message data sent to Discord'
      });
      expect((error as ApplicationError).data).toEqual({
        code: 50035,
        message: 'Invalid Form Body'
      });
    });

    it('falls back to an empty object when the 400 body is not json', async () => {
      fetchMock.mockResolvedValue(new Response('oops', { status: 400 }));

      const error = await captureError(updateDiscordMessage(options()));

      expect(error).toMatchObject({ code: 'BAD_REQUEST' });
      expect((error as ApplicationError).data).toEqual({});
    });

    it('includes the status and status text for other failures', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({}, { status: 503, statusText: 'Service Unavailable' })
      );

      const error = await captureError(updateDiscordMessage(options()));

      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update Discord message: 503 Service Unavailable'
      });
    });

    it('treats a rate limit response as an internal server error', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({}, { status: 429, statusText: 'Too Many Requests' })
      );

      const error = await captureError(updateDiscordMessage(options()));

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update Discord message: 429 Too Many Requests'
      });
    });
  });

  describe('when discord returns malformed data', () => {
    it('throws BAD_GATEWAY naming the call when the response does not match the schema', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ id: 'message-1', channel_id: 7 })
      );

      const error = await captureError(updateDiscordMessage(options()));

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'BAD_GATEWAY',
        message: 'Unexpected response from Discord',
        data: { provider: 'discord', call: 'PATCH /channels/:id/messages/:id' }
      });
    });
  });
});
