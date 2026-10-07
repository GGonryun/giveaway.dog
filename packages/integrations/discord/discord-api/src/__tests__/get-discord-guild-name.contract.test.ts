import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { discordGuildInfoSchema } from '@giveaway/discord-model/schemas';
import {
  fetchCall,
  jsonResponse
} from '@giveaway/testing-server/fixtures-integrations-utils';
import guildResponse from '../testing/fixtures-discord-guild.json';
import { getDiscordGuildInfo } from '../get-discord-guild-name';

const fetchMock = vi.fn<typeof fetch>();

describe('Discord GET /guilds/:id contract', () => {
  beforeEach(() => {
    vi.stubEnv('DISCORD_BOT_TOKEN', 'bot-token');
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(jsonResponse(guildResponse.body));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('parses the recorded response with the schema that getDiscordGuildInfo uses', () => {
    expect(() =>
      discordGuildInfoSchema.parse(guildResponse.body)
    ).not.toThrow();
  });

  it('requests the guild with the bot token', async () => {
    await getDiscordGuildInfo('197038439483310086');

    const { url, init } = fetchCall(fetchMock);
    expect(url).toBe('https://discord.com/api/v10/guilds/197038439483310086');
    expect(init.headers).toEqual({ Authorization: 'Bot bot-token' });
  });

  it('returns the guild details of the recorded response', async () => {
    await expect(getDiscordGuildInfo('197038439483310086')).resolves.toEqual({
      id: '197038439483310086',
      name: 'Discord Testers',
      icon: 'f64c482b807da4f539cff778d174971c',
      owner_id: '100000000000000001'
    });
  });
});
