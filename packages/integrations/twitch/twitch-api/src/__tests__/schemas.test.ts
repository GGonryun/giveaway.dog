import { describe, it, expect } from 'vitest';
import { twitchStateSchema } from '../schemas';

describe('twitchStateSchema', () => {
  it('parses a state with features', () => {
    const state = {
      teamId: 'team-1',
      teamSlug: 'acme',
      features: ['CHAT_COMMANDS', 'CHANNEL_REDEMPTIONS']
    };

    expect(twitchStateSchema.parse(state)).toEqual(state);
  });

  it('defaults features to chat commands when omitted', () => {
    expect(
      twitchStateSchema.parse({ teamId: 'team-1', teamSlug: 'acme' })
    ).toEqual({
      teamId: 'team-1',
      teamSlug: 'acme',
      features: ['CHAT_COMMANDS']
    });
  });

  it('keeps an explicitly empty feature list', () => {
    expect(
      twitchStateSchema.parse({
        teamId: 'team-1',
        teamSlug: 'acme',
        features: []
      }).features
    ).toEqual([]);
  });

  it.each([
    'USER_PROFILE',
    'MODERATION_READ',
    'CHAT_COMMANDS',
    'CHANNEL_REDEMPTIONS'
  ])('accepts the %s feature', (feature) => {
    const result = twitchStateSchema.safeParse({
      teamId: 'team-1',
      teamSlug: 'acme',
      features: [feature]
    });

    expect(result.success).toBe(true);
  });

  it('rejects an unknown feature', () => {
    const result = twitchStateSchema.safeParse({
      teamId: 'team-1',
      teamSlug: 'acme',
      features: ['POST_TWEETS']
    });

    expect(result.success).toBe(false);
  });

  it('rejects a state without a team id', () => {
    const result = twitchStateSchema.safeParse({ teamSlug: 'acme' });

    expect(result.success).toBe(false);
  });

  it('rejects a state without a team slug', () => {
    const result = twitchStateSchema.safeParse({ teamId: 'team-1' });

    expect(result.success).toBe(false);
  });

  it('strips unknown keys', () => {
    const parsed = twitchStateSchema.parse({
      teamId: 'team-1',
      teamSlug: 'acme',
      userId: 'user-1'
    });

    expect(parsed).not.toHaveProperty('userId');
  });
});
