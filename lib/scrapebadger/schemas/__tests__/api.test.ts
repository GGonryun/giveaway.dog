import { describe, it, expect } from 'vitest';
import {
  scrapeBadgerRetweeterSchema,
  scrapeBadgerTweetDetailSchema,
  scrapeBadgerTweetRetweetersSchema,
  scrapeBadgerUserSchema
} from '../api';

describe('scrapeBadgerUserSchema', () => {
  const minimalUser = { id: '1', username: 'alice', name: 'Alice' };

  it('accepts a user with only the required fields', () => {
    expect(scrapeBadgerUserSchema.parse(minimalUser)).toEqual(minimalUser);
  });

  it('accepts a user with every optional field', () => {
    const user = {
      ...minimalUser,
      created_at: '2020-01-01',
      followers_count: 1,
      following_count: 2,
      tweet_count: 3,
      description: 'bio',
      location: 'Earth',
      profile_image_url: 'https://img/1',
      profile_banner_url: 'https://img/2',
      verified: false
    };

    expect(scrapeBadgerUserSchema.parse(user)).toEqual(user);
  });

  it('strips unknown keys', () => {
    expect(
      scrapeBadgerUserSchema.parse({ ...minimalUser, extra: 'value' })
    ).toEqual(minimalUser);
  });

  it.each(['id', 'username', 'name'])('rejects a user without %s', (key) => {
    const user: Record<string, unknown> = { ...minimalUser };
    delete user[key];

    expect(scrapeBadgerUserSchema.safeParse(user).success).toBe(false);
  });

  it('rejects a numeric id', () => {
    expect(
      scrapeBadgerUserSchema.safeParse({ ...minimalUser, id: 1 }).success
    ).toBe(false);
  });

  it('rejects null optional fields', () => {
    expect(
      scrapeBadgerUserSchema.safeParse({ ...minimalUser, description: null })
        .success
    ).toBe(false);
  });

  it('rejects string counts', () => {
    expect(
      scrapeBadgerUserSchema.safeParse({
        ...minimalUser,
        followers_count: '10'
      }).success
    ).toBe(false);
  });
});

describe('scrapeBadgerRetweeterSchema', () => {
  const minimalRetweeter = { id: '1', username: 'bob', name: 'Bob' };

  it('applies defaults for counts and flags', () => {
    expect(scrapeBadgerRetweeterSchema.parse(minimalRetweeter)).toEqual({
      ...minimalRetweeter,
      followers_count: 0,
      following_count: 0,
      tweet_count: 0,
      listed_count: 0,
      favourites_count: 0,
      media_count: 0,
      verified: false,
      is_blue_verified: false,
      protected: false,
      possibly_sensitive: false,
      can_dm: false,
      has_custom_timelines: false,
      is_translator: false,
      withheld_in_countries: []
    });
  });

  it('keeps provided values instead of defaults', () => {
    const parsed = scrapeBadgerRetweeterSchema.parse({
      ...minimalRetweeter,
      followers_count: 5,
      verified: true,
      can_dm: true,
      withheld_in_countries: ['DE']
    });

    expect(parsed).toMatchObject({
      followers_count: 5,
      verified: true,
      can_dm: true,
      withheld_in_countries: ['DE']
    });
  });

  it.each([
    'description',
    'location',
    'url',
    'profile_image_url',
    'profile_banner_url',
    'verified_type',
    'professional_type',
    'advertiser_account_type',
    'pinned_tweet_ids',
    'followed_by',
    'following',
    'follow_request_sent',
    'blocking',
    'blocked_by',
    'muting',
    'notifications',
    'has_extended_profile',
    'is_translation_enabled'
  ])('accepts null for %s', (key) => {
    const parsed = scrapeBadgerRetweeterSchema.parse({
      ...minimalRetweeter,
      [key]: null
    });

    expect(parsed[key as keyof typeof parsed]).toBeNull();
  });

  it.each(['followers_count', 'verified', 'can_dm', 'withheld_in_countries'])(
    'rejects null for %s',
    (key) => {
      expect(
        scrapeBadgerRetweeterSchema.safeParse({
          ...minimalRetweeter,
          [key]: null
        }).success
      ).toBe(false);
    }
  );

  it('accepts the optional date and profile flags', () => {
    const parsed = scrapeBadgerRetweeterSchema.parse({
      ...minimalRetweeter,
      created_at: 'Mon Jan 01 2020',
      created_at_datetime: '2020-01-01T00:00:00Z',
      default_profile: true,
      default_profile_image: false,
      pinned_tweet_ids: ['1', '2']
    });

    expect(parsed).toMatchObject({
      created_at: 'Mon Jan 01 2020',
      created_at_datetime: '2020-01-01T00:00:00Z',
      default_profile: true,
      default_profile_image: false,
      pinned_tweet_ids: ['1', '2']
    });
  });

  it('rejects a retweeter without a username', () => {
    expect(
      scrapeBadgerRetweeterSchema.safeParse({ id: '1', name: 'Bob' }).success
    ).toBe(false);
  });

  it('rejects non-string pinned tweet ids', () => {
    expect(
      scrapeBadgerRetweeterSchema.safeParse({
        ...minimalRetweeter,
        pinned_tweet_ids: [1]
      }).success
    ).toBe(false);
  });
});

describe('scrapeBadgerTweetRetweetersSchema', () => {
  it('parses each retweeter and applies their defaults', () => {
    const parsed = scrapeBadgerTweetRetweetersSchema.parse({
      data: [{ id: '1', username: 'bob', name: 'Bob' }],
      next_cursor: 'cursor-2'
    });

    expect(parsed.next_cursor).toBe('cursor-2');
    expect(parsed.data[0]).toMatchObject({ id: '1', followers_count: 0 });
  });

  it('accepts an empty page with a null cursor', () => {
    expect(
      scrapeBadgerTweetRetweetersSchema.parse({ data: [], next_cursor: null })
    ).toEqual({ data: [], next_cursor: null });
  });

  it('accepts a page without a cursor', () => {
    expect(scrapeBadgerTweetRetweetersSchema.parse({ data: [] })).toEqual({
      data: []
    });
  });

  it('rejects a page without data', () => {
    expect(
      scrapeBadgerTweetRetweetersSchema.safeParse({ next_cursor: 'x' }).success
    ).toBe(false);
  });

  it('rejects a page containing an invalid retweeter', () => {
    expect(
      scrapeBadgerTweetRetweetersSchema.safeParse({ data: [{ id: '1' }] })
        .success
    ).toBe(false);
  });
});

describe('scrapeBadgerTweetDetailSchema', () => {
  const minimalTweet = {
    id: 't-1',
    text: 'hello',
    created_at: '2026-01-01T00:00:00Z',
    user_id: 'u-1',
    username: 'alice'
  };

  it('applies count and quote defaults', () => {
    expect(scrapeBadgerTweetDetailSchema.parse(minimalTweet)).toEqual({
      ...minimalTweet,
      favorite_count: 0,
      retweet_count: 0,
      reply_count: 0,
      view_count: 0,
      quote_count: 0,
      is_quote_status: false
    });
  });

  it('accepts entity arrays of any shape', () => {
    const parsed = scrapeBadgerTweetDetailSchema.parse({
      ...minimalTweet,
      media: [{ type: 'photo' }, 'raw'],
      urls: [1],
      hashtags: [null],
      user_mentions: [{ id: 'u-2' }]
    });

    expect(parsed).toMatchObject({
      media: [{ type: 'photo' }, 'raw'],
      urls: [1],
      hashtags: [null],
      user_mentions: [{ id: 'u-2' }]
    });
  });

  it('keeps the optional metadata fields', () => {
    const parsed = scrapeBadgerTweetDetailSchema.parse({
      ...minimalTweet,
      conversation_id: 'c-1',
      in_reply_to_user_id: 'u-9',
      lang: 'en',
      possibly_sensitive: true,
      is_quote_status: true
    });

    expect(parsed).toMatchObject({
      conversation_id: 'c-1',
      in_reply_to_user_id: 'u-9',
      lang: 'en',
      possibly_sensitive: true,
      is_quote_status: true
    });
  });

  it.each(['id', 'text', 'created_at', 'user_id', 'username'])(
    'rejects a tweet without %s',
    (key) => {
      const tweet: Record<string, unknown> = { ...minimalTweet };
      delete tweet[key];

      expect(scrapeBadgerTweetDetailSchema.safeParse(tweet).success).toBe(
        false
      );
    }
  );

  it('rejects a null count', () => {
    expect(
      scrapeBadgerTweetDetailSchema.safeParse({
        ...minimalTweet,
        view_count: null
      }).success
    ).toBe(false);
  });

  it('rejects a non-array media field', () => {
    expect(
      scrapeBadgerTweetDetailSchema.safeParse({
        ...minimalTweet,
        media: 'photo'
      }).success
    ).toBe(false);
  });
});
