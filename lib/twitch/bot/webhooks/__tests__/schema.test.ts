import { describe, it, expect } from 'vitest';
import {
  parseGiveawayCommand,
  twitchChatMessageEventSchema,
  twitchEventSubNotificationSchema,
  twitchRevocationSchema,
  twitchSubscriptionVerificationSchema
} from '../schema';
import {
  chatMessageEvent,
  subscriptionPayload
} from '@/lib/twitch/__tests__/fixtures-twitch';

describe('twitchChatMessageEventSchema', () => {
  it('accepts an event with only the required fields', () => {
    const event = chatMessageEvent({ message: { text: '!enter' } });

    expect(twitchChatMessageEventSchema.parse(event)).toEqual(event);
  });

  it('accepts the optional chat metadata', () => {
    const event = chatMessageEvent({
      color: '#00FF00',
      badges: [{ set_id: 'vip' }],
      message_type: 'text',
      cheer: { bits: 10 },
      reply: { parent_message_id: 'm-0' },
      channel_points_custom_reward_id: 'reward-1'
    });

    expect(twitchChatMessageEventSchema.parse(event)).toEqual(event);
  });

  it('accepts a null channel points reward id', () => {
    const result = twitchChatMessageEventSchema.safeParse(
      chatMessageEvent({ channel_points_custom_reward_id: null })
    );

    expect(result.success).toBe(true);
  });

  it('strips fields that are not part of the schema', () => {
    const parsed = twitchChatMessageEventSchema.parse(
      chatMessageEvent({ source_broadcaster_user_id: 'source-1' })
    );

    expect(parsed).not.toHaveProperty('source_broadcaster_user_id');
  });

  it.each([
    'broadcaster_user_id',
    'broadcaster_user_login',
    'broadcaster_user_name',
    'chatter_user_id',
    'chatter_user_login',
    'chatter_user_name',
    'message_id',
    'message'
  ])('rejects an event without %s', (field) => {
    const result = twitchChatMessageEventSchema.safeParse(
      chatMessageEvent({ [field]: undefined })
    );

    expect(result.success).toBe(false);
  });

  it('rejects a message without text', () => {
    const result = twitchChatMessageEventSchema.safeParse(
      chatMessageEvent({ message: { fragments: [] } })
    );

    expect(result.success).toBe(false);
  });

  it('rejects a numeric color', () => {
    const result = twitchChatMessageEventSchema.safeParse(
      chatMessageEvent({ color: 123 })
    );

    expect(result.success).toBe(false);
  });
});

describe('twitchEventSubNotificationSchema', () => {
  it('accepts a notification with any event payload', () => {
    const body = { subscription: subscriptionPayload(), event: 'anything' };

    expect(twitchEventSubNotificationSchema.parse(body)).toEqual(body);
  });

  it('accepts a notification without an event', () => {
    const result = twitchEventSubNotificationSchema.safeParse({
      subscription: subscriptionPayload()
    });

    expect(result.success).toBe(true);
  });

  it('accepts a transport without a callback', () => {
    const result = twitchEventSubNotificationSchema.safeParse({
      subscription: subscriptionPayload({ transport: { method: 'websocket' } })
    });

    expect(result.success).toBe(true);
  });

  it('strips the subscription cost', () => {
    const parsed = twitchEventSubNotificationSchema.parse({
      subscription: subscriptionPayload({ cost: 0 }),
      event: {}
    });

    expect(parsed.subscription).not.toHaveProperty('cost');
  });

  it('rejects a condition with non string values', () => {
    const result = twitchEventSubNotificationSchema.safeParse({
      subscription: subscriptionPayload({
        condition: { broadcaster_user_id: 1 }
      }),
      event: {}
    });

    expect(result.success).toBe(false);
  });

  it.each(['id', 'type', 'version', 'status', 'transport', 'created_at'])(
    'rejects a subscription without %s',
    (field) => {
      const result = twitchEventSubNotificationSchema.safeParse({
        subscription: subscriptionPayload({ [field]: undefined }),
        event: {}
      });

      expect(result.success).toBe(false);
    }
  );
});

describe('twitchSubscriptionVerificationSchema', () => {
  it('accepts a verification challenge', () => {
    const body = {
      challenge: 'challenge-1',
      subscription: subscriptionPayload()
    };

    expect(twitchSubscriptionVerificationSchema.parse(body)).toEqual(body);
  });

  it('rejects a verification without a challenge', () => {
    const result = twitchSubscriptionVerificationSchema.safeParse({
      subscription: subscriptionPayload()
    });

    expect(result.success).toBe(false);
  });

  it('rejects a verification without a subscription', () => {
    const result = twitchSubscriptionVerificationSchema.safeParse({
      challenge: 'challenge-1'
    });

    expect(result.success).toBe(false);
  });
});

describe('twitchRevocationSchema', () => {
  it('accepts a revocation', () => {
    const body = {
      subscription: subscriptionPayload({ status: 'authorization_revoked' })
    };

    expect(twitchRevocationSchema.parse(body)).toEqual(body);
  });

  it('rejects a revocation without a subscription id', () => {
    const result = twitchRevocationSchema.safeParse({
      subscription: subscriptionPayload({ id: undefined })
    });

    expect(result.success).toBe(false);
  });
});

describe('parseGiveawayCommand', () => {
  describe('with the default trigger', () => {
    it('matches the bare command', () => {
      expect(parseGiveawayCommand('!giveaway')).toBe(true);
    });

    it('matches the command followed by more text', () => {
      expect(parseGiveawayCommand('!giveaway please')).toBe(true);
    });

    it('matches regardless of case', () => {
      expect(parseGiveawayCommand('!GiveAway')).toBe(true);
    });

    it('matches the command followed by a newline', () => {
      expect(parseGiveawayCommand('!giveaway\nthanks')).toBe(true);
    });

    it('does not match a longer word starting with the command', () => {
      expect(parseGiveawayCommand('!giveaways')).toBe(false);
    });

    it('does not match the command later in the message', () => {
      expect(parseGiveawayCommand('hi !giveaway')).toBe(false);
    });

    it('does not match leading whitespace', () => {
      expect(parseGiveawayCommand(' !giveaway')).toBe(false);
    });

    it('does not match an empty message', () => {
      expect(parseGiveawayCommand('')).toBe(false);
    });
  });

  describe('with a custom trigger', () => {
    it('matches the custom trigger', () => {
      expect(parseGiveawayCommand('!enter now', '!enter')).toBe(true);
    });

    it('does not match the default trigger', () => {
      expect(parseGiveawayCommand('!giveaway', '!enter')).toBe(false);
    });

    it('matches a trigger containing regex characters literally', () => {
      expect(parseGiveawayCommand('!win+', '!win+')).toBe(true);
    });

    it('does not interpret a plus in the trigger as a quantifier', () => {
      expect(parseGiveawayCommand('!winn', '!win+')).toBe(false);
    });

    it('does not treat a dot in the trigger as a wildcard', () => {
      expect(parseGiveawayCommand('!aXb', '!a.b')).toBe(false);
    });
  });
});
