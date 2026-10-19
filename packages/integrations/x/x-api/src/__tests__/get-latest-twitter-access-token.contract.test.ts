import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeNetwork } from '@giveaway/testing-server/faults';
import { prismaMock, asPrismaClient } from '@giveaway/testing-server/prisma';
import {
  NOW,
  NOW_SECONDS,
  buildIntegration
} from '@giveaway/testing-server/fixtures-integrations-utils';
import { getLatestTwitterAccessToken } from '../get-latest-twitter-access-token';
import { twitterTokenResponseSchema } from '../schemas';
import { xTokenFixture } from '../testing/fixtures-x-token';

vi.hoisted(() => {
  vi.stubEnv('TWITTER_TEAM_APP_CLIENT_ID', 'twitter-client-id');
  vi.stubEnv('TWITTER_TEAM_APP_CLIENT_SECRET', 'twitter-client-secret');
});

const TOKEN_URL = 'POST https://api.x.com/2/oauth2/token';

describe('X token refresh contract', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    prismaMock.integration.findFirst.mockResolvedValue(
      buildIntegration({ expires_at: NOW_SECONDS - 60 })
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('parses the recorded token with the schema of the app', () => {
    expect(twitterTokenResponseSchema.safeParse(xTokenFixture)).toEqual(
      expect.objectContaining({ success: true })
    );
  });

  it('stores the recorded token on the integration', async () => {
    const network = fakeNetwork();
    network.json(TOKEN_URL, xTokenFixture);

    const token = await getLatestTwitterAccessToken(asPrismaClient(), {
      teamId: 'team-1'
    });

    expect(token).toEqual({
      access_token: 'x-fixture-access-token',
      expires_at: NOW_SECONDS + 7200
    });
    expect(prismaMock.integration.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          access_token: 'x-fixture-access-token',
          refresh_token: 'x-fixture-refresh-token',
          expires_at: NOW_SECONDS + 7200,
          scope: 'tweet.write users.read tweet.read offline.access media.write',
          token_type: 'bearer'
        }
      })
    );
  });

  it('refuses a token response without an expiry', async () => {
    const network = fakeNetwork();
    network.json(TOKEN_URL, { ...xTokenFixture, expires_in: undefined });

    await expect(
      getLatestTwitterAccessToken(asPrismaClient(), { teamId: 'team-1' })
    ).rejects.toMatchObject({
      code: 'BAD_GATEWAY',
      message: 'Invalid token response from X'
    });
    expect(prismaMock.integration.update).not.toHaveBeenCalled();
  });
});
