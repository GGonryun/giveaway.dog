import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeNetwork } from '@giveaway/testing-server/faults';
import { discordMessageResponseSchema } from '@giveaway/discord-model/schemas';
import { postDiscordMessage } from '../post-discord-message';
import { updateDiscordMessage } from '../update-discord-message';
import { discordMessageFixture } from '../testing/fixtures-discord-message';

const CHANNEL = `https://discord.com/api/v10/channels/${discordMessageFixture.channel_id}/messages`;

const embed = {
  title: 'Acme Giveaway',
  description: 'Enter for a chance to win',
  fields: []
};

describe('Discord message contract', () => {
  beforeEach(() => {
    vi.stubEnv('DISCORD_BOT_TOKEN', 'bot-token');
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('parses the recorded message with the schema of the app', () => {
    expect(
      discordMessageResponseSchema.safeParse(discordMessageFixture)
    ).toEqual(expect.objectContaining({ success: true }));
  });

  it('reads the ids of the recorded message after a post', async () => {
    const network = fakeNetwork();
    network.json(`POST ${CHANNEL}`, discordMessageFixture);

    await expect(
      postDiscordMessage({
        channelId: discordMessageFixture.channel_id,
        embed,
        components: []
      })
    ).resolves.toEqual({
      id: '1600000000000000002',
      channel_id: '1300000000000000004'
    });
  });

  it('reads the ids of the recorded message after an update', async () => {
    const network = fakeNetwork();
    network.json(
      `PATCH ${CHANNEL}/${discordMessageFixture.id}`,
      discordMessageFixture
    );

    await expect(
      updateDiscordMessage({
        channelId: discordMessageFixture.channel_id,
        messageId: discordMessageFixture.id,
        embed
      })
    ).resolves.toEqual({
      id: '1600000000000000002',
      channel_id: '1300000000000000004'
    });
  });
});
