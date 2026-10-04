import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkTwitchFollow } from '../twitch';
import { TwitchFollowTaskSchema } from '@giveaway/task-model/schemas';
import {
  BASE_TASK,
  IDS,
  applicationError,
  db,
  jsonResponse,
  textResponse
} from '@giveaway/testing-server/fixtures-task-validation';

const tokens = vi.hoisted(() => ({ refreshTwitchToken: vi.fn() }));

vi.mock('@giveaway/twitch-api/refresh-twitch-token', () => ({
  refreshTwitchToken: tokens.refreshTwitchToken
}));

const fetchMock = vi.fn<typeof fetch>();

const buildTask = (
  channel = 'https://www.twitch.tv/streamer'
): TwitchFollowTaskSchema => ({
  ...BASE_TASK,
  id: 'task-twitch',
  type: 'TWITCH_FOLLOW',
  channel
});

const followTwitch = (channel?: string) =>
  checkTwitchFollow(db, { task: buildTask(channel), userId: IDS.userId });

const AUTH_HEADERS = {
  headers: {
    Authorization: 'Bearer twitch-access',
    'Client-Id': 'twitch-client'
  }
};

const INVALID_AUTH =
  'Twitch authorization is invalid. Please reconnect your Twitch account.';

const broadcasterFound = () =>
  jsonResponse({ data: [{ id: 'broadcaster-1', login: 'streamer' }] });

const viewerFound = () => jsonResponse({ data: [{ id: 'viewer-1' }] });

describe('checkTwitchFollow', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('TWITCH_CLIENT_ID', 'twitch-client');
    fetchMock.mockReset();
    tokens.refreshTwitchToken.mockReset();
    tokens.refreshTwitchToken.mockResolvedValue({
      access_token: 'twitch-access',
      expires_at: 4102444800
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  describe('when the user follows the channel', () => {
    beforeEach(() => {
      fetchMock
        .mockResolvedValueOnce(broadcasterFound())
        .mockResolvedValueOnce(viewerFound())
        .mockResolvedValueOnce(
          jsonResponse({ data: [{ broadcaster_id: 'broadcaster-1' }] })
        );
    });

    it('resolves', async () => {
      await expect(followTwitch()).resolves.toBeUndefined();
    });

    it('refreshes the Twitch token for the user', async () => {
      await followTwitch();

      expect(tokens.refreshTwitchToken).toHaveBeenCalledWith(db, {
        userId: IDS.userId
      });
    });

    it('looks up the broadcaster, the viewer and the follow relationship', async () => {
      await followTwitch();

      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        'https://api.twitch.tv/helix/users?login=streamer',
        AUTH_HEADERS
      );
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        'https://api.twitch.tv/helix/users',
        AUTH_HEADERS
      );
      expect(fetchMock).toHaveBeenNthCalledWith(
        3,
        'https://api.twitch.tv/helix/channels/followed?user_id=viewer-1&broadcaster_id=broadcaster-1',
        AUTH_HEADERS
      );
    });

    it('keeps the username case from the channel URL', async () => {
      await followTwitch('https://twitch.tv/Streamer_01');

      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        'https://api.twitch.tv/helix/users?login=Streamer_01',
        AUTH_HEADERS
      );
    });

    it('accepts a four-character username', async () => {
      await followTwitch('https://twitch.tv/abcd');

      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        'https://api.twitch.tv/helix/users?login=abcd',
        AUTH_HEADERS
      );
    });

    it('uses only the first 25 characters of a longer username', async () => {
      await followTwitch(`https://twitch.tv/${'a'.repeat(25)}bbbbb`);

      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        `https://api.twitch.tv/helix/users?login=${'a'.repeat(25)}`,
        AUTH_HEADERS
      );
    });
  });

  it('propagates token refresh failures without calling Twitch', async () => {
    const failure = new Error('refresh failed');
    tokens.refreshTwitchToken.mockRejectedValue(failure);

    await expect(followTwitch()).rejects.toBe(failure);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects with INTERNAL_SERVER_ERROR when the Twitch client id is not configured', async () => {
    vi.stubEnv('TWITCH_CLIENT_ID', '');

    const error = await applicationError(followTwitch());

    expect(error).toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Twitch OAuth not configured'
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects with INTERNAL_SERVER_ERROR when the username is too short to extract', async () => {
    const error = await applicationError(followTwitch('https://twitch.tv/abc'));

    expect(error).toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to extract channel username from the URL.'
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  describe('when the broadcaster lookup fails', () => {
    it('rejects with UNAUTHORIZED on a 401', async () => {
      fetchMock.mockResolvedValueOnce(textResponse('invalid token', 401));

      const error = await applicationError(followTwitch());

      expect(error).toMatchObject({
        code: 'UNAUTHORIZED',
        message: INVALID_AUTH,
        cause: 'invalid token'
      });
    });

    it('rejects with INTERNAL_SERVER_ERROR on any other status', async () => {
      fetchMock.mockResolvedValueOnce(textResponse('server error', 500));

      const error = await applicationError(followTwitch());

      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch broadcaster information from Twitch.',
        cause: 'server error'
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['an empty data array', { data: [] }],
      ['a missing data field', {}]
    ])(
      'rejects with INTERNAL_SERVER_ERROR when the broadcaster is not found (%s)',
      async (_label, body) => {
        fetchMock.mockResolvedValueOnce(jsonResponse(body));

        const error = await applicationError(followTwitch());

        expect(error).toMatchObject({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Broadcaster not found on Twitch.'
        });
      }
    );
  });

  describe('when the viewer lookup fails', () => {
    beforeEach(() => {
      fetchMock.mockResolvedValueOnce(broadcasterFound());
    });

    it('rejects with INTERNAL_SERVER_ERROR even on a 401', async () => {
      fetchMock.mockResolvedValueOnce(textResponse('unauthorized', 401));

      const error = await applicationError(followTwitch());

      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch user information from Twitch.',
        cause: 'unauthorized'
      });
    });

    it.each([
      ['an empty data array', { data: [] }],
      ['a missing data field', {}]
    ])(
      'rejects with INTERNAL_SERVER_ERROR when the viewer is not found (%s)',
      async (_label, body) => {
        fetchMock.mockResolvedValueOnce(jsonResponse(body));

        const error = await applicationError(followTwitch());

        expect(error).toMatchObject({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'User not found on Twitch.'
        });
      }
    );
  });

  describe('when the follow lookup fails', () => {
    beforeEach(() => {
      fetchMock
        .mockResolvedValueOnce(broadcasterFound())
        .mockResolvedValueOnce(viewerFound());
    });

    it('rejects with UNAUTHORIZED on a 401', async () => {
      fetchMock.mockResolvedValueOnce(textResponse('missing scope', 401));

      const error = await applicationError(followTwitch());

      expect(error).toMatchObject({
        code: 'UNAUTHORIZED',
        message: INVALID_AUTH,
        cause: 'missing scope'
      });
    });

    it('rejects with INTERNAL_SERVER_ERROR on any other status', async () => {
      fetchMock.mockResolvedValueOnce(textResponse('bad gateway', 502));

      const error = await applicationError(followTwitch());

      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to verify Twitch follow status.',
        cause: 'bad gateway'
      });
    });
  });

  describe('when the user does not follow the channel', () => {
    it.each([
      ['an empty data array', { data: [] }],
      ['a missing data field', {}]
    ])(
      'rejects with a silent VALIDATION_ERROR for %s',
      async (_label, body) => {
        fetchMock
          .mockResolvedValueOnce(broadcasterFound())
          .mockResolvedValueOnce(viewerFound())
          .mockResolvedValueOnce(jsonResponse(body));

        const error = await applicationError(followTwitch());

        expect(error).toMatchObject({
          code: 'VALIDATION_ERROR',
          message:
            'You must be following streamer on Twitch to complete this task.',
          silent: true
        });
      }
    );
  });
});
