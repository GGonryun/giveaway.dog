import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeNetwork } from '@giveaway/testing-server/faults';
import { prismaMock, asPrismaClient } from '@giveaway/testing-server/prisma';
import {
  NOW,
  NOW_SECONDS,
  buildAccount
} from '@giveaway/testing-server/fixtures-integrations-utils';
import { refreshTwitchToken } from '../refresh-twitch-token';
import { twitchBotTokenSchema, twitchUserTokenSchema } from '../schemas';
import { twitchUserTokenFixture } from '../testing/fixtures-twitch-user-token';

describe('Twitch user token refresh contract', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.stubEnv('TWITCH_CLIENT_ID', 'twitch-client-id');
    vi.stubEnv('TWITCH_CLIENT_SECRET', 'twitch-client-secret');
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    prismaMock.account.findFirst.mockResolvedValue(
      buildAccount({
        provider: 'twitch',
        providerAccountId: 'twitch-123',
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

  it('parses the recorded token with the user and bot token schemas', () => {
    expect(twitchUserTokenSchema.safeParse(twitchUserTokenFixture)).toEqual(
      expect.objectContaining({ success: true })
    );
    expect(twitchBotTokenSchema.safeParse(twitchUserTokenFixture)).toEqual(
      expect.objectContaining({ success: true })
    );
  });

  it('stores the recorded token on the account', async () => {
    const network = fakeNetwork();
    network.json(
      'POST https://id.twitch.tv/oauth2/token',
      twitchUserTokenFixture
    );

    const token = await refreshTwitchToken(asPrismaClient(), {
      userId: 'user-1'
    });

    expect(token).toEqual({
      access_token: 'twitch-fixture-user-access-token',
      expires_at: NOW_SECONDS + 14124
    });
    expect(prismaMock.account.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          access_token: 'twitch-fixture-user-access-token',
          refresh_token: 'twitch-fixture-refresh-token',
          expires_at: NOW_SECONDS + 14124,
          scope: 'channel:bot user:read:chat user:write:chat',
          token_type: 'bearer',
          status: 'ACTIVE'
        }
      })
    );
  });
});
