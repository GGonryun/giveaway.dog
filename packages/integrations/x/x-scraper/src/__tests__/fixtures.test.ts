import { describe, expect, it } from 'vitest';
import type { User } from 'scrapebadger';
import {
  E2E_X_FIXTURES,
  toE2eXFixtureRetweeterUsername
} from '@giveaway/e2e-model/fakes';
import { createScrapeBadgerFixtureClient } from '../fixtures';

const NOW = new Date('2026-03-01T12:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

const client = createScrapeBadgerFixtureClient(() => NOW);

const ageInDays = (createdAt: string | undefined) =>
  (NOW.getTime() - new Date(createdAt!).getTime()) / DAY_MS;

const ISO = (days: number) =>
  new Date(NOW.getTime() - days * DAY_MS).toISOString();

describe('createScrapeBadgerFixtureClient', () => {
  describe('the fixture records', () => {
    it('gives the tweet every field of the SDK tweet', async () => {
      await expect(
        client.twitter.tweets.getById(E2E_X_FIXTURES.tweet)
      ).resolves.toStrictEqual({
        id: E2E_X_FIXTURES.tweet,
        text: `The e2e fixture tweet ${E2E_X_FIXTURES.tweet}`,
        created_at: ISO(1),
        user_id: '9100000000000000000',
        username: E2E_X_FIXTURES.author,
        favorite_count: 12,
        retweet_count: E2E_X_FIXTURES.retweeters,
        reply_count: 3,
        quote_count: 1,
        view_count: 1234,
        favorited: false,
        retweeted: false,
        bookmarked: false,
        is_quote_status: false,
        is_retweet: false,
        media: [],
        urls: [],
        hashtags: [],
        user_mentions: []
      });
    });

    it('gives the author an avatar and an account of ten years', async () => {
      await expect(
        client.twitter.users.getByUsername(E2E_X_FIXTURES.author)
      ).resolves.toStrictEqual({
        id: '9100000000000000000',
        username: E2E_X_FIXTURES.author,
        name: E2E_X_FIXTURES.author,
        description: `The e2e fixture user ${E2E_X_FIXTURES.author}`,
        profile_image_url: `https://pbs.twimg.com/profile_images/e2e/${E2E_X_FIXTURES.author}.jpg`,
        followers_count: 10,
        following_count: 10,
        tweet_count: 10,
        listed_count: 0,
        verified: false,
        created_at: ISO(3650),
        can_dm: false
      });
    });

    it('numbers the retweeters and gives every third one no avatar', async () => {
      const page = await client.twitter.tweets.getRetweeters(
        E2E_X_FIXTURES.tweet
      );

      expect(page.data.slice(0, 4).map((user: User) => user.id)).toEqual([
        '9100000000000000001',
        '9100000000000000002',
        '9100000000000000003',
        '9100000000000000004'
      ]);
      expect(
        page.data.slice(0, 4).map((user: User) => !!user.profile_image_url)
      ).toEqual([false, true, true, false]);
      expect(page.data[0]).toStrictEqual({
        id: '9100000000000000001',
        username: 'e2e_fixture_rt0',
        name: 'e2e_fixture_rt0',
        description: 'The e2e fixture user e2e_fixture_rt0',
        profile_image_url: undefined,
        followers_count: 10,
        following_count: 10,
        tweet_count: 10,
        listed_count: 0,
        verified: false,
        created_at: ISO(1),
        can_dm: false
      });
    });

    it.each([
      ['tweet', () => client.twitter.tweets.getById('1')],
      ['tweet', () => client.twitter.tweets.getRetweeters('1')],
      ['user', () => client.twitter.users.getByUsername('nobody')]
    ])('names the missing %s in the error', async (type, call) => {
      await expect(call()).rejects.toThrow(
        new RegExp(`^The e2e fixtures have no ${type} (1|nobody)$`)
      );
    });

    it('names the cursor that it did not give', async () => {
      await expect(
        client.twitter.tweets.getRetweeters(E2E_X_FIXTURES.tweet, {
          cursor: 'real'
        })
      ).rejects.toThrow('The e2e fixtures have no cursor real');
    });

    it('returns the retweeters of the tweet without views', async () => {
      const page = await client.twitter.tweets.getRetweeters(
        E2E_X_FIXTURES.tweetWithoutViews
      );

      expect(page.data).toHaveLength(E2E_X_FIXTURES.retweetersPerPage);
    });

    it('knows no retweeter after the last one', async () => {
      await expect(
        client.twitter.users.getByUsername(
          toE2eXFixtureRetweeterUsername(E2E_X_FIXTURES.retweeters)
        )
      ).rejects.toMatchObject({ name: 'NotFoundError' });
    });
  });

  describe('tweets.getById', () => {
    it('returns the fixture tweet with a view count', async () => {
      const tweet = await client.twitter.tweets.getById(E2E_X_FIXTURES.tweet);

      expect(tweet).toMatchObject({
        id: E2E_X_FIXTURES.tweet,
        username: E2E_X_FIXTURES.author,
        retweet_count: E2E_X_FIXTURES.retweeters,
        view_count: 1234,
        media: []
      });
    });

    it('returns the fixture tweet without a view count', async () => {
      const tweet = await client.twitter.tweets.getById(
        E2E_X_FIXTURES.tweetWithoutViews
      );

      expect(tweet.id).toBe(E2E_X_FIXTURES.tweetWithoutViews);
      expect(tweet.view_count).toBeUndefined();
    });

    it.each([E2E_X_FIXTURES.tweetNotFound, '1234567890'])(
      'throws the SDK NotFoundError for tweet %s',
      async (tweetId) => {
        await expect(
          client.twitter.tweets.getById(tweetId)
        ).rejects.toMatchObject({
          name: 'NotFoundError',
          resourceType: 'tweet',
          resourceId: tweetId
        });
      }
    );
  });

  describe('tweets.getRetweeters', () => {
    it('returns every retweeter once, in pages with a next cursor', async () => {
      const pages: Awaited<
        ReturnType<typeof client.twitter.tweets.getRetweeters>
      >[] = [];
      let cursor: string | undefined;
      do {
        const page = await client.twitter.tweets.getRetweeters(
          E2E_X_FIXTURES.tweet,
          { cursor }
        );
        pages.push(page);
        cursor = page.nextCursor;
      } while (cursor);

      expect(pages.map((page) => page.data.length)).toEqual([20, 20, 5]);
      expect(pages.map((page) => page.hasMore)).toEqual([true, true, false]);
      const usernames = pages.flatMap((page) =>
        page.data.map((user: User) => user.username)
      );
      expect(new Set(usernames).size).toBe(E2E_X_FIXTURES.retweeters);
      expect(usernames[0]).toBe(toE2eXFixtureRetweeterUsername(0));
    });

    it('gives some retweeters no avatar', async () => {
      const page = await client.twitter.tweets.getRetweeters(
        E2E_X_FIXTURES.tweet
      );

      expect(page.data[0].profile_image_url).toBeUndefined();
      expect(page.data[1].profile_image_url).toMatch(/^https:\/\//);
    });

    it('dates the accounts relative to now', async () => {
      const page = await client.twitter.tweets.getRetweeters(
        E2E_X_FIXTURES.tweet
      );

      expect(
        page.data.slice(0, 5).map((user: User) => ageInDays(user.created_at))
      ).toEqual([1, 7, 30, 365, 3650]);
    });

    it('throws NotFoundError for a tweet that is not a fixture', async () => {
      await expect(
        client.twitter.tweets.getRetweeters(E2E_X_FIXTURES.tweetNotFound)
      ).rejects.toMatchObject({ name: 'NotFoundError' });
    });

    it('throws NotFoundError for a cursor that it did not give', async () => {
      await expect(
        client.twitter.tweets.getRetweeters(E2E_X_FIXTURES.tweet, {
          cursor: 'real-cursor'
        })
      ).rejects.toMatchObject({ name: 'NotFoundError' });
    });
  });

  describe('users.getByUsername', () => {
    it('returns the author', async () => {
      await expect(
        client.twitter.users.getByUsername(E2E_X_FIXTURES.author)
      ).resolves.toMatchObject({ username: E2E_X_FIXTURES.author });
    });

    it('returns a retweeter as the retweeters list gives it', async () => {
      const username = toE2eXFixtureRetweeterUsername(21);
      const page = await client.twitter.tweets.getRetweeters(
        E2E_X_FIXTURES.tweet,
        { cursor: 'e2e-fixture-page-1' }
      );

      await expect(
        client.twitter.users.getByUsername(username)
      ).resolves.toEqual(page.data[1]);
    });

    it('throws NotFoundError for any other user', async () => {
      await expect(
        client.twitter.users.getByUsername('elonmusk')
      ).rejects.toMatchObject({
        name: 'NotFoundError',
        resourceId: 'elonmusk'
      });
    });
  });
});
