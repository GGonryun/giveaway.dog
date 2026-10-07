import retweetersResponse from './fixtures-scrapebadger-retweeters.json';
import tweetResponse from './fixtures-scrapebadger-tweet.json';
import userResponse from './fixtures-scrapebadger-user.json';
import {
  scrapeBadgerTweetSchema,
  scrapeBadgerUserSchema,
  type ScrapeBadgerTweet,
  type ScrapeBadgerUser,
  type ScrapeBadgerUserPage
} from '../schemas';

export const scrapeBadgerTweetResponse = tweetResponse.body;

export const scrapeBadgerUserResponse = userResponse.body;

export const scrapeBadgerRetweetersResponse = retweetersResponse.body;

export const scrapeBadgerTweet = (
  overrides: Partial<ScrapeBadgerTweet> = {}
): ScrapeBadgerTweet => ({
  ...scrapeBadgerTweetSchema.parse(scrapeBadgerTweetResponse),
  ...overrides
});

export const scrapeBadgerAuthor = (
  overrides: Partial<ScrapeBadgerUser> = {}
): ScrapeBadgerUser => ({
  ...scrapeBadgerUserSchema.parse(scrapeBadgerUserResponse),
  ...overrides
});

export const scrapeBadgerRetweeters = (): ScrapeBadgerUser[] =>
  scrapeBadgerRetweetersResponse.data.map((user) =>
    scrapeBadgerUserSchema.parse(user)
  );

export const scrapeBadgerRetweeter = (
  overrides: Partial<ScrapeBadgerUser> = {}
): ScrapeBadgerUser => ({
  ...scrapeBadgerUserSchema.parse(scrapeBadgerRetweetersResponse.data[0]),
  ...overrides
});

export const scrapeBadgerUserPage = (
  data: ScrapeBadgerUser[],
  { nextCursor }: { nextCursor?: string } = {}
): ScrapeBadgerUserPage => ({
  data,
  nextCursor,
  hasMore: !!nextCursor
});
