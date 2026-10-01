import { describe, it, expect } from 'vitest';
import {
  COVERAGE_TARGET,
  MAXIMUM_REPOST_CALLS,
  MINIMUM_REPOST_CALLS,
  USERS_PER_REQUEST,
  X_PICKER_LIKES_KEY,
  X_PICKER_QUOTES_KEY,
  X_PICKER_REPLIES_KEY,
  X_PICKER_RETWEETS_KEY
} from '../constants';

describe('repost scraping limits', () => {
  it('requires at least 3 retweeter API calls', () => {
    expect(MINIMUM_REPOST_CALLS).toBe(3);
  });

  it('allows at most 10 retweeter API calls', () => {
    expect(MAXIMUM_REPOST_CALLS).toBe(10);
  });

  it('keeps the minimum below the maximum', () => {
    expect(MINIMUM_REPOST_CALLS).toBeLessThan(MAXIMUM_REPOST_CALLS);
  });

  it('targets 30% coverage of retweeters', () => {
    expect(COVERAGE_TARGET).toBe(0.3);
  });

  it('expects 20 users per request', () => {
    expect(USERS_PER_REQUEST).toBe(20);
  });
});

describe('picker storage keys', () => {
  it('defines a distinct key per engagement type', () => {
    expect({
      likes: X_PICKER_LIKES_KEY,
      retweets: X_PICKER_RETWEETS_KEY,
      replies: X_PICKER_REPLIES_KEY,
      quotes: X_PICKER_QUOTES_KEY
    }).toEqual({
      likes: 'x_picker_likes',
      retweets: 'x_picker_retweets',
      replies: 'x_picker_replies',
      quotes: 'x_picker_quotes'
    });
  });
});
