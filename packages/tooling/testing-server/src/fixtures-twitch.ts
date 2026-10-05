import type { EventSubSubscription } from '@prisma/client';

export const TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
export const EVENTSUB_URL =
  'https://api.twitch.tv/helix/eventsub/subscriptions';
export const USERS_URL = 'https://api.twitch.tv/helix/users';
export const CHAT_URL = 'https://api.twitch.tv/helix/chat/messages';

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

export const textResponse = (body: string, status: number) =>
  new Response(body, { status });

export const emptyResponse = (status: number) => new Response(null, { status });

export const formBody = (init: RequestInit | undefined) =>
  Object.fromEntries(init?.body as URLSearchParams);

export const jsonBody = (init: RequestInit | undefined) =>
  JSON.parse(init?.body as string) as unknown;

export const twitchSubscription = (
  overrides: Record<string, unknown> = {}
) => ({
  id: 'twitch-sub-1',
  status: 'enabled',
  type: 'channel.chat.message',
  version: '1',
  condition: { broadcaster_user_id: 'broadcaster-1', user_id: 'bot-1' },
  created_at: '2026-01-01T00:00:00.000Z',
  transport: {
    method: 'webhook',
    callback: 'https://giveaway.test/api/twitch/webhooks'
  },
  cost: 0,
  ...overrides
});

export const subscriptionList = (data: unknown[]) => ({
  total: data.length,
  data,
  max_total_cost: 10000,
  total_cost: 0,
  pagination: {}
});

export const eventSubRecord = (
  overrides: Partial<EventSubSubscription> = {}
): EventSubSubscription => ({
  id: 'db-sub-1',
  twitch_id: 'twitch-sub-1',
  integrationId: 'integration-1',
  type: 'channel.chat.message',
  version: '1',
  status: 'enabled',
  broadcaster_user_id: 'broadcaster-1',
  cost: 0,
  callback: 'https://giveaway.test/api/twitch/webhooks',
  method: 'webhook',
  created_at: new Date('2026-01-01T00:00:00.000Z'),
  last_event_received_at: null,
  ...overrides
});

export const subscriptionPayload = (
  overrides: Record<string, unknown> = {}
) => ({
  id: 'twitch-sub-1',
  type: 'channel.chat.message',
  version: '1',
  status: 'enabled',
  condition: { broadcaster_user_id: 'broadcaster-1', user_id: 'bot-1' },
  transport: {
    method: 'webhook',
    callback: 'https://giveaway.test/api/twitch/webhooks'
  },
  created_at: '2026-01-01T00:00:00.000Z',
  ...overrides
});

export const chatMessageEvent = (overrides: Record<string, unknown> = {}) => ({
  broadcaster_user_id: 'broadcaster-1',
  broadcaster_user_login: 'streamer',
  broadcaster_user_name: 'Streamer',
  chatter_user_id: 'chatter-1',
  chatter_user_login: 'viewer',
  chatter_user_name: 'Viewer',
  message_id: 'message-1',
  message: { text: '!enter', fragments: [] },
  ...overrides
});
