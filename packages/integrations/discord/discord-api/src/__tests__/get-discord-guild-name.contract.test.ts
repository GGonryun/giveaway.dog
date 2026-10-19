import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeNetwork } from '@giveaway/testing-server/faults';
import { discordGuildInfoSchema } from '@giveaway/discord-model/schemas';
import { getDiscordGuildInfo } from '../get-discord-guild-name';
import { discordGuildFixture } from '../testing/fixtures-discord-guild';

describe('Discord guild contract', () => {
  beforeEach(() => {
    vi.stubEnv('DISCORD_BOT_TOKEN', 'bot-token');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('parses the recorded guild with the schema of the app', () => {
    expect(discordGuildInfoSchema.safeParse(discordGuildFixture)).toEqual(
      expect.objectContaining({ success: true })
    );
  });

  it('reads the guild info of the recorded guild', async () => {
    const network = fakeNetwork();
    network.json(
      `https://discord.com/api/v10/guilds/${discordGuildFixture.id}`,
      discordGuildFixture
    );

    await expect(getDiscordGuildInfo(discordGuildFixture.id)).resolves.toEqual({
      id: '1100000000000000001',
      name: 'Acme Community',
      icon: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
      owner_id: '1200000000000000001'
    });
  });
});
