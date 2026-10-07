import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createEventSubSubscriptionsForFeatures } from '../create-eventsub-subscription';
import { ApplicationError } from '@giveaway/util-errors';
import { prismaMock } from '@giveaway/testing-server/prisma';
import {
  EVENTSUB_URL,
  TOKEN_URL,
  eventSubRecord,
  jsonBody,
  jsonResponse,
  subscriptionList,
  textResponse,
  twitchSubscription
} from '@giveaway/testing-server/fixtures-twitch';

vi.hoisted(() => {
  vi.stubEnv('TWITCH_CLIENT_ID', 'client-id');
  vi.stubEnv('TWITCH_CLIENT_SECRET', 'client-secret');
  vi.stubEnv('TWITCH_BOT_USER_ID', 'bot-1');
  vi.stubEnv('TWITCH_EVENTSUB_SECRET', 'eventsub-secret');
});

const REDEMPTION_TYPE = 'channel.channel_points_custom_reward_redemption.add';

const fetchMock = vi.fn<typeof fetch>();

type FetchRoutes = {
  list?: () => Response;
  create?: (body: { type: string; version: string }) => Response;
};

const routeFetch = ({
  list = () => jsonResponse(subscriptionList([])),
  create = (body) =>
    jsonResponse(
      subscriptionList([
        twitchSubscription({
          id: `new-${body.type}`,
          type: body.type,
          version: body.version,
          status: 'webhook_callback_verification_pending'
        })
      ]),
      202
    )
}: FetchRoutes = {}) => {
  fetchMock.mockImplementation(async (input, init) => {
    const url = String(input);
    if (url === TOKEN_URL) {
      return jsonResponse({ access_token: 'app-token' });
    }
    if (url === EVENTSUB_URL && init?.method === 'POST') {
      return create(jsonBody(init) as { type: string; version: string });
    }
    if (url === EVENTSUB_URL) {
      return list();
    }
    throw new Error(`Unexpected fetch to ${url}`);
  });
};

const listCalls = () =>
  fetchMock.mock.calls.filter(
    ([url, init]) => url === EVENTSUB_URL && init?.method === undefined
  );

const createCalls = () =>
  fetchMock.mock.calls.filter(
    ([url, init]) => url === EVENTSUB_URL && init?.method === 'POST'
  );

const baseArgs = {
  integrationId: 'integration-1',
  broadcasterId: 'broadcaster-1'
};

describe('createEventSubSubscriptionsForFeatures', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('TWITCH_EVENTSUB_URL', 'https://hooks.giveaway.test');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://giveaway.test');
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    prismaMock.eventSubSubscription.findFirst.mockResolvedValue(null);
    prismaMock.eventSubSubscription.create.mockImplementation(
      async ({ data }) => ({
        id: `db-${data.twitch_id}`,
        last_event_received_at: null,
        ...data
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('event sub type selection', () => {
    beforeEach(() => {
      routeFetch();
    });

    it('always subscribes to chat messages even with no features', async () => {
      const result = await createEventSubSubscriptionsForFeatures({
        ...baseArgs,
        features: []
      });

      expect(result.map((sub) => sub.type)).toEqual(['channel.chat.message']);
    });

    it('ignores features that have no event sub type', async () => {
      const result = await createEventSubSubscriptionsForFeatures({
        ...baseArgs,
        features: ['USER_PROFILE', 'MODERATION_READ']
      });

      expect(result.map((sub) => sub.type)).toEqual(['channel.chat.message']);
    });

    it('subscribes to each event sub type once', async () => {
      const result = await createEventSubSubscriptionsForFeatures({
        ...baseArgs,
        features: ['CHAT_COMMANDS', 'CHAT_COMMANDS']
      });

      expect(result).toHaveLength(1);
    });

    it('subscribes to channel point redemptions after chat messages', async () => {
      const result = await createEventSubSubscriptionsForFeatures({
        ...baseArgs,
        features: ['CHANNEL_REDEMPTIONS']
      });

      expect(result.map((sub) => sub.type)).toEqual([
        'channel.chat.message',
        REDEMPTION_TYPE
      ]);
    });

    it('requests one app access token for all event sub types', async () => {
      await createEventSubSubscriptionsForFeatures({
        ...baseArgs,
        features: ['CHANNEL_REDEMPTIONS']
      });

      const tokenCalls = fetchMock.mock.calls.filter(
        ([url]) => url === TOKEN_URL
      );
      expect(tokenCalls).toHaveLength(1);
    });
  });

  describe('when the subscription already exists in the database', () => {
    const existing = eventSubRecord({ id: 'db-existing' });

    beforeEach(() => {
      routeFetch();
      prismaMock.eventSubSubscription.findFirst.mockResolvedValue(existing);
    });

    it('looks the subscription up by integration, type and broadcaster', async () => {
      await createEventSubSubscriptionsForFeatures({
        ...baseArgs,
        features: []
      });

      expect(prismaMock.eventSubSubscription.findFirst).toHaveBeenCalledWith({
        where: {
          integrationId: 'integration-1',
          type: 'channel.chat.message',
          broadcaster_user_id: 'broadcaster-1'
        }
      });
    });

    it('returns the stored subscription', async () => {
      const result = await createEventSubSubscriptionsForFeatures({
        ...baseArgs,
        features: []
      });

      expect(result).toEqual([existing]);
    });

    it('does not query or create subscriptions on twitch', async () => {
      await createEventSubSubscriptionsForFeatures({
        ...baseArgs,
        features: []
      });

      expect(listCalls()).toHaveLength(0);
      expect(createCalls()).toHaveLength(0);
      expect(prismaMock.eventSubSubscription.create).not.toHaveBeenCalled();
    });
  });

  describe('when a matching subscription already exists on twitch', () => {
    const remote = twitchSubscription({
      id: 'twitch-existing',
      cost: 1,
      created_at: '2026-02-03T04:05:06.000Z'
    });

    beforeEach(() => {
      routeFetch({ list: () => jsonResponse(subscriptionList([remote])) });
    });

    it('lists subscriptions with the app token and client id', async () => {
      await createEventSubSubscriptionsForFeatures({
        ...baseArgs,
        features: []
      });

      expect(listCalls()).toEqual([
        [
          EVENTSUB_URL,
          {
            headers: {
              'Client-Id': 'client-id',
              Authorization: 'Bearer app-token'
            }
          }
        ]
      ]);
    });

    it('stores the twitch subscription in the database', async () => {
      await createEventSubSubscriptionsForFeatures({
        ...baseArgs,
        features: []
      });

      expect(prismaMock.eventSubSubscription.create).toHaveBeenCalledWith({
        data: {
          twitch_id: 'twitch-existing',
          integrationId: 'integration-1',
          type: 'channel.chat.message',
          version: '1',
          status: 'enabled',
          broadcaster_user_id: 'broadcaster-1',
          cost: 1,
          callback: 'https://giveaway.test/api/twitch/webhooks',
          method: 'webhook',
          created_at: new Date('2026-02-03T04:05:06.000Z')
        }
      });
    });

    it('returns the stored record', async () => {
      const result = await createEventSubSubscriptionsForFeatures({
        ...baseArgs,
        features: []
      });

      expect(result).toEqual([
        expect.objectContaining({
          id: 'db-twitch-existing',
          twitch_id: 'twitch-existing'
        })
      ]);
    });

    it('does not create a new subscription on twitch', async () => {
      await createEventSubSubscriptionsForFeatures({
        ...baseArgs,
        features: []
      });

      expect(createCalls()).toHaveLength(0);
    });

    it('stores the version twitch reports rather than the requested one', async () => {
      routeFetch({
        list: () =>
          jsonResponse(
            subscriptionList([
              twitchSubscription({ id: 'twitch-existing', version: '2' })
            ])
          )
      });

      await createEventSubSubscriptionsForFeatures({
        ...baseArgs,
        features: []
      });

      expect(prismaMock.eventSubSubscription.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ version: '2' })
      });
    });

    it('stores an empty callback and method when twitch omits them', async () => {
      routeFetch({
        list: () =>
          jsonResponse(
            subscriptionList([
              twitchSubscription({
                id: 'twitch-existing',
                transport: { method: '' }
              })
            ])
          )
      });

      await createEventSubSubscriptionsForFeatures({
        ...baseArgs,
        features: []
      });

      expect(prismaMock.eventSubSubscription.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ callback: '', method: '' })
      });
    });
  });

  describe('when no matching subscription exists on twitch', () => {
    it.each([
      ['a different type', { type: 'channel.follow' }],
      [
        'a different broadcaster',
        {
          condition: { broadcaster_user_id: 'someone-else', user_id: 'bot-1' }
        }
      ],
      [
        'a different bot user',
        {
          condition: {
            broadcaster_user_id: 'broadcaster-1',
            user_id: 'other-bot'
          }
        }
      ],
      [
        'no bot user condition',
        { condition: { broadcaster_user_id: 'broadcaster-1' } }
      ]
    ])(
      'creates a new subscription when the remote one has %s',
      async (_label, overrides) => {
        routeFetch({
          list: () =>
            jsonResponse(
              subscriptionList([
                twitchSubscription({ id: 'not-a-match', ...overrides })
              ])
            )
        });

        await createEventSubSubscriptionsForFeatures({
          ...baseArgs,
          features: []
        });

        expect(createCalls()).toHaveLength(1);
      }
    );

    it('posts the webhook subscription to twitch', async () => {
      routeFetch();

      await createEventSubSubscriptionsForFeatures({
        ...baseArgs,
        features: []
      });

      const [[url, init]] = createCalls();
      expect(url).toBe(EVENTSUB_URL);
      expect(init?.headers).toEqual({
        Authorization: 'Bearer app-token',
        'Client-Id': 'client-id',
        'Content-Type': 'application/json'
      });
      expect(jsonBody(init)).toEqual({
        type: 'channel.chat.message',
        version: '1',
        condition: { broadcaster_user_id: 'broadcaster-1', user_id: 'bot-1' },
        transport: {
          method: 'webhook',
          callback: 'https://hooks.giveaway.test/api/twitch/webhooks',
          secret: 'eventsub-secret'
        }
      });
    });

    it('includes the bot user condition for channel point redemptions too', async () => {
      routeFetch();

      await createEventSubSubscriptionsForFeatures({
        ...baseArgs,
        features: ['CHANNEL_REDEMPTIONS']
      });

      const redemptionCall = createCalls()
        .map(([, init]) => jsonBody(init))
        .find((body) => (body as { type: string }).type === REDEMPTION_TYPE);
      expect(redemptionCall).toMatchObject({
        type: REDEMPTION_TYPE,
        version: '1',
        condition: { broadcaster_user_id: 'broadcaster-1', user_id: 'bot-1' }
      });
    });

    it('falls back to the public app url for the callback', async () => {
      vi.stubEnv('TWITCH_EVENTSUB_URL', undefined);
      routeFetch();

      await createEventSubSubscriptionsForFeatures({
        ...baseArgs,
        features: []
      });

      const [[, init]] = createCalls();
      expect(jsonBody(init)).toMatchObject({
        transport: { callback: 'https://giveaway.test/api/twitch/webhooks' }
      });
    });

    it('uses the deployment URL in the callback when no url is configured', async () => {
      vi.stubEnv('TWITCH_EVENTSUB_URL', undefined);
      vi.stubEnv('NEXT_PUBLIC_APP_URL', undefined);
      vi.stubEnv('NEXT_PUBLIC_VERCEL_URL', undefined);
      vi.stubEnv('VERCEL_URL', 'giveaway-abc123-team.vercel.app');
      routeFetch();

      await createEventSubSubscriptionsForFeatures({
        ...baseArgs,
        features: []
      });

      const [[, init]] = createCalls();
      expect(jsonBody(init)).toMatchObject({
        transport: {
          callback:
            'https://giveaway-abc123-team.vercel.app/api/twitch/webhooks'
        }
      });
    });

    it('stores the created subscription in the database', async () => {
      routeFetch();

      await createEventSubSubscriptionsForFeatures({
        ...baseArgs,
        features: []
      });

      expect(prismaMock.eventSubSubscription.create).toHaveBeenCalledWith({
        data: {
          twitch_id: 'new-channel.chat.message',
          integrationId: 'integration-1',
          type: 'channel.chat.message',
          version: '1',
          status: 'webhook_callback_verification_pending',
          broadcaster_user_id: 'broadcaster-1',
          cost: 0,
          callback: 'https://giveaway.test/api/twitch/webhooks',
          method: 'webhook',
          created_at: new Date('2026-01-01T00:00:00.000Z')
        }
      });
    });

    it('stores the first subscription when twitch returns several', async () => {
      routeFetch({
        create: () =>
          jsonResponse(
            subscriptionList([
              twitchSubscription({ id: 'first-created' }),
              twitchSubscription({ id: 'second-created' })
            ])
          )
      });

      await createEventSubSubscriptionsForFeatures({
        ...baseArgs,
        features: []
      });

      expect(prismaMock.eventSubSubscription.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.eventSubSubscription.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ twitch_id: 'first-created' })
      });
    });

    it('stores the type, version and broadcaster that twitch returned', async () => {
      routeFetch({
        create: () =>
          jsonResponse(
            subscriptionList([
              twitchSubscription({
                id: 'created',
                type: 'channel.follow',
                version: '2',
                condition: { broadcaster_user_id: 'broadcaster-from-twitch' }
              })
            ])
          )
      });

      await createEventSubSubscriptionsForFeatures({
        ...baseArgs,
        features: []
      });

      expect(prismaMock.eventSubSubscription.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          twitch_id: 'created',
          type: 'channel.follow',
          version: '2',
          broadcaster_user_id: 'broadcaster-from-twitch'
        })
      });
    });

    it('returns the stored records in event sub type order', async () => {
      routeFetch();

      const result = await createEventSubSubscriptionsForFeatures({
        ...baseArgs,
        features: ['CHANNEL_REDEMPTIONS']
      });

      expect(result.map((sub) => sub.id)).toEqual([
        'db-new-channel.chat.message',
        `db-new-${REDEMPTION_TYPE}`
      ]);
    });

    it('stores an empty callback when twitch omits it from the created subscription', async () => {
      routeFetch({
        create: () =>
          jsonResponse(
            subscriptionList([
              twitchSubscription({
                id: 'created',
                transport: { method: 'webhook' }
              })
            ])
          )
      });

      await createEventSubSubscriptionsForFeatures({
        ...baseArgs,
        features: []
      });

      expect(prismaMock.eventSubSubscription.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ callback: '', method: 'webhook' })
      });
    });

    it('stores an empty method when twitch returns a blank method', async () => {
      routeFetch({
        create: () =>
          jsonResponse(
            subscriptionList([
              twitchSubscription({
                id: 'created',
                transport: {
                  method: '',
                  callback: 'https://giveaway.test/api/twitch/webhooks'
                }
              })
            ])
          )
      });

      await createEventSubSubscriptionsForFeatures({
        ...baseArgs,
        features: []
      });

      expect(prismaMock.eventSubSubscription.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ method: '' })
      });
    });
  });

  describe('when twitch rejects the new subscription', () => {
    beforeEach(() => {
      routeFetch({ create: () => textResponse('conflict', 409) });
    });

    it('throws an INTERNAL_SERVER_ERROR application error with the body as data', async () => {
      const error = await createEventSubSubscriptionsForFeatures({
        ...baseArgs,
        features: []
      }).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message:
          'Failed to create EventSub subscription for channel.chat.message',
        data: 'conflict'
      });
    });

    it('logs the failure body', async () => {
      await createEventSubSubscriptionsForFeatures({
        ...baseArgs,
        features: []
      }).catch(() => undefined);

      expect(console.error).toHaveBeenCalledWith(
        'EventSub subscription creation failed for channel.chat.message:',
        'conflict'
      );
    });

    it('does not store anything in the database', async () => {
      await createEventSubSubscriptionsForFeatures({
        ...baseArgs,
        features: []
      }).catch(() => undefined);

      expect(prismaMock.eventSubSubscription.create).not.toHaveBeenCalled();
    });
  });

  describe('when twitch returns an empty list for the new subscription', () => {
    it('throws BAD_GATEWAY without storing a subscription', async () => {
      routeFetch({ create: () => jsonResponse(subscriptionList([])) });

      await expect(
        createEventSubSubscriptionsForFeatures({ ...baseArgs, features: [] })
      ).rejects.toMatchObject({
        code: 'BAD_GATEWAY',
        data: {
          provider: 'twitch',
          call: 'POST /helix/eventsub/subscriptions'
        }
      });
      expect(prismaMock.eventSubSubscription.create).not.toHaveBeenCalled();
    });
  });

  describe('when twitch rejects the list request', () => {
    const unauthorized = () =>
      jsonResponse(
        { error: 'Unauthorized', status: 401, message: 'Invalid token' },
        401
      );

    it('throws INTERNAL_SERVER_ERROR with the response body', async () => {
      routeFetch({ list: unauthorized });

      const error = await createEventSubSubscriptionsForFeatures({
        ...baseArgs,
        features: []
      }).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to list EventSub subscriptions',
        data: JSON.stringify({
          error: 'Unauthorized',
          status: 401,
          message: 'Invalid token'
        })
      });
      expect(createCalls()).toHaveLength(0);
    });

    it('logs the failure and reports no schema mismatch', async () => {
      routeFetch({ list: unauthorized });

      await createEventSubSubscriptionsForFeatures({
        ...baseArgs,
        features: []
      }).catch(() => undefined);

      expect(console.error).toHaveBeenCalledWith(
        'EventSub subscription listing failed:',
        JSON.stringify({
          error: 'Unauthorized',
          status: 401,
          message: 'Invalid token'
        })
      );
      expect(console.error).not.toHaveBeenCalledWith(
        '[provider-response]',
        expect.anything()
      );
    });
  });

  describe('when twitch returns a malformed subscription list', () => {
    it('throws BAD_GATEWAY for a malformed list response', async () => {
      routeFetch({ list: () => jsonResponse({ data: 'nope' }) });

      await expect(
        createEventSubSubscriptionsForFeatures({ ...baseArgs, features: [] })
      ).rejects.toMatchObject({
        code: 'BAD_GATEWAY',
        data: { provider: 'twitch', call: 'GET /helix/eventsub/subscriptions' }
      });
      expect(createCalls()).toHaveLength(0);
    });

    it('throws BAD_GATEWAY for a malformed create response', async () => {
      routeFetch({ create: () => jsonResponse({ data: 'nope' }) });

      await expect(
        createEventSubSubscriptionsForFeatures({ ...baseArgs, features: [] })
      ).rejects.toMatchObject({
        code: 'BAD_GATEWAY',
        data: {
          provider: 'twitch',
          call: 'POST /helix/eventsub/subscriptions'
        }
      });
    });
  });

  describe('when the app access token request fails', () => {
    it('rejects before touching the database', async () => {
      fetchMock.mockResolvedValue(textResponse('bad credentials', 400));

      await expect(
        createEventSubSubscriptionsForFeatures({ ...baseArgs, features: [] })
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Failed to create client_credentials token: 400'
      });
      expect(prismaMock.eventSubSubscription.findFirst).not.toHaveBeenCalled();
    });
  });
});
