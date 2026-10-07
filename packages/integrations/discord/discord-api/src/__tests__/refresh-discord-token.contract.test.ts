import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { findProviderResponseIssues } from '@giveaway/integration-server/provider-response';
import { discordTokenResponseSchema } from '@giveaway/discord-model/schemas';
import { prismaMock, asPrismaClient } from '@giveaway/testing-server/prisma';
import {
  NOW,
  NOW_SECONDS,
  buildAccount,
  jsonResponse
} from '@giveaway/testing-server/fixtures-integrations-utils';
import tokenResponse from '../testing/fixtures-discord-oauth-token.json';
import { refreshDiscordToken } from '../refresh-discord-token';

const fetchMock = vi.fn<typeof fetch>();

describe('Discord POST /oauth2/token contract', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.stubEnv('DISCORD_ID', 'discord-client-id');
    vi.stubEnv('DISCORD_SECRET', 'discord-client-secret');
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(jsonResponse(tokenResponse.body));
    prismaMock.account.findFirst.mockResolvedValue(
      buildAccount({ expires_at: NOW_SECONDS - 60 })
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('parses the recorded response with the schema that refreshDiscordToken uses', () => {
    expect(
      findProviderResponseIssues(discordTokenResponseSchema, tokenResponse.body)
    ).toEqual([]);
  });

  it('stores the tokens of the recorded response', async () => {
    await refreshDiscordToken(asPrismaClient(), { userId: 'user-1' });

    expect(prismaMock.account.update).toHaveBeenCalledWith({
      where: {
        provider_providerAccountId: {
          provider: 'discord',
          providerAccountId: 'provider-account-1'
        }
      },
      data: {
        access_token: 'redacted-access-token',
        refresh_token: 'redacted-refresh-token',
        expires_at: NOW_SECONDS + 604800,
        scope: 'identify guilds',
        token_type: 'Bearer',
        status: 'ACTIVE'
      }
    });
  });

  it('returns the new access token and its expiry', async () => {
    await expect(
      refreshDiscordToken(asPrismaClient(), { userId: 'user-1' })
    ).resolves.toEqual({
      access_token: 'redacted-access-token',
      expires_at: NOW_SECONDS + 604800
    });
  });
});
