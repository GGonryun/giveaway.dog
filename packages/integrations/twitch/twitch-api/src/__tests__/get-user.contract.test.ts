import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { findProviderResponseIssues } from '@giveaway/integration-server/provider-response';
import {
  USERS_URL,
  jsonResponse
} from '@giveaway/testing-server/fixtures-twitch';
import usersResponse from '../testing/fixtures-twitch-users.json';
import { twitchUsersResponseSchema } from '../schemas';
import { getTwitchUser } from '../get-user';

vi.hoisted(() => {
  vi.stubEnv('TWITCH_CLIENT_ID', 'client-id');
});

const fetchMock = vi.fn<typeof fetch>();

describe('Twitch GET /helix/users contract', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(jsonResponse(usersResponse.body));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses the recorded response with the schema that getTwitchUser uses', () => {
    expect(
      findProviderResponseIssues(twitchUsersResponseSchema, usersResponse.body)
    ).toEqual([]);
  });

  it('requests the user of the token', async () => {
    await getTwitchUser('user-token');

    expect(fetchMock).toHaveBeenCalledWith(USERS_URL, {
      headers: { Authorization: 'Bearer user-token', 'Client-Id': 'client-id' }
    });
  });

  it('returns the user of the recorded response', async () => {
    await expect(getTwitchUser('user-token')).resolves.toEqual({
      id: '141981764',
      login: 'twitchdev',
      display_name: 'TwitchDev',
      profile_image_url:
        'https://static-cdn.jtvnw.net/jtv_user_pictures/8a6381c7-d0c0-4576-b179-38bd5ce1d6af-profile_image-300x300.png'
    });
  });
});
