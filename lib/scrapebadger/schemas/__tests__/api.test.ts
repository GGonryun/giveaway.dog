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

  it.each([
    ['id', 1],
    ['username', 1],
    ['name', 1],
    ['created_at', 1],
    ['followers_count', '1'],
    ['following_count', '1'],
    ['tweet_count', '1'],
    ['description', 1],
    ['location', 1],
    ['profile_image_url', 1],
    ['profile_banner_url', 1],
    ['verified', 'true']
  ])('rejects a %s of the wrong type', (key, value) => {
    expect(
      scrapeBadgerUserSchema.safeParse({ ...minimalUser, [key]: value }).success
    ).toBe(false);
  });

  it.each([
    'created_at',
    'followers_count',
    'following_count',
    'tweet_count',
    'description',
    'location',
    'profile_image_url',
    'profile_banner_url',
    'verified'
  ])('rejects null for %s', (key) => {
    expect(
      scrapeBadgerUserSchema.safeParse({ ...minimalUser, [key]: null }).success
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

  it.each([
    'followers_count',
    'following_count',
    'tweet_count',
    'listed_count',
    'favourites_count',
    'media_count',
    'verified',
    'is_blue_verified',
    'protected',
    'possibly_sensitive',
    'can_dm',
    'has_custom_timelines',
    'is_translator',
    'withheld_in_countries',
    'created_at',
    'created_at_datetime',
    'default_profile',
    'default_profile_image'
  ])('rejects null for %s', (key) => {
    expect(
      scrapeBadgerRetweeterSchema.safeParse({
        ...minimalRetweeter,
        [key]: null
      }).success
    ).toBe(false);
  });

  it.each([
    ['id', 1],
    ['username', 1],
    ['name', 1],
    ['description', 1],
    ['location', 1],
    ['url', 1],
    ['profile_image_url', 1],
    ['profile_banner_url', 1],
    ['followers_count', '1'],
    ['following_count', '1'],
    ['tweet_count', '1'],
    ['listed_count', '1'],
    ['favourites_count', '1'],
    ['media_count', '1'],
    ['verified', 'yes'],
    ['verified_type', 1],
    ['is_blue_verified', 'yes'],
    ['created_at', 1],
    ['created_at_datetime', 1],
    ['default_profile', 'yes'],
    ['default_profile_image', 'yes'],
    ['protected', 'yes'],
    ['possibly_sensitive', 'yes'],
    ['followed_by', 'yes'],
    ['following', 'yes'],
    ['follow_request_sent', 'yes'],
    ['blocking', 'yes'],
    ['blocked_by', 'yes'],
    ['muting', 'yes'],
    ['notifications', 'yes'],
    ['can_dm', 'yes'],
    ['has_custom_timelines', 'yes'],
    ['has_extended_profile', 'yes'],
    ['is_translator', 'yes'],
    ['is_translation_enabled', 'yes'],
    ['professional_type', 1],
    ['advertiser_account_type', 1],
    ['pinned_tweet_ids', '1'],
    ['withheld_in_countries', [1]]
  ])('rejects a %s of the wrong type', (key, value) => {
    expect(
      scrapeBadgerRetweeterSchema.safeParse({
        ...minimalRetweeter,
        [key]: value
      }).success
    ).toBe(false);
  });

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

  it.each(['id', 'username', 'name'])(
    'rejects a retweeter without %s',
    (key) => {
      const retweeter: Record<string, unknown> = { ...minimalRetweeter };
      delete retweeter[key];

      expect(scrapeBadgerRetweeterSchema.safeParse(retweeter).success).toBe(
        false
      );
    }
  );

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

  it('rejects a non-string cursor', () => {
    expect(
      scrapeBadgerTweetRetweetersSchema.safeParse({ data: [], next_cursor: 2 })
        .success
    ).toBe(false);
  });

  it('rejects page data that is not an array', () => {
    expect(
      scrapeBadgerTweetRetweetersSchema.safeParse({
        data: { id: '1', username: 'bob', name: 'Bob' }
      }).success
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

  it.each([
    ['id', 1],
    ['text', 1],
    ['created_at', 1],
    ['user_id', 1],
    ['username', 1],
    ['favorite_count', '1'],
    ['retweet_count', '1'],
    ['reply_count', '1'],
    ['view_count', '1'],
    ['quote_count', '1'],
    ['conversation_id', 1],
    ['in_reply_to_user_id', 1],
    ['is_quote_status', 'yes'],
    ['lang', 1],
    ['possibly_sensitive', 'yes'],
    ['media', 'x'],
    ['urls', 'x'],
    ['hashtags', 'x'],
    ['user_mentions', 'x']
  ])('rejects a %s of the wrong type', (key, value) => {
    expect(
      scrapeBadgerTweetDetailSchema.safeParse({ ...minimalTweet, [key]: value })
        .success
    ).toBe(false);
  });

  it.each([
    'favorite_count',
    'retweet_count',
    'reply_count',
    'quote_count',
    'conversation_id',
    'in_reply_to_user_id',
    'is_quote_status',
    'lang',
    'possibly_sensitive',
    'media',
    'urls',
    'hashtags',
    'user_mentions'
  ])('rejects null for %s', (key) => {
    expect(
      scrapeBadgerTweetDetailSchema.safeParse({ ...minimalTweet, [key]: null })
        .success
    ).toBe(false);
  });
});
