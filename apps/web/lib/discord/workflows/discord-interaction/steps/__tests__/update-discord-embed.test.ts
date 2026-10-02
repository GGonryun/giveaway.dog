import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { updateDiscordEmbed } from '../update-discord-embed';
import { prismaMock } from '@/test/prisma';
import { SWEEPSTAKES_DISCORD_POST_SELECT_QUERY } from '@/lib/automation/db';
import {
  discordInteractionTaskConfig,
  discordPostSweepstakes,
  jsonResponse,
  storedTask
} from '@/lib/discord/__tests__/fixtures-discord-procedures-workflows';

const NOW = new Date('2026-06-01T00:00:00.000Z');

const input = {
  channelId: 'channel-1',
  messageId: 'message-1',
  sweepstakesId: 'sweep-1'
};

describe('updateDiscordEmbed', () => {
  const fetchMock = vi.fn<typeof fetch>();

  const sentBody = () => {
    const [, init] = fetchMock.mock.calls[0];
    return JSON.parse((init as RequestInit).body as string);
  };

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('DISCORD_BOT_TOKEN', 'bot-token');
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(
      jsonResponse({ id: 'message-1', channel_id: 'channel-1' })
    );
    prismaMock.sweepstakesParticipant.count.mockResolvedValue(4);
    prismaMock.taskCompletion.count.mockResolvedValue(9);
    prismaMock.sweepstakes.findUnique.mockResolvedValue(
      discordPostSweepstakes({
        tasks: [
          storedTask(
            'task-1',
            discordInteractionTaskConfig({ roles: ['role-x'] })
          )
        ]
      })
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('loads the sweepstakes with the discord post selection', async () => {
    await updateDiscordEmbed(input);

    expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
      where: { id: 'sweep-1' },
      select: SWEEPSTAKES_DISCORD_POST_SELECT_QUERY
    });
  });

  it('does nothing when the sweepstakes no longer exists', async () => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

    await expect(updateDiscordEmbed(input)).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(prismaMock.sweepstakesParticipant.count).not.toHaveBeenCalled();
  });

  it('edits the original discord message with the bot token', async () => {
    await updateDiscordEmbed(input);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://discord.com/api/v10/channels/channel-1/messages/message-1',
      expect.objectContaining({
        method: 'PATCH',
        headers: {
          Authorization: 'Bot bot-token',
          'Content-Type': 'application/json'
        }
      })
    );
  });

  it('sends only the embed and leaves the message components untouched', async () => {
    await updateDiscordEmbed(input);

    expect(Object.keys(sentBody())).toEqual(['embeds']);
    expect(sentBody().embeds).toHaveLength(1);
  });

  it('builds the embed from the latest activity counts and the task roles', async () => {
    await updateDiscordEmbed(input);

    const [embed] = sentBody().embeds;
    expect(embed.timestamp).toBe(NOW.toISOString());
    expect(embed.description).toContain('**Participants:** 4');
    expect(embed.description).toContain('**Entries:** 9');
    expect(embed.description).toContain('**Eligible Roles:** <@&role-x>');
  });

  it('resolves to undefined after the update', async () => {
    await expect(updateDiscordEmbed(input)).resolves.toBeUndefined();
  });

  it('propagates a discord error when the message cannot be found', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, { status: 404 }));

    await expect(updateDiscordEmbed(input)).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Message or channel not found'
    });
  });

  it('propagates a configuration error when the bot token is missing', async () => {
    vi.stubEnv('DISCORD_BOT_TOKEN', undefined);

    await expect(updateDiscordEmbed(input)).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Discord bot token is not configured'
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
