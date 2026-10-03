import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTwitchUser } from '../get-user';
import { ApplicationError } from '@giveaway/util-errors';
import {
  USERS_URL,
  jsonResponse,
  textResponse
} from '@/lib/twitch/__tests__/fixtures-twitch';

vi.hoisted(() => {
  vi.stubEnv('TWITCH_CLIENT_ID', 'client-id');
});

const fetchMock = vi.fn<typeof fetch>();

const twitchUser = {
  id: 'twitch-user-1',
  login: 'streamer',
  display_name: 'Streamer',
  profile_image_url: 'https://static.twitch.tv/streamer.png'
};

describe('getTwitchUser', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  describe('when twitch returns users', () => {
    beforeEach(() => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          data: [twitchUser, { ...twitchUser, id: 'twitch-user-2' }]
        })
      );
    });

    it('requests the users endpoint with the bearer token and client id', async () => {
      await getTwitchUser('user-token');

      expect(fetchMock).toHaveBeenCalledWith(USERS_URL, {
        headers: {
          Authorization: 'Bearer user-token',
          'Client-Id': 'client-id'
        }
      });
    });

    it('returns the first user in the response', async () => {
      await expect(getTwitchUser('user-token')).resolves.toEqual(twitchUser);
    });
  });

  describe('when twitch returns no users', () => {
    it('returns undefined', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ data: [] }));

      await expect(getTwitchUser('user-token')).resolves.toBeUndefined();
    });
  });

  describe('when twitch rejects the request', () => {
    it('throws a BAD_REQUEST application error with the status and body', async () => {
      fetchMock.mockResolvedValue(textResponse('invalid token', 401));

      const error = await getTwitchUser('user-token').catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Failed to fetch Twitch user: 401',
        data: 'invalid token'
      });
    });
  });
});
