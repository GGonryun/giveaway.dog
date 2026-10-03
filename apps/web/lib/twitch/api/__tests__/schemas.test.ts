import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import {
  channelChatMessageEventSubSchema,
  eventSubConditionSchema,
  eventSubSubscriptionSchema,
  eventSubSubscriptionsListSchema,
  eventSubTransportSchema,
  toEventSubSubscriptionSchema,
  toEventSubSubscriptionSchemasListSchema
} from '../schemas';
import { ApplicationError } from '@giveaway/util-errors';
import {
  subscriptionList,
  twitchSubscription
} from '@/lib/twitch/__tests__/fixtures-twitch';

const textFragment = {
  type: 'text',
  text: 'hello ',
  cheermote: null,
  emote: null,
  mention: null
};

const emoteFragment = {
  type: 'emote',
  text: 'Kappa',
  cheermote: null,
  mention: null,
  emote: {
    id: '25',
    emote_set_id: '0',
    owner_id: 'twitch',
    format: ['static']
  }
};

const mentionFragment = {
  type: 'mention',
  text: '@viewer',
  emote: null,
  cheermote: null,
  mention: { user_id: 'u-1', user_login: 'viewer', user_name: 'Viewer' }
};

const cheermoteFragment = {
  type: 'cheermote',
  text: 'Cheer100',
  emote: null,
  mention: null,
  cheermote: { prefix: 'Cheer', bits: 100, tier: 1 }
};

const chatEventSub = (
  overrides: {
    subscription?: Record<string, unknown>;
    event?: Record<string, unknown>;
  } = {}
) => ({
  subscription: {
    id: 'sub-1',
    status: 'enabled',
    type: 'channel.chat.message',
    version: '1',
    condition: { broadcaster_user_id: 'broadcaster-1', user_id: 'bot-1' },
    transport: {
      method: 'webhook',
      callback: 'https://giveaway.test/api/twitch/webhooks'
    },
    created_at: '2026-01-01T00:00:00.000Z',
    cost: 0,
    ...overrides.subscription
  },
  event: {
    broadcaster_user_id: 'broadcaster-1',
    broadcaster_user_login: 'streamer',
    broadcaster_user_name: 'Streamer',
    chatter_user_id: 'chatter-1',
    chatter_user_login: 'viewer',
    chatter_user_name: 'Viewer',
    message_id: 'message-1',
    message: { text: 'hello Kappa', fragments: [textFragment, emoteFragment] },
    color: '#FF0000',
    badges: [{ set_id: 'subscriber', id: '12', info: '16' }],
    message_type: 'text',
    ...overrides.event
  }
});

describe('channelChatMessageEventSubSchema', () => {
  it('parses a valid chat message notification', () => {
    const result = channelChatMessageEventSubSchema.safeParse(chatEventSub());

    expect(result.success).toBe(true);
  });

  it('coerces the subscription created_at into a Date', () => {
    const parsed = channelChatMessageEventSubSchema.parse(chatEventSub());

    expect(parsed.subscription.created_at).toEqual(
      new Date('2026-01-01T00:00:00.000Z')
    );
  });

  it.each([
    ['text', textFragment],
    ['emote', emoteFragment],
    ['mention', mentionFragment],
    ['cheermote', cheermoteFragment]
  ])('accepts a %s fragment', (_type, fragment) => {
    const result = channelChatMessageEventSubSchema.safeParse(
      chatEventSub({
        event: { message: { text: 'x', fragments: [fragment] } }
      })
    );

    expect(result.success).toBe(true);
  });

  it('accepts a cheermote without a tier', () => {
    const result = channelChatMessageEventSubSchema.safeParse(
      chatEventSub({
        event: {
          message: {
            text: 'Cheer1',
            fragments: [
              {
                ...cheermoteFragment,
                cheermote: { prefix: 'Cheer', bits: 1 }
              }
            ]
          }
        }
      })
    );

    expect(result.success).toBe(true);
  });

  it('rejects an unknown fragment type', () => {
    const result = channelChatMessageEventSubSchema.safeParse(
      chatEventSub({
        event: {
          message: {
            text: 'x',
            fragments: [{ ...textFragment, type: 'sticker' }]
          }
        }
      })
    );

    expect(result.success).toBe(false);
  });

  it('rejects a text fragment that carries an emote', () => {
    const result = channelChatMessageEventSubSchema.safeParse(
      chatEventSub({
        event: {
          message: {
            text: 'x',
            fragments: [{ ...textFragment, emote: emoteFragment.emote }]
          }
        }
      })
    );

    expect(result.success).toBe(false);
  });

  it.each([
    [
      'a text fragment with a cheermote',
      { ...textFragment, cheermote: cheermoteFragment.cheermote }
    ],
    [
      'a text fragment with a mention',
      { ...textFragment, mention: mentionFragment.mention }
    ],
    [
      'an emote fragment with a cheermote',
      { ...emoteFragment, cheermote: cheermoteFragment.cheermote }
    ],
    [
      'an emote fragment with a mention',
      { ...emoteFragment, mention: mentionFragment.mention }
    ],
    [
      'a mention fragment with an emote',
      { ...mentionFragment, emote: emoteFragment.emote }
    ],
    [
      'a mention fragment with a cheermote',
      { ...mentionFragment, cheermote: cheermoteFragment.cheermote }
    ],
    [
      'a cheermote fragment with an emote',
      { ...cheermoteFragment, emote: emoteFragment.emote }
    ],
    [
      'a cheermote fragment with a mention',
      { ...cheermoteFragment, mention: mentionFragment.mention }
    ],
    [
      'an emote whose format is not a list',
      { ...emoteFragment, emote: { ...emoteFragment.emote, format: 'static' } }
    ],
    [
      'an emote without an owner',
      {
        ...emoteFragment,
        emote: { id: '25', emote_set_id: '0', format: ['static'] }
      }
    ],
    [
      'a cheermote whose bits are not a number',
      {
        ...cheermoteFragment,
        cheermote: { prefix: 'Cheer', bits: '100', tier: 1 }
      }
    ],
    [
      'a mention without a user id',
      {
        ...mentionFragment,
        mention: { user_login: 'viewer', user_name: 'Viewer' }
      }
    ]
  ])('rejects %s', (_label, fragment) => {
    const result = channelChatMessageEventSubSchema.safeParse(
      chatEventSub({
        event: { message: { text: 'x', fragments: [fragment] } }
      })
    );

    expect(result.success).toBe(false);
  });

  it.each([
    'broadcaster_user_id',
    'broadcaster_user_login',
    'broadcaster_user_name',
    'chatter_user_id',
    'chatter_user_login',
    'chatter_user_name',
    'message_id',
    'message',
    'badges'
  ])('rejects an event without %s', (field) => {
    const result = channelChatMessageEventSubSchema.safeParse(
      chatEventSub({ event: { [field]: undefined } })
    );

    expect(result.success).toBe(false);
  });

  it.each([
    ['status', { status: 'authorization_revoked' }],
    ['type', { type: 'channel.follow' }],
    ['version', { version: '2' }],
    [
      'transport method',
      {
        transport: {
          method: 'websocket',
          callback: 'https://giveaway.test/api/twitch/webhooks'
        }
      }
    ],
    ['transport callback', { transport: { method: 'webhook', callback: 'x' } }],
    ['condition', { condition: { broadcaster_user_id: 'broadcaster-1' } }],
    ['created_at', { created_at: 'not a date' }],
    ['cost', { cost: '0' }]
  ])('rejects an invalid subscription %s', (_field, subscription) => {
    const result = channelChatMessageEventSubSchema.safeParse(
      chatEventSub({ subscription })
    );

    expect(result.success).toBe(false);
  });

  it('rejects a non text message type', () => {
    const result = channelChatMessageEventSubSchema.safeParse(
      chatEventSub({ event: { message_type: 'channel_points_highlighted' } })
    );

    expect(result.success).toBe(false);
  });

  it('rejects a badge without info', () => {
    const result = channelChatMessageEventSubSchema.safeParse(
      chatEventSub({ event: { badges: [{ set_id: 'vip', id: '1' }] } })
    );

    expect(result.success).toBe(false);
  });

  it('rejects an event without a color', () => {
    const result = channelChatMessageEventSubSchema.safeParse(
      chatEventSub({ event: { color: undefined } })
    );

    expect(result.success).toBe(false);
  });

  it('keeps the unknown typed source fields as given', () => {
    const parsed = channelChatMessageEventSubSchema.parse(
      chatEventSub({
        event: {
          source_broadcaster_user_id: 'source-1',
          cheer: { bits: 5 },
          reply: null
        }
      })
    );

    expect(parsed.event).toMatchObject({
      source_broadcaster_user_id: 'source-1',
      cheer: { bits: 5 },
      reply: null
    });
  });

  it('strips keys that are not part of the event schema', () => {
    const parsed = channelChatMessageEventSubSchema.parse(
      chatEventSub({ event: { extra: 'value' } })
    );

    expect(parsed.event).not.toHaveProperty('extra');
  });
});

describe('eventSubTransportSchema', () => {
  it('accepts a transport without a callback', () => {
    expect(eventSubTransportSchema.parse({ method: 'websocket' })).toEqual({
      method: 'websocket'
    });
  });

  it('keeps unknown transport keys', () => {
    expect(
      eventSubTransportSchema.parse({
        method: 'websocket',
        session_id: 'session-1'
      })
    ).toEqual({ method: 'websocket', session_id: 'session-1' });
  });

  it('rejects a callback that is not a url', () => {
    const result = eventSubTransportSchema.safeParse({
      method: 'webhook',
      callback: 'not-a-url'
    });

    expect(result.success).toBe(false);
  });

  it('rejects a transport without a method', () => {
    const result = eventSubTransportSchema.safeParse({
      callback: 'https://giveaway.test'
    });

    expect(result.success).toBe(false);
  });
});

describe('eventSubConditionSchema', () => {
  it('accepts a condition without a user id', () => {
    expect(
      eventSubConditionSchema.parse({ broadcaster_user_id: 'broadcaster-1' })
    ).toEqual({ broadcaster_user_id: 'broadcaster-1' });
  });

  it('keeps unknown condition keys', () => {
    expect(
      eventSubConditionSchema.parse({
        broadcaster_user_id: 'broadcaster-1',
        reward_id: 'reward-1'
      })
    ).toEqual({ broadcaster_user_id: 'broadcaster-1', reward_id: 'reward-1' });
  });

  it('rejects a condition without a broadcaster id', () => {
    const result = eventSubConditionSchema.safeParse({ user_id: 'bot-1' });

    expect(result.success).toBe(false);
  });
});

describe('eventSubSubscriptionSchema', () => {
  it('keeps created_at as a string', () => {
    const parsed = eventSubSubscriptionSchema.parse(twitchSubscription());

    expect(parsed.created_at).toBe('2026-01-01T00:00:00.000Z');
  });

  it('accepts any status and type string', () => {
    const result = eventSubSubscriptionSchema.safeParse(
      twitchSubscription({ status: 'revoked', type: 'channel.follow' })
    );

    expect(result.success).toBe(true);
  });

  it('keeps unknown subscription keys', () => {
    const parsed = eventSubSubscriptionSchema.parse(
      twitchSubscription({ extra: 'value' })
    );

    expect(parsed).toHaveProperty('extra', 'value');
  });

  it('rejects a subscription without a cost', () => {
    const result = eventSubSubscriptionSchema.safeParse(
      twitchSubscription({ cost: undefined })
    );

    expect(result.success).toBe(false);
  });

  it.each([
    'id',
    'status',
    'type',
    'version',
    'condition',
    'created_at',
    'transport'
  ])('rejects a subscription without %s', (field) => {
    const result = eventSubSubscriptionSchema.safeParse(
      twitchSubscription({ [field]: undefined })
    );

    expect(result.success).toBe(false);
  });

  it('rejects a numeric version', () => {
    const result = eventSubSubscriptionSchema.safeParse(
      twitchSubscription({ version: 1 })
    );

    expect(result.success).toBe(false);
  });
});

describe('eventSubSubscriptionsListSchema', () => {
  it('accepts a list without pagination', () => {
    const list = {
      total: 1,
      data: [twitchSubscription()],
      max_total_cost: 10000,
      total_cost: 0
    };

    expect(eventSubSubscriptionsListSchema.safeParse(list).success).toBe(true);
  });

  it('accepts a pagination cursor', () => {
    const result = eventSubSubscriptionsListSchema.safeParse({
      ...subscriptionList([]),
      pagination: { cursor: 'abc' }
    });

    expect(result.success).toBe(true);
  });

  it('rejects a pagination value that is not a string', () => {
    const result = eventSubSubscriptionsListSchema.safeParse({
      ...subscriptionList([]),
      pagination: { cursor: 1 }
    });

    expect(result.success).toBe(false);
  });

  it('keeps unknown list keys', () => {
    const parsed = eventSubSubscriptionsListSchema.parse({
      ...subscriptionList([]),
      extra: 'value'
    });

    expect(parsed).toHaveProperty('extra', 'value');
  });

  it.each(['total', 'data', 'max_total_cost', 'total_cost'])(
    'rejects a list without %s',
    (field) => {
      const result = eventSubSubscriptionsListSchema.safeParse({
        ...subscriptionList([]),
        [field]: undefined
      });

      expect(result.success).toBe(false);
    }
  );

  it('rejects a list containing an invalid subscription', () => {
    const result = eventSubSubscriptionsListSchema.safeParse(
      subscriptionList([{ id: 'only-an-id' }])
    );

    expect(result.success).toBe(false);
  });
});

describe('toEventSubSubscriptionSchemasListSchema', () => {
  it('returns the parsed list for valid data', () => {
    const list = subscriptionList([twitchSubscription()]);

    expect(toEventSubSubscriptionSchemasListSchema(list)).toEqual(list);
  });

  it('throws a VALIDATION_ERROR application error for invalid data', () => {
    let error: unknown;
    try {
      toEventSubSubscriptionSchemasListSchema({ data: null });
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(ApplicationError);
    expect(error).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Failed to validate EventSub subscriptions list schema'
    });
    expect((error as ApplicationError).cause).toBeInstanceOf(ZodError);
  });
});

describe('toEventSubSubscriptionSchema', () => {
  it('returns the parsed subscription for valid data', () => {
    const subscription = twitchSubscription();

    expect(toEventSubSubscriptionSchema(subscription)).toEqual(subscription);
  });

  it('throws a VALIDATION_ERROR application error for invalid data', () => {
    let error: unknown;
    try {
      toEventSubSubscriptionSchema({ id: 'sub-1' });
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(ApplicationError);
    expect(error).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Failed to validate EventSub subscription schema'
    });
    expect((error as ApplicationError).cause).toBeInstanceOf(ZodError);
  });
});
