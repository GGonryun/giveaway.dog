import 'server-only';

import { NotFoundError } from 'scrapebadger';
import type { ScrapeBadger, Tweet, User } from 'scrapebadger';
import {
  E2E_X_FIXTURES,
  toE2eXFixtureRetweeterUsername
} from '@giveaway/e2e-model/fakes';

type ScrapeBadgerInstance = InstanceType<typeof ScrapeBadger>;

export type ScrapeBadgerClient = {
  twitter: {
    tweets: Pick<
      ScrapeBadgerInstance['twitter']['tweets'],
      'getById' | 'getRetweeters'
    >;
    users: Pick<ScrapeBadgerInstance['twitter']['users'], 'getByUsername'>;
  };
};

const DAY_MS = 24 * 60 * 60 * 1000;

const PAGE_CURSOR_PREFIX = 'e2e-fixture-page-';

const RETWEETER_AGES_IN_DAYS = [1, 7, 30, 365, 3650];

const daysAgo = (now: Date, days: number) =>
  new Date(now.getTime() - days * DAY_MS).toISOString();

const toUser = ({
  id,
  username,
  createdAt,
  withAvatar
}: {
  id: string;
  username: string;
  createdAt: string;
  withAvatar: boolean;
}): User => ({
  id,
  username,
  name: username,
  description: `The e2e fixture user ${username}`,
  profile_image_url: withAvatar
    ? `https://pbs.twimg.com/profile_images/e2e/${username}.jpg`
    : undefined,
  followers_count: 10,
  following_count: 10,
  tweet_count: 10,
  listed_count: 0,
  verified: false,
  created_at: createdAt,
  can_dm: false
});

const toAuthor = (now: Date) =>
  toUser({
    id: '9100000000000000000',
    username: E2E_X_FIXTURES.author,
    createdAt: daysAgo(now, 3650),
    withAvatar: true
  });

const toRetweeter = (now: Date, index: number) =>
  toUser({
    id: `91000000000000${String(index + 1).padStart(5, '0')}`,
    username: toE2eXFixtureRetweeterUsername(index),
    createdAt: daysAgo(
      now,
      RETWEETER_AGES_IN_DAYS[index % RETWEETER_AGES_IN_DAYS.length]
    ),
    withAvatar: index % 3 !== 0
  });

const toTweet = (now: Date, id: string, viewCount?: number): Tweet => ({
  id,
  text: `The e2e fixture tweet ${id}`,
  created_at: daysAgo(now, 1),
  user_id: toAuthor(now).id,
  username: E2E_X_FIXTURES.author,
  favorite_count: 12,
  retweet_count: E2E_X_FIXTURES.retweeters,
  reply_count: 3,
  quote_count: 1,
  view_count: viewCount,
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

const notFound = (resourceType: string, resourceId: string) =>
  new NotFoundError(
    `The e2e fixtures have no ${resourceType} ${resourceId}`,
    resourceType,
    resourceId
  );

const toPageIndex = (cursor?: string) => {
  if (!cursor) return 0;
  if (!cursor.startsWith(PAGE_CURSOR_PREFIX)) throw notFound('cursor', cursor);
  return Number(cursor.slice(PAGE_CURSOR_PREFIX.length));
};

export const createScrapeBadgerFixtureClient = (
  now = () => new Date()
): ScrapeBadgerClient => ({
  twitter: {
    tweets: {
      getById: async (tweetId: string): Promise<Tweet> => {
        if (tweetId === E2E_X_FIXTURES.tweet) {
          return toTweet(now(), tweetId, 1234);
        }
        if (tweetId === E2E_X_FIXTURES.tweetWithoutViews) {
          return toTweet(now(), tweetId);
        }
        throw notFound('tweet', tweetId);
      },
      getRetweeters: async (tweetId: string, options?: { cursor?: string }) => {
        if (
          tweetId !== E2E_X_FIXTURES.tweet &&
          tweetId !== E2E_X_FIXTURES.tweetWithoutViews
        ) {
          throw notFound('tweet', tweetId);
        }
        const page = toPageIndex(options?.cursor);
        const size = E2E_X_FIXTURES.retweetersPerPage;
        const start = page * size;
        const end = Math.min(start + size, E2E_X_FIXTURES.retweeters);
        const data = Array.from({ length: Math.max(end - start, 0) }, (_, i) =>
          toRetweeter(now(), start + i)
        );
        const hasMore = end < E2E_X_FIXTURES.retweeters;
        return {
          data,
          hasMore,
          nextCursor: hasMore ? `${PAGE_CURSOR_PREFIX}${page + 1}` : undefined
        };
      }
    },
    users: {
      getByUsername: async (username: string): Promise<User> => {
        const at = now();
        if (username === E2E_X_FIXTURES.author) return toAuthor(at);
        for (let index = 0; index < E2E_X_FIXTURES.retweeters; index++) {
          if (username === toE2eXFixtureRetweeterUsername(index)) {
            return toRetweeter(at, index);
          }
        }
        throw notFound('user', username);
      }
    }
  }
});
