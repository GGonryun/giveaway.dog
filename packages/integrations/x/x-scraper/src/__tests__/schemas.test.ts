import { describe, expect, it } from 'vitest';
import {
  scrapeBadgerRetweetersSchema,
  scrapeBadgerTweetSchema,
  scrapeBadgerUserSchema
} from '../schemas';

const user = {
  id: '44196397',
  username: 'acme_dog',
  name: 'Acme Dog',
  description: 'Giveaways every week',
  location: 'Internet',
  url: 'https://acme.example',
  profile_image_url: 'https://pbs.twimg.com/profile_images/1/a.jpg',
  profile_banner_url: null,
  followers_count: 10,
  following_count: 5,
  tweet_count: 100,
  verified: false,
  verified_type: null,
  created_at: '2020-01-01T00:00:00.000Z',
  can_dm: true
};

const tweet = {
  id: '1234567890',
  text: 'Retweet to win',
  created_at: '2026-01-01T00:00:00.000Z',
  user_id: '44196397',
  username: 'acme_dog',
  user_name: 'Acme Dog',
  favorite_count: 12,
  retweet_count: 4,
  reply_count: 3,
  quote_count: 1,
  view_count: 1234
};

describe('scrapeBadgerUserSchema', () => {
  it('keeps the fields that the app reads', () => {
    expect(scrapeBadgerUserSchema.parse({ ...user, listed_count: 0 })).toEqual(
      user
    );
  });

  it('accepts a user with only the required fields', () => {
    const {
      description,
      location,
      url,
      profile_image_url,
      profile_banner_url,
      verified_type,
      created_at,
      can_dm,
      ...required
    } = user;
    expect(scrapeBadgerUserSchema.parse(required)).toEqual(required);
  });

  it('refuses a user without a username', () => {
    const { username, ...rest } = user;
    expect(scrapeBadgerUserSchema.safeParse(rest).success).toBe(false);
  });
});

describe('scrapeBadgerTweetSchema', () => {
  it('keeps the fields that the app reads', () => {
    expect(scrapeBadgerTweetSchema.parse({ ...tweet, media: [] })).toEqual(
      tweet
    );
  });

  it('accepts a view count that X sends as a string of digits', () => {
    expect(
      scrapeBadgerTweetSchema.parse({ ...tweet, view_count: '1234' })
    ).toEqual({ ...tweet, view_count: '1234' });
  });

  it.each(['many', '12 views', 'about 12'])(
    'refuses the view count %j, which is not a number',
    (viewCount) => {
      expect(
        scrapeBadgerTweetSchema.safeParse({ ...tweet, view_count: viewCount })
          .success
      ).toBe(false);
    }
  );

  it('refuses a tweet whose counts are not numbers', () => {
    expect(
      scrapeBadgerTweetSchema.safeParse({ ...tweet, retweet_count: '4' })
        .success
    ).toBe(false);
  });
});

describe('scrapeBadgerRetweetersSchema', () => {
  it('keeps the users and the cursor of a page', () => {
    const page = { data: [user], next_cursor: 'next' };
    expect(scrapeBadgerRetweetersSchema.parse(page)).toEqual(page);
  });

  it('refuses a page without users, which the SDK would read as no retweeters', () => {
    expect(
      scrapeBadgerRetweetersSchema.safeParse({ users: [user] }).success
    ).toBe(false);
  });
});
