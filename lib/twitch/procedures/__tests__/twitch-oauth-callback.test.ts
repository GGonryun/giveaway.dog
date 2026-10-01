import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { twitchOAuthCallback } from '../twitch-oauth-callback';
import { prismaMock, knownRequestError } from '@/test/prisma';
import { signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';
import {
  TOKEN_URL,
  USERS_URL,
  eventSubRecord,
  formBody,
  jsonResponse,
  textResponse
} from '@/lib/twitch/__tests__/fixtures-twitch';

vi.hoisted(() => {
  vi.stubEnv('TWITCH_CLIENT_ID', 'client-id');
  vi.stubEnv('TWITCH_CLIENT_SECRET', 'client-secret');
  vi.stubEnv('TWITCH_BOT_USER_ID', 'bot-1');
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://giveaway.test');
});

const NOW = new Date('2026-10-01T12:00:00.000Z');
const NOW_SECONDS = Math.floor(NOW.getTime() / 1000);

type CallbackInput = Parameters<typeof twitchOAuthCallback>[0];

const userTokens = {
  access_token: 'user-access-token',
  refresh_token: 'user-refresh-token',
  expires_in: 14400,
  scope: ['openid', 'user:read:email'],
  token_type: 'bearer'
};

const twitchUser = {
  id: 'twitch-user-1',
  login: 'streamer',
  display_name: 'Streamer',
  profile_image_url: 'https://static.twitch.tv/streamer.png'
};

const expectedSettings = {
  broadcasterId: 'twitch-user-1',
  broadcasterLogin: 'streamer',
  broadcasterDisplayName: 'Streamer',
  channelUrl: 'https://twitch.tv/streamer'
};

const input = (overrides: Partial<CallbackInput['state']> = {}) =>
  ({
    code: 'auth-code',
    state: {
      teamId: 'team-1',
      teamSlug: 'acme',
      features: ['CHAT_COMMANDS'],
      ...overrides
    }
  }) as CallbackInput;

const fetchMock = vi.fn<typeof fetch>();

type Routes = {
  exchange?: () => Response;
  appToken?: () => Response;
  users?: () => Response;
};

const routeFetch = ({
  exchange = () => jsonResponse(userTokens),
  appToken = () => jsonResponse({ access_token: 'app-token' }),
  users = () => jsonResponse({ data: [twitchUser] })
}: Routes = {}) => {
  fetchMock.mockImplementation(async (url, init) => {
    if (String(url) === TOKEN_URL) {
      return formBody(init).grant_type === 'authorization_code'
        ? exchange()
        : appToken();
    }
    if (String(url) === USERS_URL) {
      return users();
    }
    throw new Error(`Unexpected fetch to ${String(url)}`);
  });
};

describe('twitchOAuthCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    prismaMock.integration.findFirst.mockResolvedValue(null);
    prismaMock.integration.create.mockResolvedValue({ id: 'integration-new' });
    prismaMock.eventSubSubscription.findFirst.mockResolvedValue(
      eventSubRecord()
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without calling twitch', async () => {
      const result = await twitchOAuthCallback(input());

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('when the input is invalid', () => {
    beforeEach(() => {
      signIn();
    });

    it('rejects a missing code', async () => {
      const result = await twitchOAuthCallback({
        state: input().state
      } as unknown as CallbackInput);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects a state with an unknown feature', async () => {
      const result = await twitchOAuthCallback(
        input({
          features: ['POST_TWEETS']
        } as unknown as Partial<CallbackInput['state']>)
      );

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
    });

    it('rejects a state without a team id', async () => {
      const result = await twitchOAuthCallback({
        code: 'auth-code',
        state: { teamSlug: 'acme' }
      } as unknown as CallbackInput);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
    });
  });

  describe('code exchange', () => {
    beforeEach(() => {
      signIn();
    });

    it('exchanges the authorization code for tokens', async () => {
      routeFetch();

      await twitchOAuthCallback(input());

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(TOKEN_URL);
      expect(init?.method).toBe('POST');
      expect(init?.headers).toEqual({
        'Content-Type': 'application/x-www-form-urlencoded'
      });
      expect(formBody(init)).toEqual({
        client_id: 'client-id',
        client_secret: 'client-secret',
        code: 'auth-code',
        grant_type: 'authorization_code',
        redirect_uri: 'https://giveaway.test/api/twitch/callback'
      });
    });

    it('logs the received tokens', async () => {
      routeFetch();

      await twitchOAuthCallback(input());

      expect(console.log).toHaveBeenCalledWith(
        'Twitch tokens received:',
        userTokens
      );
    });

    it('fetches the twitch user with the new access token', async () => {
      routeFetch();

      await twitchOAuthCallback(input());

      expect(fetchMock).toHaveBeenCalledWith(USERS_URL, {
        headers: {
          Authorization: 'Bearer user-access-token',
          'Client-Id': 'client-id'
        }
      });
    });

    it('returns BAD_REQUEST when twitch rejects the code', async () => {
      routeFetch({ exchange: () => textResponse('invalid code', 400) });

      const result = await twitchOAuthCallback(input());

      expect(expectFailure(result, 'BAD_REQUEST')).toMatchObject({
        message: 'Failed to exchange code for tokens: 400',
        data: 'invalid code'
      });
      expect(prismaMock.integration.findFirst).not.toHaveBeenCalled();
    });

    it('returns BAD_REQUEST when the twitch user cannot be fetched', async () => {
      routeFetch({ users: () => textResponse('unauthorized', 401) });

      const result = await twitchOAuthCallback(input());

      expect(expectFailure(result, 'BAD_REQUEST')).toMatchObject({
        message: 'Failed to fetch Twitch user: 401',
        data: 'unauthorized'
      });
      expect(prismaMock.integration.findFirst).not.toHaveBeenCalled();
    });

    it('returns INTERNAL_SERVER_ERROR when twitch returns no user', async () => {
      routeFetch({ users: () => jsonResponse({ data: [] }) });

      const result = await twitchOAuthCallback(input());

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toMatch(
        /Cannot read properties of undefined/
      );
      expect(prismaMock.integration.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('when the team has no integration for the twitch account', () => {
    beforeEach(() => {
      signIn();
      routeFetch();
    });

    it('looks up the integration by team, provider and account', async () => {
      await twitchOAuthCallback(input());

      expect(prismaMock.integration.findFirst).toHaveBeenCalledWith({
        where: {
          teamId: 'team-1',
          provider: 'TWITCH',
          account_id: 'twitch-user-1'
        }
      });
    });

    it('creates an integration owned by the caller', async () => {
      await twitchOAuthCallback(input());

      expect(prismaMock.integration.create).toHaveBeenCalledWith({
        data: {
          teamId: 'team-1',
          ownerId: TEST_USER.id,
          provider: 'TWITCH',
          account_id: 'twitch-user-1',
          access_token: 'user-access-token',
          refresh_token: 'user-refresh-token',
          expires_at: NOW_SECONDS + 14400,
          scope: 'openid user:read:email',
          token_type: 'bearer',
          label: 'streamer',
          settings: expectedSettings
        }
      });
    });

    it('rounds the token expiry down to whole seconds', async () => {
      vi.setSystemTime(new Date('2026-10-01T12:00:00.900Z'));

      await twitchOAuthCallback(input());

      expect(prismaMock.integration.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ expires_at: NOW_SECONDS + 14400 })
      });
    });

    it('does not update any integration', async () => {
      await twitchOAuthCallback(input());

      expect(prismaMock.integration.update).not.toHaveBeenCalled();
    });

    it('creates event sub subscriptions for the new integration', async () => {
      await twitchOAuthCallback(input());

      expect(prismaMock.eventSubSubscription.findFirst).toHaveBeenCalledWith({
        where: {
          integrationId: 'integration-new',
          type: 'channel.chat.message',
          broadcaster_user_id: 'twitch-user-1'
        }
      });
    });

    it('returns success with the twitch login', async () => {
      const result = await twitchOAuthCallback(input());

      expect(expectOk(result)).toEqual({ success: true, username: 'streamer' });
    });
  });

  describe('when the team already has an integration for the twitch account', () => {
    beforeEach(() => {
      signIn();
      routeFetch();
      prismaMock.integration.findFirst.mockResolvedValue({
        id: 'integration-existing'
      });
    });

    it('refreshes the tokens and settings and reactivates it', async () => {
      await twitchOAuthCallback(input());

      expect(prismaMock.integration.update).toHaveBeenCalledWith({
        where: { id: 'integration-existing' },
        data: {
          access_token: 'user-access-token',
          refresh_token: 'user-refresh-token',
          expires_at: NOW_SECONDS + 14400,
          scope: 'openid user:read:email',
          token_type: 'bearer',
          label: 'streamer',
          settings: expectedSettings,
          status: 'ACTIVE'
        }
      });
    });

    it('rounds the refreshed token expiry down to whole seconds', async () => {
      vi.setSystemTime(new Date('2026-10-01T12:00:00.900Z'));

      await twitchOAuthCallback(input());

      expect(prismaMock.integration.update).toHaveBeenCalledWith({
        where: { id: 'integration-existing' },
        data: expect.objectContaining({ expires_at: NOW_SECONDS + 14400 })
      });
    });

    it('does not create a new integration', async () => {
      await twitchOAuthCallback(input());

      expect(prismaMock.integration.create).not.toHaveBeenCalled();
    });

    it.each([
      ['a string scope unchanged', 'openid chat', 'openid chat'],
      ['an empty scope list as an empty array', [], []],
      ['an undefined scope when twitch omits it', undefined, undefined]
    ])('updates %s', async (_, scope, expected) => {
      routeFetch({ exchange: () => jsonResponse({ ...userTokens, scope }) });

      await twitchOAuthCallback(input());

      expect(prismaMock.integration.update).toHaveBeenCalledWith({
        where: { id: 'integration-existing' },
        data: expect.objectContaining({ scope: expected })
      });
    });

    it('creates event sub subscriptions for the existing integration', async () => {
      await twitchOAuthCallback(input());

      expect(prismaMock.eventSubSubscription.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            integrationId: 'integration-existing'
          })
        })
      );
    });

    it('returns success with the twitch login', async () => {
      const result = await twitchOAuthCallback(input());

      expect(expectOk(result)).toEqual({ success: true, username: 'streamer' });
    });
  });

  describe('token scope formatting', () => {
    beforeEach(() => {
      signIn();
    });

    it('stores a string scope unchanged', async () => {
      routeFetch({
        exchange: () => jsonResponse({ ...userTokens, scope: 'openid chat' })
      });

      await twitchOAuthCallback(input());

      expect(prismaMock.integration.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ scope: 'openid chat' })
      });
    });

    it('stores an empty scope list as an empty array', async () => {
      routeFetch({
        exchange: () => jsonResponse({ ...userTokens, scope: [] })
      });

      await twitchOAuthCallback(input());

      expect(prismaMock.integration.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ scope: [] })
      });
    });

    it('stores an undefined scope when twitch omits it', async () => {
      routeFetch({
        exchange: () => jsonResponse({ ...userTokens, scope: undefined })
      });

      await twitchOAuthCallback(input());

      expect(prismaMock.integration.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ scope: undefined })
      });
    });
  });

  describe('event sub features', () => {
    beforeEach(() => {
      signIn();
      routeFetch();
    });

    it('subscribes to channel point redemptions when requested', async () => {
      await twitchOAuthCallback(input({ features: ['CHANNEL_REDEMPTIONS'] }));

      expect(
        prismaMock.eventSubSubscription.findFirst.mock.calls.map(
          ([args]) => args.where.type
        )
      ).toEqual([
        'channel.chat.message',
        'channel.channel_points_custom_reward_redemption.add'
      ]);
    });

    it('defaults to chat commands when the state omits features', async () => {
      await twitchOAuthCallback({
        code: 'auth-code',
        state: { teamId: 'team-1', teamSlug: 'acme' }
      } as CallbackInput);

      expect(prismaMock.eventSubSubscription.findFirst).toHaveBeenCalledTimes(
        1
      );
    });

    it('returns the subscription error after the integration was stored', async () => {
      routeFetch({ appToken: () => textResponse('bad credentials', 500) });

      const result = await twitchOAuthCallback(input());

      expect(expectFailure(result, 'BAD_REQUEST').message).toBe(
        'Failed to create client_credentials token: 500'
      );
      expect(prismaMock.integration.create).toHaveBeenCalled();
    });
  });

  describe('when storing the integration fails', () => {
    it('maps a unique constraint error to INTERNAL_SERVER_ERROR', async () => {
      signIn();
      routeFetch();
      prismaMock.integration.create.mockRejectedValue(
        knownRequestError('P2002')
      );

      const result = await twitchOAuthCallback(input());

      expectFailure(result, 'INTERNAL_SERVER_ERROR');
      expect(prismaMock.eventSubSubscription.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('when twitch oauth is not configured', () => {
    it('returns INTERNAL_SERVER_ERROR without calling twitch when only the client secret is missing', async () => {
      vi.resetModules();
      vi.stubEnv('TWITCH_CLIENT_ID', 'client-id');
      vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://giveaway.test');
      vi.stubEnv('TWITCH_CLIENT_SECRET', '');
      const isolated = await import('../twitch-oauth-callback');
      signIn();

      const result = await isolated.twitchOAuthCallback(input());

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Twitch OAuth not configured'
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('also checks the client id', async () => {
      vi.resetModules();
      vi.stubEnv('TWITCH_CLIENT_ID', '');
      vi.stubEnv('TWITCH_CLIENT_SECRET', 'client-secret');
      const isolated = await import('../twitch-oauth-callback');
      signIn();

      const result = await isolated.twitchOAuthCallback(input());

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Twitch OAuth not configured'
      );
    });
  });
});
