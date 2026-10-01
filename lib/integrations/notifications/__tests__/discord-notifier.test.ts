import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { notifyDiscordNewGiveaway } from '../discord-notifier';
import { prismaMock } from '@/test/prisma';

const fetchMock = vi.fn<typeof fetch>();

const ENDS_AT = new Date('2026-03-01T12:00:00.999Z');
const ENDS_AT_SECONDS = Math.floor(ENDS_AT.getTime() / 1000);

const giveaway = (
  overrides: Partial<Parameters<typeof notifyDiscordNewGiveaway>[1]> = {}
) => ({
  title: 'Win a Dog Bed',
  description: 'A very comfy bed',
  url: 'https://giveaway.dog/s/dog-bed',
  endsAt: ENDS_AT,
  ...overrides
});

const integration = (id: string, settings: unknown) => ({
  id,
  teamId: 'team-1',
  provider: 'DISCORD',
  status: 'ACTIVE',
  settings
});

const okResponse = () =>
  new Response(JSON.stringify({ id: 'message-1' }), { status: 200 });

const sentBody = (callIndex = 0) =>
  JSON.parse(String(fetchMock.mock.calls[callIndex][1]?.body));

describe('notifyDiscordNewGiveaway', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => okResponse());
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('DISCORD_BOT_TOKEN', 'bot-token');
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    prismaMock.integration.findMany.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('when looking up integrations', () => {
    it('queries the active discord integrations of the team', async () => {
      await notifyDiscordNewGiveaway('team-1', giveaway());

      expect(prismaMock.integration.findMany).toHaveBeenCalledWith({
        where: { teamId: 'team-1', provider: 'DISCORD', status: 'ACTIVE' }
      });
    });

    it('sends nothing when the team has no active discord integrations', async () => {
      await notifyDiscordNewGiveaway('team-1', giveaway());

      expect(fetchMock).not.toHaveBeenCalled();
      expect(prismaMock.integration.update).not.toHaveBeenCalled();
    });

    it('rejects when the integration lookup fails', async () => {
      prismaMock.integration.findMany.mockRejectedValue(new Error('db down'));

      await expect(
        notifyDiscordNewGiveaway('team-1', giveaway())
      ).rejects.toThrow('db down');
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('when an integration is configured to notify', () => {
    beforeEach(() => {
      prismaMock.integration.findMany.mockResolvedValue([
        integration('int-1', { channelId: 'chan-1', notifyOnNewGiveaway: true })
      ]);
    });

    it('posts to the channel messages endpoint with the bot token', async () => {
      await notifyDiscordNewGiveaway('team-1', giveaway());

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://discord.com/api/v10/channels/chan-1/messages',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bot bot-token',
            'Content-Type': 'application/json'
          },
          body: expect.any(String)
        }
      );
    });

    it('sends a new giveaway embed without an image when none is provided', async () => {
      await notifyDiscordNewGiveaway('team-1', giveaway());

      expect(sentBody()).toEqual({
        embeds: [
          {
            title: '🎉 New Giveaway Posted!',
            description: 'A very comfy bed',
            url: 'https://giveaway.dog/s/dog-bed',
            color: 0x5865f2,
            fields: [
              { name: 'Title', value: 'Win a Dog Bed', inline: false },
              {
                name: 'Ends',
                value: `<t:${ENDS_AT_SECONDS}:R>`,
                inline: true
              }
            ],
            footer: { text: 'Click the title to enter!' }
          }
        ]
      });
    });

    it('floors the end time to whole seconds in the relative timestamp', async () => {
      await notifyDiscordNewGiveaway('team-1', giveaway());

      expect(sentBody().embeds[0].fields[1].value).toBe('<t:1772366400:R>');
    });

    it('includes the image when an image url is provided', async () => {
      await notifyDiscordNewGiveaway(
        'team-1',
        giveaway({ imageUrl: 'https://cdn.giveaway.dog/bed.png' })
      );

      expect(sentBody().embeds[0].image).toEqual({
        url: 'https://cdn.giveaway.dog/bed.png'
      });
    });

    it('omits the image when the image url is an empty string', async () => {
      await notifyDiscordNewGiveaway('team-1', giveaway({ imageUrl: '' }));

      expect(sentBody().embeds[0]).not.toHaveProperty('image');
    });

    it('sends "Bot undefined" as the authorization when the bot token is unset', async () => {
      vi.stubEnv('DISCORD_BOT_TOKEN', undefined);

      await notifyDiscordNewGiveaway('team-1', giveaway());

      expect(fetchMock.mock.calls[0][1]?.headers).toEqual({
        Authorization: 'Bot undefined',
        'Content-Type': 'application/json'
      });
    });

    it('does not change the integration status after a successful send', async () => {
      await notifyDiscordNewGiveaway('team-1', giveaway());

      expect(prismaMock.integration.update).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
    });

    it('resolves to undefined', async () => {
      await expect(
        notifyDiscordNewGiveaway('team-1', giveaway())
      ).resolves.toBeUndefined();
    });
  });

  describe('when an integration should be skipped', () => {
    it.each([
      [
        'notifications are disabled',
        { channelId: 'chan-1', notifyOnNewGiveaway: false }
      ],
      ['the notify flag is absent', { channelId: 'chan-1' }],
      ['the channel id is missing', { notifyOnNewGiveaway: true }],
      ['the channel id is empty', { channelId: '', notifyOnNewGiveaway: true }],
      ['the settings are empty', {}]
    ])('skips it when %s', async (_case, settings) => {
      prismaMock.integration.findMany.mockResolvedValue([
        integration('int-1', settings)
      ]);

      await notifyDiscordNewGiveaway('team-1', giveaway());

      expect(fetchMock).not.toHaveBeenCalled();
      expect(prismaMock.integration.update).not.toHaveBeenCalled();
    });

    it('rejects with a TypeError when an integration has null settings', async () => {
      prismaMock.integration.findMany.mockResolvedValue([
        integration('int-1', null),
        integration('int-2', { channelId: 'chan-2', notifyOnNewGiveaway: true })
      ]);

      await expect(
        notifyDiscordNewGiveaway('team-1', giveaway())
      ).rejects.toThrow(TypeError);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('when there are several integrations', () => {
    beforeEach(() => {
      prismaMock.integration.findMany.mockResolvedValue([
        integration('int-1', {
          channelId: 'chan-1',
          notifyOnNewGiveaway: true
        }),
        integration('int-2', {
          channelId: 'chan-2',
          notifyOnNewGiveaway: false
        }),
        integration('int-3', { channelId: 'chan-3', notifyOnNewGiveaway: true })
      ]);
    });

    it('posts to every eligible channel in order', async () => {
      await notifyDiscordNewGiveaway('team-1', giveaway());

      expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
        'https://discord.com/api/v10/channels/chan-1/messages',
        'https://discord.com/api/v10/channels/chan-3/messages'
      ]);
    });

    it('keeps notifying the remaining channels after one fails', async () => {
      fetchMock
        .mockResolvedValueOnce(new Response('Missing Access', { status: 403 }))
        .mockResolvedValueOnce(okResponse());

      await notifyDiscordNewGiveaway('team-1', giveaway());

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(prismaMock.integration.update).toHaveBeenCalledTimes(1);
      expect(prismaMock.integration.update).toHaveBeenCalledWith({
        where: { id: 'int-1' },
        data: { status: 'ERROR' }
      });
    });
  });

  describe('when sending the message fails', () => {
    beforeEach(() => {
      prismaMock.integration.findMany.mockResolvedValue([
        integration('int-1', { channelId: 'chan-1', notifyOnNewGiveaway: true })
      ]);
    });

    it('logs the discord status and body and marks the integration as errored', async () => {
      fetchMock.mockResolvedValue(
        new Response('{"message":"Missing Access"}', { status: 403 })
      );

      await notifyDiscordNewGiveaway('team-1', giveaway());

      expect(consoleError).toHaveBeenCalledWith(
        'Failed to send Discord notification:',
        expect.objectContaining({
          message: 'Discord API error: 403 {"message":"Missing Access"}'
        })
      );
      expect(prismaMock.integration.update).toHaveBeenCalledWith({
        where: { id: 'int-1' },
        data: { status: 'ERROR' }
      });
    });

    it('includes an empty body in the error message when discord returns none', async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 500 }));

      await notifyDiscordNewGiveaway('team-1', giveaway());

      expect(consoleError).toHaveBeenCalledWith(
        'Failed to send Discord notification:',
        expect.objectContaining({ message: 'Discord API error: 500 ' })
      );
    });

    it('marks the integration as errored when the request itself throws', async () => {
      const networkError = new Error('socket hang up');
      fetchMock.mockRejectedValue(networkError);

      await notifyDiscordNewGiveaway('team-1', giveaway());

      expect(consoleError).toHaveBeenCalledWith(
        'Failed to send Discord notification:',
        networkError
      );
      expect(prismaMock.integration.update).toHaveBeenCalledWith({
        where: { id: 'int-1' },
        data: { status: 'ERROR' }
      });
    });

    it('marks the integration as errored when a successful response is not json', async () => {
      fetchMock.mockResolvedValue(new Response('ok', { status: 200 }));

      await notifyDiscordNewGiveaway('team-1', giveaway());

      expect(consoleError).toHaveBeenCalledWith(
        'Failed to send Discord notification:',
        expect.any(SyntaxError)
      );
      expect(prismaMock.integration.update).toHaveBeenCalledWith({
        where: { id: 'int-1' },
        data: { status: 'ERROR' }
      });
    });

    it('rejects when marking the integration as errored also fails', async () => {
      fetchMock.mockResolvedValue(new Response('nope', { status: 401 }));
      prismaMock.integration.update.mockRejectedValue(new Error('db down'));

      await expect(
        notifyDiscordNewGiveaway('team-1', giveaway())
      ).rejects.toThrow('db down');
    });
  });
});
