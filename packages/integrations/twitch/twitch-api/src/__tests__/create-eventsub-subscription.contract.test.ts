import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { findProviderResponseIssues } from '@giveaway/integration-server/provider-response';
import { eventSubSubscriptionsListSchema } from '@giveaway/twitch-model/schemas';
import { prismaMock } from '@giveaway/testing-server/prisma';
import {
  EVENTSUB_URL,
  TOKEN_URL,
  jsonBody,
  jsonResponse
} from '@giveaway/testing-server/fixtures-twitch';
import appTokenResponse from '../testing/fixtures-twitch-app-token.json';
import createdSubscriptionResponse from '../testing/fixtures-twitch-eventsub-create.json';
import subscriptionsResponse from '../testing/fixtures-twitch-eventsub-subscriptions.json';
import { twitchCreatedSubscriptionResponseSchema } from '../schemas';
import { createEventSubSubscriptionsForFeatures } from '../create-eventsub-subscription';

vi.hoisted(() => {
  vi.stubEnv('TWITCH_CLIENT_ID', 'client-id');
  vi.stubEnv('TWITCH_CLIENT_SECRET', 'client-secret');
  vi.stubEnv('TWITCH_BOT_USER_ID', '1024680359');
  vi.stubEnv('TWITCH_EVENTSUB_SECRET', 'eventsub-secret');
});

const fetchMock = vi.fn<typeof fetch>();

const routeFetch = (list: unknown) => {
  fetchMock.mockImplementation(async (input, init) => {
    const url = String(input);
    if (url === TOKEN_URL) return jsonResponse(appTokenResponse.body);
    if (url === EVENTSUB_URL && init?.method === 'POST') {
      return jsonResponse(createdSubscriptionResponse.body, 202);
    }
    if (url === EVENTSUB_URL) return jsonResponse(list);
    throw new Error(`Unexpected fetch to ${url}`);
  });
};

const createCalls = () =>
  fetchMock.mock.calls.filter(
    ([url, init]) => url === EVENTSUB_URL && init?.method === 'POST'
  );

describe('Twitch EventSub subscriptions contract', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('TWITCH_EVENTSUB_URL', 'https://www.giveaway.dog');
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
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

  it('parses the recorded list with the schema of the list request', () => {
    expect(
      findProviderResponseIssues(
        eventSubSubscriptionsListSchema,
        subscriptionsResponse.body
      )
    ).toEqual([]);
  });

  it('parses the recorded subscription with the schema of the create request', () => {
    expect(
      findProviderResponseIssues(
        twitchCreatedSubscriptionResponseSchema,
        createdSubscriptionResponse.body
      )
    ).toEqual([]);
  });

  it('stores the matching subscription of the recorded list without creating one', async () => {
    routeFetch(subscriptionsResponse.body);

    await createEventSubSubscriptionsForFeatures({
      integrationId: 'integration-1',
      broadcasterId: '100000001',
      features: []
    });

    expect(createCalls()).toHaveLength(0);
    expect(prismaMock.eventSubSubscription.create).toHaveBeenCalledWith({
      data: {
        twitch_id: '00000000-0000-4000-8000-000000000001',
        integrationId: 'integration-1',
        type: 'channel.chat.message',
        version: '1',
        status: 'enabled',
        broadcaster_user_id: '100000001',
        cost: 0,
        callback: 'https://www.giveaway.dog/api/twitch/webhooks',
        method: 'webhook',
        created_at: new Date('2026-10-06T16:00:00.634Z')
      }
    });
  });

  it('creates the subscription and stores the one of the recorded response', async () => {
    routeFetch({ ...subscriptionsResponse.body, total: 0, data: [] });

    await createEventSubSubscriptionsForFeatures({
      integrationId: 'integration-1',
      broadcasterId: '100000001',
      features: []
    });

    expect(createCalls()).toHaveLength(1);
    expect(jsonBody(createCalls()[0][1])).toEqual({
      type: 'channel.chat.message',
      version: '1',
      condition: { broadcaster_user_id: '100000001', user_id: '1024680359' },
      transport: {
        method: 'webhook',
        callback: 'https://www.giveaway.dog/api/twitch/webhooks',
        secret: 'eventsub-secret'
      }
    });
    expect(prismaMock.eventSubSubscription.create).toHaveBeenCalledWith({
      data: {
        twitch_id: 'f1c2a387-161a-49f9-a165-0f21d7a4e1c4',
        integrationId: 'integration-1',
        type: 'channel.chat.message',
        version: '1',
        status: 'webhook_callback_verification_pending',
        broadcaster_user_id: '100000001',
        cost: 0,
        callback: 'https://www.giveaway.dog/api/twitch/webhooks',
        method: 'webhook',
        created_at: new Date('2026-10-06T16:00:00.634Z')
      }
    });
  });
});
