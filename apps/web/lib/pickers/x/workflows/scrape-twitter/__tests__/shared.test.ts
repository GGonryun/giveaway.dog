import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Tweet, User } from 'scrapebadger';
import { toTwitterPickerUsers, toTwitterPost } from '../shared';
import * as scrapebadgerUtils from '@giveaway/x-scraper/utils';

const NOW = new Date('2025-06-15T12:00:00.000Z');

const scrapedUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'x-1',
    username: 'doglover',
    name: 'Dog Lover',
    description: 'I love dogs',
    url: 'https://dogs.example',
    location: 'Dogtown',
    profile_image_url: 'https://img/p.png',
    profile_banner_url: 'https://img/b.png',
    created_at: '2020-01-01T00:00:00.000Z',
    can_dm: true,
    followers_count: 500,
    following_count: 300,
    tweet_count: 1000,
    verified: false,
    ...overrides
  }) as User;

const scrapedTweet = (overrides: Partial<Tweet> = {}): Tweet =>
  ({
    id: '1111',
    text: 'Retweet to win!',
    created_at: '2025-01-01T00:00:00.000Z',
    user_id: 'author-1',
    username: 'doglover',
    user_name: 'Dog Lover',
    favorite_count: 10,
    retweet_count: 100,
    reply_count: 5,
    view_count: 1000,
    quote_count: 2,
    ...overrides
  }) as Tweet;

describe('scrape-twitter shared mappers', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('re-exports the scrapebadger mappers', () => {
    expect(toTwitterPickerUsers).toBe(scrapebadgerUtils.toTwitterPickerUsers);
    expect(toTwitterPost).toBe(scrapebadgerUtils.toTwitterPost);
  });

  describe('toTwitterPickerUsers', () => {
    it('maps scraped users to picker user rows', () => {
      expect(
        toTwitterPickerUsers({ pickerId: 'picker-1', users: [scrapedUser()] })
      ).toEqual([
        {
          pickerId: 'picker-1',
          userId: 'x-1',
          username: 'doglover',
          name: 'Dog Lover',
          description: 'I love dogs',
          url: 'https://dogs.example',
          location: 'Dogtown',
          profileImageUrl: 'https://img/p.png',
          bannerImageUrl: 'https://img/b.png',
          createdAt: new Date('2020-01-01T00:00:00.000Z'),
          canDm: true,
          followersCount: 500,
          followingCount: 300,
          tweetCount: 1000,
          verified: false
        }
      ]);
    });

    it('uses the current time when the creation date is missing', () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(NOW);

      const [row] = toTwitterPickerUsers({
        pickerId: 'picker-1',
        users: [scrapedUser({ created_at: undefined })]
      });

      expect(row.createdAt).toEqual(NOW);
    });

    it('returns an empty list for no users', () => {
      expect(toTwitterPickerUsers({ pickerId: 'picker-1', users: [] })).toEqual(
        []
      );
    });
  });

  describe('toTwitterPost', () => {
    it('maps a scraped tweet to a post connected to the picker', () => {
      expect(
        toTwitterPost({ pickerId: 'picker-1', tweet: scrapedTweet() })
      ).toEqual({
        picker: { connect: { id: 'picker-1' } },
        tweetId: '1111',
        text: 'Retweet to win!',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        userId: 'author-1',
        username: 'doglover',
        favoriteCount: 10,
        retweetCount: 100,
        replyCount: 5,
        viewCount: 1000,
        quoteCount: 2
      });
    });

    it('falls back to the display name when the username is missing', () => {
      expect(
        toTwitterPost({
          pickerId: 'picker-1',
          tweet: scrapedTweet({ username: undefined })
        }).username
      ).toBe('Dog Lover');
    });

    it('produces NaN for a missing view count', () => {
      expect(
        toTwitterPost({
          pickerId: 'picker-1',
          tweet: scrapedTweet({ view_count: undefined })
        }).viewCount
      ).toBeNaN();
    });
  });
});
