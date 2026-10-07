import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prismaMock, asPrismaClient } from '@giveaway/testing-server/prisma';
import {
  NOW,
  NOW_SECONDS,
  buildIntegration,
  jsonResponse
} from '@giveaway/testing-server/fixtures-integrations-utils';
import tokenResponse from '../testing/fixtures-x-oauth-token.json';
import { xTokenResponseSchema } from '../schemas';
import { getLatestTwitterAccessToken } from '../get-latest-twitter-access-token';

vi.hoisted(() => {
  vi.stubEnv('TWITTER_TEAM_APP_CLIENT_ID', 'twitter-client-id');
  vi.stubEnv('TWITTER_TEAM_APP_CLIENT_SECRET', 'twitter-client-secret');
});

const fetchMock = vi.fn<typeof fetch>();

describe('X POST /2/oauth2/token contract', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(jsonResponse(tokenResponse.body));
    prismaMock.integration.findFirst.mockResolvedValue(
      buildIntegration({ expires_at: NOW_SECONDS - 60 })
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('parses the recorded response with the schema of the token refresh', () => {
    expect(() => xTokenResponseSchema.parse(tokenResponse.body)).not.toThrow();
  });

  it('stores the tokens of the recorded response', async () => {
    await getLatestTwitterAccessToken(asPrismaClient(), { teamId: 'team-1' });

    expect(prismaMock.integration.update).toHaveBeenCalledWith({
      where: { id: 'integration-1' },
      data: {
        access_token: 'redacted-access-token',
        refresh_token: 'redacted-refresh-token',
        expires_at: NOW_SECONDS + 7200,
        scope: 'tweet.read tweet.write users.read media.write offline.access',
        token_type: 'bearer'
      }
    });
  });

  it('returns the new access token and its expiry', async () => {
    await expect(
      getLatestTwitterAccessToken(asPrismaClient(), { teamId: 'team-1' })
    ).resolves.toEqual({
      access_token: 'redacted-access-token',
      expires_at: NOW_SECONDS + 7200
    });
  });
});
