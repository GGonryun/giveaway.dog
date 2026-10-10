import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  E2E_CLOSED_GATES,
  stubE2eFakeEnvironment
} from '@giveaway/e2e-fakes/testing/env';
import {
  clearMemoryOutbox,
  memoryOutbox,
  readE2eOutbox
} from '@giveaway/e2e-fakes/testing/outbox';
import type {
  DiscordActionRow,
  DiscordMessageEmbed
} from '@giveaway/discord-model/schemas';
import { postDiscordMessage } from '../post-discord-message';
import { updateDiscordMessage } from '../update-discord-message';

vi.mock(
  '@giveaway/e2e-fakes/outbox',
  () => import('@giveaway/e2e-fakes/testing/outbox')
);

const fetchMock = vi.fn<typeof fetch>();
const embed = { title: 'Giveaway' } as DiscordMessageEmbed;
const components = [{ type: 1, components: [] }] as DiscordActionRow[];

beforeEach(() => {
  clearMemoryOutbox();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(
    Response.json({ id: 'message-1', channel_id: 'channel-1' })
  );
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('DISCORD_BOT_TOKEN', 'bot-token');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('postDiscordMessage with the discord fake', () => {
  it('records the message in the outbox of the channel', async () => {
    stubE2eFakeEnvironment('preview', 'discord');

    const result = await postDiscordMessage({
      channelId: 'channel-1',
      embed,
      components
    });

    const [entry] = await readE2eOutbox({
      channel: 'discord',
      target: 'channel-1'
    });
    expect(entry.payload).toEqual({
      action: 'post',
      embeds: [embed],
      components
    });
    expect(result).toEqual({ id: entry.id, channel_id: 'channel-1' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('needs no bot token', async () => {
    stubE2eFakeEnvironment('preview', 'discord');
    vi.stubEnv('DISCORD_BOT_TOKEN', undefined);

    await expect(
      postDiscordMessage({ channelId: 'channel-1', embed, components: [] })
    ).resolves.toMatchObject({ channel_id: 'channel-1' });
  });

  it.each(E2E_CLOSED_GATES)('posts to Discord on %s', async (environment) => {
    stubE2eFakeEnvironment(environment, 'discord');

    await postDiscordMessage({ channelId: 'channel-1', embed, components: [] });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://discord.com/api/v10/channels/channel-1/messages',
      expect.objectContaining({ method: 'POST' })
    );
    expect(memoryOutbox.redis.rpush).not.toHaveBeenCalled();
  });
});

describe('updateDiscordMessage with the discord fake', () => {
  it('records the edit and keeps the id of the message', async () => {
    stubE2eFakeEnvironment('preview', 'discord');

    const result = await updateDiscordMessage({
      channelId: 'channel-1',
      messageId: 'message-1',
      embed,
      components
    });

    const [entry] = await readE2eOutbox({
      channel: 'discord',
      target: 'channel-1'
    });
    expect(entry.payload).toEqual({
      action: 'update',
      messageId: 'message-1',
      embeds: [embed],
      components
    });
    expect(result).toEqual({ id: 'message-1', channel_id: 'channel-1' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(E2E_CLOSED_GATES)('edits on Discord on %s', async (environment) => {
    stubE2eFakeEnvironment(environment, 'discord');

    await updateDiscordMessage({
      channelId: 'channel-1',
      messageId: 'message-1',
      embed
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://discord.com/api/v10/channels/channel-1/messages/message-1',
      expect.objectContaining({ method: 'PATCH' })
    );
    expect(memoryOutbox.redis.rpush).not.toHaveBeenCalled();
  });
});
