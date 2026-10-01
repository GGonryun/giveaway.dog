import { describe, it, expect, vi, afterEach } from 'vitest';
import { twitterUserSchema } from '@/lib/integrations/schemas/api';
import {
  extractTweetId,
  toTwitterPickerUsers,
  toTwitterPost,
  toTwitterUserSchema
} from '../utils';

type ScrapeBadgerUser = Parameters<typeof toTwitterUserSchema>[0];
type ScrapeBadgerTweet = Parameters<typeof toTwitterPost>[0]['tweet'];

const NOW = new Date('2026-05-05T05:05:05.000Z');

const buildUser = (
  overrides: Record<string, unknown> = {}
): ScrapeBadgerUser => ({
  id: '42',
  name: 'Alice',
  username: 'alice',
  created_at: '2020-01-02T03:04:05.000Z',
  description: 'Dog lover',
  location: 'Berlin',
  url: 'https://alice.example',
  profile_image_url: 'https://img.example/alice.png',
  profile_banner_url: 'https://img.example/profile-banner.png',
  banner_image_url: 'https://img.example/banner.png',
  protected: true,
  verified: true,
  verified_type: 'blue',
  can_dm: true,
  followers_count: 100,
  following_count: 50,
  tweet_count: 1000,
  ...overrides
});

const buildTweet = (
  overrides: Record<string, unknown> = {}
): ScrapeBadgerTweet => ({
  id: 'tweet-1',
  text: 'Giveaway time!',
  created_at: '2026-04-01T12:00:00.000Z',
  user_id: '42',
  username: 'alice',
  user_name: 'Alice Display',
  favorite_count: 10,
  retweet_count: 5,
  reply_count: 3,
  view_count: 999,
  quote_count: 1,
  ...overrides
});

afterEach(() => {
  vi.useRealTimers();
});

describe('toTwitterUserSchema', () => {
  it('maps a scrapebadger user to the twitter user shape', () => {
    expect(toTwitterUserSchema(buildUser())).toEqual({
      id: '42',
      name: 'Alice',
      username: 'alice',
      created_at: new Date('2020-01-02T03:04:05.000Z'),
      description: 'Dog lover',
      location: 'Berlin',
      profile_image_url: 'https://img.example/alice.png',
      profile_banner_url: 'https://img.example/banner.png',
      protected: false,
      verified: true,
      verified_type: 'blue',
      public_metrics: {
        followers_count: 100,
        following_count: 50,
        tweet_count: 1000
      }
    });
  });

  it('produces a value accepted by the twitter user schema', () => {
    const result = twitterUserSchema.safeParse(
      toTwitterUserSchema(buildUser())
    );

    expect(result.success).toBe(true);
  });

  it('uses the current time when the user has no creation date', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);

    const result = toTwitterUserSchema(buildUser({ created_at: undefined }));

    expect(result.created_at).toEqual(NOW);
  });

  it('uses the current time when the creation date is an empty string', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);

    const result = toTwitterUserSchema(buildUser({ created_at: '' }));

    expect(result.created_at).toEqual(NOW);
  });

  it('produces an invalid date for an unparseable creation date', () => {
    const result = toTwitterUserSchema(buildUser({ created_at: 'not a date' }));

    expect(Number.isNaN(result.created_at?.getTime())).toBe(true);
  });

  it('reads the banner from banner_image_url and ignores profile_banner_url', () => {
    const result = toTwitterUserSchema(
      buildUser({ banner_image_url: undefined })
    );

    expect(result.profile_banner_url).toBeUndefined();
  });

  it('always reports the account as not protected', () => {
    const result = toTwitterUserSchema(buildUser({ protected: true }));

    expect(result.protected).toBe(false);
  });

  it('passes through missing optional fields as undefined', () => {
    const result = toTwitterUserSchema({
      id: '1',
      name: 'Bare',
      username: 'bare',
      created_at: '2020-01-01T00:00:00.000Z'
    } as ScrapeBadgerUser);

    expect(result).toEqual({
      id: '1',
      name: 'Bare',
      username: 'bare',
      created_at: new Date('2020-01-01T00:00:00.000Z'),
      description: undefined,
      location: undefined,
      profile_image_url: undefined,
      profile_banner_url: undefined,
      protected: false,
      verified: undefined,
      verified_type: undefined,
      public_metrics: {
        followers_count: undefined,
        following_count: undefined,
        tweet_count: undefined
      }
    });
  });
});

describe('toTwitterPickerUsers', () => {
  it('returns an empty list when there are no users', () => {
    expect(toTwitterPickerUsers({ pickerId: 'picker-1', users: [] })).toEqual(
      []
    );
  });

  it('maps each user to a picker user row', () => {
    const rows = toTwitterPickerUsers({
      pickerId: 'picker-1',
      users: [buildUser()]
    });

    expect(rows).toEqual([
      {
        pickerId: 'picker-1',
        userId: '42',
        username: 'alice',
        name: 'Alice',
        description: 'Dog lover',
        url: 'https://alice.example',
        location: 'Berlin',
        profileImageUrl: 'https://img.example/alice.png',
        bannerImageUrl: 'https://img.example/profile-banner.png',
        createdAt: new Date('2020-01-02T03:04:05.000Z'),
        canDm: true,
        followersCount: 100,
        followingCount: 50,
        tweetCount: 1000,
        verified: true
      }
    ]);
  });

  it('preserves the order of the users', () => {
    const rows = toTwitterPickerUsers({
      pickerId: 'picker-1',
      users: [
        buildUser({ id: '1', username: 'one' }),
        buildUser({ id: '2', username: 'two' }),
        buildUser({ id: '3', username: 'three' })
      ]
    });

    expect(rows.map((row) => row.userId)).toEqual(['1', '2', '3']);
  });

  it('uses the current time when a user has no creation date', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);

    const [row] = toTwitterPickerUsers({
      pickerId: 'picker-1',
      users: [buildUser({ created_at: undefined })]
    });

    expect(row.createdAt).toEqual(NOW);
  });

  it('passes through missing optional fields as undefined', () => {
    const [row] = toTwitterPickerUsers({
      pickerId: 'picker-1',
      users: [
        {
          id: '1',
          name: 'Bare',
          username: 'bare',
          created_at: '2020-01-01T00:00:00.000Z'
        } as ScrapeBadgerUser
      ]
    });

    expect(row).toEqual({
      pickerId: 'picker-1',
      userId: '1',
      username: 'bare',
      name: 'Bare',
      description: undefined,
      url: undefined,
      location: undefined,
      profileImageUrl: undefined,
      bannerImageUrl: undefined,
      createdAt: new Date('2020-01-01T00:00:00.000Z'),
      canDm: undefined,
      followersCount: undefined,
      followingCount: undefined,
      tweetCount: undefined,
      verified: undefined
    });
  });

  it('ignores banner_image_url for the banner column', () => {
    const [row] = toTwitterPickerUsers({
      pickerId: 'picker-1',
      users: [buildUser({ profile_banner_url: undefined })]
    });

    expect(row.bannerImageUrl).toBeUndefined();
  });
});

describe('toTwitterPost', () => {
  it('maps a tweet to a twitter post connected to the picker', () => {
    expect(
      toTwitterPost({ pickerId: 'picker-1', tweet: buildTweet() })
    ).toEqual({
      picker: { connect: { id: 'picker-1' } },
      tweetId: 'tweet-1',
      text: 'Giveaway time!',
      createdAt: new Date('2026-04-01T12:00:00.000Z'),
      userId: '42',
      username: 'alice',
      favoriteCount: 10,
      retweetCount: 5,
      replyCount: 3,
      viewCount: 999,
      quoteCount: 1
    });
  });

  it.each([undefined, null])(
    'falls back to user_name when username is %j',
    (username) => {
      const post = toTwitterPost({
        pickerId: 'picker-1',
        tweet: buildTweet({ username })
      });

      expect(post.username).toBe('Alice Display');
    }
  );

  it('keeps an empty username instead of falling back', () => {
    const post = toTwitterPost({
      pickerId: 'picker-1',
      tweet: buildTweet({ username: '' })
    });

    expect(post.username).toBe('');
  });

  it('converts numeric strings to numbers', () => {
    const post = toTwitterPost({
      pickerId: 'picker-1',
      tweet: buildTweet({
        favorite_count: '7',
        retweet_count: '8',
        reply_count: '9',
        view_count: '10',
        quote_count: '11'
      })
    });

    expect(post).toMatchObject({
      favoriteCount: 7,
      retweetCount: 8,
      replyCount: 9,
      viewCount: 10,
      quoteCount: 11
    });
  });

  it('produces NaN for a missing view count', () => {
    const post = toTwitterPost({
      pickerId: 'picker-1',
      tweet: buildTweet({ view_count: undefined })
    });

    expect(post.viewCount).toBeNaN();
  });

  it('produces zero for a null count', () => {
    const post = toTwitterPost({
      pickerId: 'picker-1',
      tweet: buildTweet({ quote_count: null })
    });

    expect(post.quoteCount).toBe(0);
  });

  it('uses the current time when the tweet has no creation date', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);

    const post = toTwitterPost({
      pickerId: 'picker-1',
      tweet: buildTweet({ created_at: undefined })
    });

    expect(post.createdAt).toEqual(NOW);
  });
});

describe('extractTweetId', () => {
  it.each([
    ['https://twitter.com/alice/status/1234567890', '1234567890'],
    ['https://mobile.twitter.com/alice/status/111', '111'],
    ['https://x.com/alice_99/status/222', '222'],
    ['https://x.com/alice/status/333?s=20&t=abc', '333'],
    ['https://x.com/alice/status/444/photo/1', '444'],
    ['twitter.com/alice/status/555', '555']
  ])('extracts the status id from %s', (url, expected) => {
    expect(extractTweetId(url)).toBe(expected);
  });

  it('returns the short code for t.co links', () => {
    expect(extractTweetId('https://t.co/AbC123xyz')).toBe('AbC123xyz');
  });

  it('prefers the twitter.com pattern over the t.co pattern', () => {
    expect(
      extractTweetId('https://twitter.com/alice/status/777?via=https://t.co/zz')
    ).toBe('777');
  });

  it.each([
    '',
    'https://example.com/alice/status/1',
    'https://x.com/alice',
    'https://x.com/i/web/status/123',
    'https://bsky.app/profile/alice/post/abc',
    'https://x.com/alice/status/abc',
    'https://twitter.com/alice/status/abc',
    'https://x.com/alice/likes/123'
  ])('returns null for %j', (url) => {
    expect(extractTweetId(url)).toBeNull();
  });

  it('matches look-alike hosts because the patterns are not anchored', () => {
    expect(extractTweetId('https://notx.com/alice/status/123')).toBe('123');
  });

  it('stops the t.co short code at the next path segment', () => {
    expect(extractTweetId('https://t.co/abc/def')).toBe('abc');
  });

  it('keeps only the leading digits of the status id', () => {
    expect(extractTweetId('https://x.com/alice/status/123abc')).toBe('123');
  });
});
