import { describe, it, expect } from 'vitest';
import {
  TWITCH_EVENTSUB_TYPES,
  botStatusSchema,
  twitchEventSubSubscriptionSchema,
  twitchIntegrationSettingsSchema
} from '../schemas';

const botStatus = {
  isModded: true,
  lastChecked: '2026-10-01T12:00:00.000Z',
  botUserId: 'bot-1',
  botUsername: 'giveawaydog'
};

const settings = {
  broadcasterId: 'broadcaster-1',
  broadcasterLogin: 'streamer',
  broadcasterDisplayName: 'Streamer',
  channelUrl: 'https://twitch.tv/streamer'
};

describe('TWITCH_EVENTSUB_TYPES', () => {
  it('lists only the chat message event', () => {
    expect(TWITCH_EVENTSUB_TYPES).toEqual(['channel.chat.message']);
  });
});

describe('twitchEventSubSubscriptionSchema', () => {
  it('accepts a chat message subscription', () => {
    const subscription = {
      id: 'sub-1',
      type: 'channel.chat.message',
      status: 'enabled'
    };

    expect(twitchEventSubSubscriptionSchema.parse(subscription)).toEqual(
      subscription
    );
  });

  it('rejects other event types', () => {
    const result = twitchEventSubSubscriptionSchema.safeParse({
      id: 'sub-1',
      type: 'channel.channel_points_custom_reward_redemption.add',
      status: 'enabled'
    });

    expect(result.success).toBe(false);
  });

  it('rejects a subscription without a status', () => {
    const result = twitchEventSubSubscriptionSchema.safeParse({
      id: 'sub-1',
      type: 'channel.chat.message'
    });

    expect(result.success).toBe(false);
  });
});

describe('botStatusSchema', () => {
  it('accepts a full bot status', () => {
    expect(botStatusSchema.parse(botStatus)).toEqual(botStatus);
  });

  it('accepts a bot status without lastChecked', () => {
    const withoutLastChecked = {
      isModded: false,
      botUserId: 'bot-1',
      botUsername: 'giveawaydog'
    };

    expect(botStatusSchema.parse(withoutLastChecked)).toEqual(
      withoutLastChecked
    );
  });

  it('rejects a lastChecked that is not an ISO datetime', () => {
    const result = botStatusSchema.safeParse({
      ...botStatus,
      lastChecked: 'yesterday'
    });

    expect(result.success).toBe(false);
  });

  it('rejects a lastChecked with a timezone offset', () => {
    const result = botStatusSchema.safeParse({
      ...botStatus,
      lastChecked: '2026-10-01T12:00:00+02:00'
    });

    expect(result.success).toBe(false);
  });

  it('rejects a non boolean isModded', () => {
    const result = botStatusSchema.safeParse({
      ...botStatus,
      isModded: 'yes'
    });

    expect(result.success).toBe(false);
  });
});

describe('twitchIntegrationSettingsSchema', () => {
  it('accepts settings without a bot status', () => {
    expect(twitchIntegrationSettingsSchema.parse(settings)).toEqual(settings);
  });

  it('accepts settings with a bot status', () => {
    const withBot = { ...settings, botStatus };

    expect(twitchIntegrationSettingsSchema.parse(withBot)).toEqual(withBot);
  });

  it('accepts a channel url that is not a url', () => {
    const result = twitchIntegrationSettingsSchema.safeParse({
      ...settings,
      channelUrl: 'streamer'
    });

    expect(result.success).toBe(true);
  });

  it.each([
    'broadcasterId',
    'broadcasterLogin',
    'broadcasterDisplayName',
    'channelUrl'
  ])('rejects settings without %s', (field) => {
    const result = twitchIntegrationSettingsSchema.safeParse({
      ...settings,
      [field]: undefined
    });

    expect(result.success).toBe(false);
  });

  it('rejects an invalid bot status', () => {
    const result = twitchIntegrationSettingsSchema.safeParse({
      ...settings,
      botStatus: { isModded: true }
    });

    expect(result.success).toBe(false);
  });
});
