import { expect, it } from 'vitest';
import {
  describeLive,
  expectLiveResponse,
  liveVariable,
  recordResponses
} from '@giveaway/testing-server/live';
import {
  discordGuildInfoSchema,
  discordGuildRolesSchema
} from '@giveaway/discord-model/schemas';
import { getDiscordGuildInfo } from '../get-discord-guild-name';

const API = 'https://discord.com/api/v10';

describeLive('Discord', ['DISCORD_BOT_TOKEN', 'LIVE_DISCORD_GUILD_ID'], () => {
  it('reads the name of a test guild', async () => {
    const call = { provider: 'Discord', call: 'get guild' };
    const guildId = liveVariable('LIVE_DISCORD_GUILD_ID');
    const recorder = recordResponses();

    const guild = await getDiscordGuildInfo(guildId);

    expectLiveResponse(
      discordGuildInfoSchema,
      recorder.body(`${API}/guilds/${guildId}`, call),
      call
    );
    expect(guild.id).toBe(guildId);
  });

  it('reads the roles of a test guild', async () => {
    const call = { provider: 'Discord', call: 'get guild roles' };
    const guildId = liveVariable('LIVE_DISCORD_GUILD_ID');
    const recorder = recordResponses();

    await fetch(`${API}/guilds/${guildId}/roles`, {
      headers: {
        Authorization: `Bot ${liveVariable('DISCORD_BOT_TOKEN')}`
      }
    });

    const roles = expectLiveResponse(
      discordGuildRolesSchema,
      recorder.body(`${API}/guilds/${guildId}/roles`, call),
      call
    );
    expect(roles.map((role) => role.name)).toContain('@everyone');
  });
});
