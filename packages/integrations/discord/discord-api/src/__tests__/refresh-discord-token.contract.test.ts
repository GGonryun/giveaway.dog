import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeNetwork } from '@giveaway/testing-server/faults';
import { prismaMock, asPrismaClient } from '@giveaway/testing-server/prisma';
import {
  NOW,
  NOW_SECONDS,
  buildAccount
} from '@giveaway/testing-server/fixtures-integrations-utils';
import { discordTokenSchema } from '@giveaway/discord-model/schemas';
import { refreshDiscordToken } from '../refresh-discord-token';
import { discordTokenFixture } from '../testing/fixtures-discord-token';

const TOKEN_URL = 'POST https://discord.com/api/oauth2/token';

describe('Discord token refresh contract', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.stubEnv('DISCORD_ID', 'discord-client-id');
    vi.stubEnv('DISCORD_SECRET', 'discord-client-secret');
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    prismaMock.account.findFirst.mockResolvedValue(
      buildAccount({
        provider: 'discord',
        providerAccountId: 'discord-123',
        expires_at: NOW_SECONDS - 60
      })
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('parses the recorded token with the schema of the app', () => {
    expect(discordTokenSchema.safeParse(discordTokenFixture)).toEqual(
      expect.objectContaining({ success: true })
    );
  });

  it('stores the recorded token on the account', async () => {
    const network = fakeNetwork();
    network.json(TOKEN_URL, discordTokenFixture);

    const token = await refreshDiscordToken(asPrismaClient(), {
      userId: 'user-1'
    });

    expect(token).toEqual({
      access_token: 'discord-fixture-access-token',
      expires_at: NOW_SECONDS + 604800
    });
    expect(prismaMock.account.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          access_token: 'discord-fixture-access-token',
          refresh_token: 'discord-fixture-refresh-token',
          expires_at: NOW_SECONDS + 604800,
          scope: 'identify guilds guilds.members.read',
          token_type: 'Bearer',
          status: 'ACTIVE'
        }
      })
    );
  });

  it('refuses a token response without an access token', async () => {
    const network = fakeNetwork();
    network.json(TOKEN_URL, {
      ...discordTokenFixture,
      access_token: undefined
    });

    await expect(
      refreshDiscordToken(asPrismaClient(), { userId: 'user-1' })
    ).rejects.toMatchObject({
      code: 'BAD_GATEWAY',
      message: 'Invalid token response from Discord'
    });
    expect(prismaMock.account.update).not.toHaveBeenCalled();
  });
});
