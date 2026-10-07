import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { findProviderResponseIssues } from '@giveaway/integration-server/provider-response';
import {
  TOKEN_URL,
  formBody,
  jsonResponse
} from '@giveaway/testing-server/fixtures-twitch';
import appTokenResponse from '../testing/fixtures-twitch-app-token.json';
import { twitchAppTokenResponseSchema } from '../schemas';
import { getAppAccessToken } from '../get-app-access-token';

vi.hoisted(() => {
  vi.stubEnv('TWITCH_CLIENT_ID', 'client-id');
  vi.stubEnv('TWITCH_CLIENT_SECRET', 'client-secret');
});

const fetchMock = vi.fn<typeof fetch>();

describe('Twitch POST /oauth2/token client_credentials contract', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(jsonResponse(appTokenResponse.body));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses the recorded response with the schema that getAppAccessToken uses', () => {
    expect(
      findProviderResponseIssues(
        twitchAppTokenResponseSchema,
        appTokenResponse.body
      )
    ).toEqual([]);
  });

  it('requests a client_credentials token for the app', async () => {
    await getAppAccessToken();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(TOKEN_URL);
    expect(formBody(init)).toEqual({
      client_id: 'client-id',
      client_secret: 'client-secret',
      grant_type: 'client_credentials'
    });
  });

  it('returns the access token of the recorded response', async () => {
    await expect(getAppAccessToken()).resolves.toBe('redacted-access-token');
  });
});
