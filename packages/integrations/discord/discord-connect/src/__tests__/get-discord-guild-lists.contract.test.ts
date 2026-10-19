import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeNetwork } from '@giveaway/testing-server/faults';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn } from '@giveaway/testing-server/session';
import { expectOk } from '@giveaway/testing-server/result';
import {
  discordGuildChannelsSchema,
  discordGuildRolesSchema
} from '@giveaway/discord-model/schemas';
import { teamWithRole } from '@giveaway/discord-model/testing/fixtures-discord-procedures-workflows';
import { discordGuildChannelsFixture } from '@giveaway/discord-api/testing/fixtures-discord-guild-channels';
import { discordGuildRolesFixture } from '@giveaway/discord-api/testing/fixtures-discord-guild-roles';
import { getDiscordChannels } from '../get-discord-channels';
import { getDiscordRoles } from '../get-discord-roles';

const GUILD = 'https://discord.com/api/v10/guilds/1100000000000000001';

const input = { slug: 'acme', integrationId: 'integration-1' };

describe('Discord guild roles and channels contract', () => {
  beforeEach(() => {
    vi.stubEnv('DISCORD_BOT_TOKEN', 'bot-token');
    signIn();
    prismaMock.team.findUnique.mockResolvedValue(teamWithRole());
    prismaMock.integration.findFirst.mockResolvedValue({
      id: 'integration-1',
      teamId: 'team-1',
      provider: 'DISCORD',
      account_id: '1100000000000000001'
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('parses the recorded roles and channels with the schemas of the app', () => {
    expect(discordGuildRolesSchema.safeParse(discordGuildRolesFixture)).toEqual(
      expect.objectContaining({ success: true })
    );
    expect(
      discordGuildChannelsSchema.safeParse(discordGuildChannelsFixture)
    ).toEqual(expect.objectContaining({ success: true }));
  });

  it('lists the recorded roles without @everyone, highest first', async () => {
    const network = fakeNetwork();
    network.json(`${GUILD}/roles`, discordGuildRolesFixture);

    const result = await getDiscordRoles(input);

    expect(expectOk(result)).toEqual({
      roles: [
        {
          id: '1400000000000000003',
          name: 'Giveaway Dog',
          color: 0,
          position: 3
        },
        {
          id: '1400000000000000001',
          name: 'Giveaway Winners',
          color: 15844367,
          position: 2
        },
        {
          id: '1400000000000000002',
          name: 'Members',
          color: 3447003,
          position: 1
        }
      ]
    });
  });

  it('lists the recorded text channels by name', async () => {
    const network = fakeNetwork();
    network.json(`${GUILD}/channels`, discordGuildChannelsFixture);

    const result = await getDiscordChannels(input);

    expect(expectOk(result)).toEqual({
      channels: [
        { id: '1300000000000000001', name: 'general' },
        { id: '1300000000000000004', name: 'giveaways' }
      ]
    });
  });
});
