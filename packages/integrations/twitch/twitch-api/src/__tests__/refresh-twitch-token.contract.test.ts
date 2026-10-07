import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { findProviderResponseIssues } from '@giveaway/integration-server/provider-response';
import { prismaMock, asPrismaClient } from '@giveaway/testing-server/prisma';
import {
  NOW,
  NOW_SECONDS,
  buildAccount,
  jsonResponse
} from '@giveaway/testing-server/fixtures-integrations-utils';
import refreshTokenResponse from '../testing/fixtures-twitch-refresh-token.json';
import { twitchRefreshTokenResponseSchema } from '../schemas';
import { refreshTwitchToken } from '../refresh-twitch-token';

const fetchMock = vi.fn<typeof fetch>();

describe('Twitch POST /oauth2/token refresh_token contract', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.stubEnv('TWITCH_CLIENT_ID', 'twitch-client-id');
    vi.stubEnv('TWITCH_CLIENT_SECRET', 'twitch-client-secret');
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(jsonResponse(refreshTokenResponse.body));
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

  it('parses the recorded response with the schema that refreshTwitchToken uses', () => {
    expect(
      findProviderResponseIssues(
        twitchRefreshTokenResponseSchema,
        refreshTokenResponse.body
      )
    ).toEqual([]);
  });

  it('stores the tokens and the scopes of the recorded response', async () => {
    await refreshTwitchToken(asPrismaClient(), { userId: 'user-1' });

    expect(prismaMock.account.update).toHaveBeenCalledWith({
      where: {
        provider_providerAccountId: {
          provider: 'twitch',
          providerAccountId: 'twitch-123'
        }
      },
      data: {
        access_token: 'redacted-access-token',
        refresh_token: 'redacted-refresh-token',
        expires_at: NOW_SECONDS + 14124,
        scope: 'channel:bot channel:read:redemptions user:read:chat',
        token_type: 'bearer',
        status: 'ACTIVE'
      }
    });
  });

  it('returns the new access token and its expiry', async () => {
    await expect(
      refreshTwitchToken(asPrismaClient(), { userId: 'user-1' })
    ).resolves.toEqual({
      access_token: 'redacted-access-token',
      expires_at: NOW_SECONDS + 14124
    });
  });
});
