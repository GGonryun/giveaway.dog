import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  discordMessageResponseSchema,
  type PostDiscordMessageOptions
} from '@giveaway/discord-model/schemas';
import { jsonResponse } from '@giveaway/testing-server/fixtures-integrations-utils';
import messageResponse from '../testing/fixtures-discord-message.json';
import { postDiscordMessage } from '../post-discord-message';
import { updateDiscordMessage } from '../update-discord-message';

const fetchMock = vi.fn<typeof fetch>();

const message: PostDiscordMessageOptions = {
  channelId: '1197041247826280550',
  embed: {
    title: 'New Giveaway!',
    description: '**Name:** Dog Treats',
    url: 'https://www.giveaway.dog/browse/dog-treats',
    fields: [],
    color: 0x5865f2
  },
  components: [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 3,
          label: 'Join Giveaway',
          custom_id: 'task:enter:task-1'
        },
        {
          type: 2,
          style: 5,
          label: 'Bonus Entries',
          url: 'https://www.giveaway.dog/browse/dog-treats'
        }
      ]
    }
  ]
};

const RECORDED_MESSAGE = {
  id: '1424897463219576892',
  channel_id: '1197041247826280550'
};

describe('Discord channel messages contract', () => {
  beforeEach(() => {
    vi.stubEnv('DISCORD_BOT_TOKEN', 'bot-token');
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () =>
      jsonResponse(messageResponse.body)
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('parses the recorded message with the schema that posting and editing use', () => {
    expect(() =>
      discordMessageResponseSchema.parse(messageResponse.body)
    ).not.toThrow();
  });

  it('posts the embed and buttons and returns the ids of the recorded message', async () => {
    await expect(postDiscordMessage(message)).resolves.toEqual(
      RECORDED_MESSAGE
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      'https://discord.com/api/v10/channels/1197041247826280550/messages'
    );
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual({
      embeds: [message.embed],
      components: message.components
    });
  });

  it('edits the message and returns the ids of the recorded message', async () => {
    await expect(
      updateDiscordMessage({ ...message, messageId: '1424897463219576892' })
    ).resolves.toEqual(RECORDED_MESSAGE);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      'https://discord.com/api/v10/channels/1197041247826280550/messages/1424897463219576892'
    );
    expect(init?.method).toBe('PATCH');
  });
});
