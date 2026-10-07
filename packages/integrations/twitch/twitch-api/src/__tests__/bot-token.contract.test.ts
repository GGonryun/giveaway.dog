import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { findProviderResponseIssues } from '@giveaway/integration-server/provider-response';
import { jsonResponse } from '@giveaway/testing-server/fixtures-twitch';
import refreshTokenResponse from '../testing/fixtures-twitch-refresh-token.json';
import { twitchBotTokenResponseSchema } from '../schemas';
import { getBotAccessToken } from '../bot-token';

vi.hoisted(() => {
  vi.stubEnv('TWITCH_CLIENT_ID', 'client-id');
  vi.stubEnv('TWITCH_CLIENT_SECRET', 'client-secret');
});

const redisMock = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn()
}));

vi.mock('@giveaway/cache/redis', () => ({ redis: redisMock }));

const fetchMock = vi.fn<typeof fetch>();

describe('Twitch POST /oauth2/token refresh_token contract for the bot', () => {
  beforeEach(() => {
    redisMock.get.mockReset().mockResolvedValue(null);
    redisMock.set.mockReset().mockResolvedValue('OK');
    vi.stubEnv('TWITCH_BOT_REFRESH_TOKEN', 'bot-refresh-token');
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(jsonResponse(refreshTokenResponse.body));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('parses the recorded response with the schema that the bot token uses', () => {
    expect(
      findProviderResponseIssues(
        twitchBotTokenResponseSchema,
        refreshTokenResponse.body
      )
    ).toEqual([]);
  });

  it('caches the token of the recorded response for one minute less than it lives', async () => {
    await expect(getBotAccessToken()).resolves.toBe('redacted-access-token');

    expect(redisMock.set).toHaveBeenCalledWith(
      'twitch:bot:access_token',
      'redacted-access-token',
      { ex: 14064 }
    );
  });
});
