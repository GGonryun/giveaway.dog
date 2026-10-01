import { describe, it, expect } from 'vitest';
import {
  twitterUserSchema,
  actionsTwitterUserSchema,
  eligibleTwitterUserSchema,
  tweetSchema,
  quoteTweetsResponseSchema,
  quoteTweetsRequest,
  likingUsersResponseSchema,
  likingUsersRequest,
  retweetedByResponseSchema,
  retweetedByRequest,
  repliedByResponseSchema,
  repliedByRequest,
  createTweetRequestSchema,
  createTweetResponseSchema,
  uploadMediaResponseSchema
} from '../api';

const user = () => ({
  id: '42',
  name: 'Giveaway Dog',
  username: 'giveawaydog'
});

const fullUser = () => ({
  ...user(),
  created_at: '2020-01-02T03:04:05.000Z',
  description: 'Woof',
  location: 'Internet',
  profile_image_url: 'https://pbs.twimg.com/a.jpg',
  profile_banner_url: 'https://pbs.twimg.com/b.jpg',
  protected: false,
  verified: true,
  verified_type: 'blue',
  public_metrics: {
    followers_count: 10,
    following_count: 20,
    tweet_count: 30
  }
});

const tweet = () => ({ id: '1001', text: 'Enter now!' });

const fullTweet = () => ({
  ...tweet(),
  author_id: '42',
  created_at: '2026-01-01T00:00:00.000Z',
  conversation_id: '1000',
  in_reply_to_user_id: '7',
  referenced_tweets: [
    { type: 'retweeted' as const, id: '1' },
    { type: 'quoted' as const, id: '2' },
    { type: 'replied_to' as const, id: '3' }
  ],
  public_metrics: {
    retweet_count: 1,
    reply_count: 2,
    like_count: 3,
    quote_count: 4,
    bookmark_count: 5,
    impression_count: 6
  }
});

describe('twitterUserSchema', () => {
  describe('when the user is valid', () => {
    it('accepts the required fields only', () => {
      expect(twitterUserSchema.parse(user())).toEqual(user());
    });

    it('coerces created_at into a date and keeps the other fields', () => {
      expect(twitterUserSchema.parse(fullUser())).toEqual({
        ...fullUser(),
        created_at: new Date('2020-01-02T03:04:05.000Z')
      });
    });

    it('coerces a numeric created_at timestamp into a date', () => {
      expect(
        twitterUserSchema.parse({ ...user(), created_at: 0 }).created_at
      ).toEqual(new Date(0));
    });

    it('coerces a null created_at into the unix epoch', () => {
      expect(
        twitterUserSchema.parse({ ...user(), created_at: null }).created_at
      ).toEqual(new Date(0));
    });

    it('strips unknown keys', () => {
      expect(
        twitterUserSchema.parse({ ...user(), url: 'https://a.b' })
      ).toEqual(user());
    });
  });

  describe('when the user is invalid', () => {
    it.each(['id', 'name', 'username'])('rejects a missing %s', (field) => {
      const input: Record<string, unknown> = user();
      delete input[field];

      expect(twitterUserSchema.safeParse(input).error?.issues[0].path).toEqual([
        field
      ]);
    });

    it('rejects a numeric id', () => {
      expect(twitterUserSchema.safeParse({ ...user(), id: 42 }).success).toBe(
        false
      );
    });

    it('rejects an unparseable created_at', () => {
      const result = twitterUserSchema.safeParse({
        ...user(),
        created_at: 'yesterday'
      });

      expect(result.error?.issues[0]).toMatchObject({
        path: ['created_at'],
        message: 'Invalid date'
      });
    });

    it('rejects a string protected flag', () => {
      expect(
        twitterUserSchema.safeParse({ ...user(), protected: 'false' }).success
      ).toBe(false);
    });

    it('rejects incomplete public metrics', () => {
      const result = twitterUserSchema.safeParse({
        ...user(),
        public_metrics: { followers_count: 1, following_count: 2 }
      });

      expect(result.error?.issues[0].path).toEqual([
        'public_metrics',
        'tweet_count'
      ]);
    });
  });
});

describe('actionsTwitterUserSchema', () => {
  it('defaults actions to an empty list', () => {
    expect(actionsTwitterUserSchema.parse(user())).toEqual({
      ...user(),
      actions: []
    });
  });

  it('keeps every supported action', () => {
    expect(
      actionsTwitterUserSchema.parse({
        ...user(),
        actions: ['like', 'retweet', 'quote', 'reply']
      }).actions
    ).toEqual(['like', 'retweet', 'quote', 'reply']);
  });

  it('keeps duplicate actions', () => {
    expect(
      actionsTwitterUserSchema.parse({ ...user(), actions: ['like', 'like'] })
        .actions
    ).toEqual(['like', 'like']);
  });

  it('rejects an unsupported action', () => {
    const result = actionsTwitterUserSchema.safeParse({
      ...user(),
      actions: ['follow']
    });

    expect(result.error?.issues[0].path).toEqual(['actions', 0]);
  });

  it('still validates the base user fields', () => {
    expect(actionsTwitterUserSchema.safeParse({ actions: [] }).success).toBe(
      false
    );
  });
});

describe('eligibleTwitterUserSchema', () => {
  it('leaves ineligible undefined when it is not provided', () => {
    const parsed = eligibleTwitterUserSchema.parse(user());

    expect(parsed).toEqual({ ...user(), actions: [] });
    expect('ineligible' in parsed).toBe(false);
  });

  it('keeps the ineligibility reason', () => {
    expect(
      eligibleTwitterUserSchema.parse({
        ...user(),
        actions: ['reply'],
        ineligible: 'Account too new'
      })
    ).toEqual({ ...user(), actions: ['reply'], ineligible: 'Account too new' });
  });

  it('rejects a boolean ineligible flag', () => {
    expect(
      eligibleTwitterUserSchema.safeParse({ ...user(), ineligible: true })
        .success
    ).toBe(false);
  });
});

describe('tweetSchema', () => {
  it('accepts the required fields only', () => {
    expect(tweetSchema.parse(tweet())).toEqual(tweet());
  });

  it('keeps every optional field', () => {
    expect(tweetSchema.parse(fullTweet())).toEqual(fullTweet());
  });

  it('keeps created_at as a string', () => {
    expect(tweetSchema.parse(fullTweet()).created_at).toBe(
      '2026-01-01T00:00:00.000Z'
    );
  });

  it('allows public metrics without bookmark and impression counts', () => {
    const public_metrics = {
      retweet_count: 0,
      reply_count: 0,
      like_count: 0,
      quote_count: 0
    };

    expect(
      tweetSchema.parse({ ...tweet(), public_metrics }).public_metrics
    ).toEqual(public_metrics);
  });

  it.each(['id', 'text'])('rejects a missing %s', (field) => {
    const input: Record<string, unknown> = tweet();
    delete input[field];

    expect(tweetSchema.safeParse(input).error?.issues[0].path).toEqual([field]);
  });

  it('rejects an unknown referenced tweet type', () => {
    const result = tweetSchema.safeParse({
      ...tweet(),
      referenced_tweets: [{ type: 'liked', id: '1' }]
    });

    expect(result.error?.issues[0].path).toEqual([
      'referenced_tweets',
      0,
      'type'
    ]);
  });

  it('rejects public metrics without a quote count', () => {
    const result = tweetSchema.safeParse({
      ...tweet(),
      public_metrics: { retweet_count: 0, reply_count: 0, like_count: 0 }
    });

    expect(result.error?.issues[0].path).toEqual([
      'public_metrics',
      'quote_count'
    ]);
  });
});

describe('quoteTweetsResponseSchema', () => {
  it('accepts an empty response', () => {
    expect(quoteTweetsResponseSchema.parse({})).toEqual({});
  });

  it('parses tweets, included users and pagination metadata', () => {
    const parsed = quoteTweetsResponseSchema.parse({
      data: [tweet()],
      includes: { users: [fullUser()] },
      meta: { result_count: 1, next_token: 'next' }
    });

    expect(parsed).toEqual({
      data: [tweet()],
      includes: {
        users: [{ ...fullUser(), created_at: new Date(fullUser().created_at) }]
      },
      meta: { result_count: 1, next_token: 'next' }
    });
  });

  it('accepts includes without users', () => {
    expect(quoteTweetsResponseSchema.parse({ includes: {} })).toEqual({
      includes: {}
    });
  });

  it('rejects meta without a result count', () => {
    const result = quoteTweetsResponseSchema.safeParse({ meta: {} });

    expect(result.error?.issues[0].path).toEqual(['meta', 'result_count']);
  });

  it('rejects an invalid included user', () => {
    const result = quoteTweetsResponseSchema.safeParse({
      includes: { users: [{ id: '1' }] }
    });

    expect(result.error?.issues[0].path).toEqual([
      'includes',
      'users',
      0,
      'name'
    ]);
  });
});

describe('repliedByResponseSchema', () => {
  it('parses replies with included users', () => {
    expect(
      repliedByResponseSchema.parse({
        data: [fullTweet()],
        includes: { users: [user()] },
        meta: { result_count: 1 }
      })
    ).toEqual({
      data: [fullTweet()],
      includes: { users: [user()] },
      meta: { result_count: 1 }
    });
  });

  it('rejects an invalid reply', () => {
    const result = repliedByResponseSchema.safeParse({ data: [{ id: '1' }] });

    expect(result.error?.issues[0].path).toEqual(['data', 0, 'text']);
  });
});

describe.each([
  ['likingUsersResponseSchema', likingUsersResponseSchema],
  ['retweetedByResponseSchema', retweetedByResponseSchema]
])('%s', (_name, schema) => {
  it('accepts an empty response', () => {
    expect(schema.parse({})).toEqual({});
  });

  it('parses users and pagination metadata', () => {
    expect(
      schema.parse({
        data: [user()],
        meta: { result_count: 1, next_token: 'abc' }
      })
    ).toEqual({ data: [user()], meta: { result_count: 1, next_token: 'abc' } });
  });

  it('accepts a final page without a next token', () => {
    expect(schema.parse({ meta: { result_count: 0 } })).toEqual({
      meta: { result_count: 0 }
    });
  });

  it('rejects tweets in place of users', () => {
    const result = schema.safeParse({ data: [tweet()] });

    expect(result.error?.issues.map((issue) => issue.path)).toEqual([
      ['data', 0, 'name'],
      ['data', 0, 'username']
    ]);
  });

  it('rejects a string result count', () => {
    expect(schema.safeParse({ meta: { result_count: '1' } }).success).toBe(
      false
    );
  });

  it('drops includes because they are not part of the schema', () => {
    expect(schema.parse({ includes: { users: [user()] } })).toEqual({});
  });
});

describe.each([
  ['quoteTweetsRequest', quoteTweetsRequest],
  ['likingUsersRequest', likingUsersRequest],
  ['retweetedByRequest', retweetedByRequest],
  ['repliedByRequest', repliedByRequest]
])('%s', (_name, schema) => {
  it('accepts a tweet id without a pagination token', () => {
    expect(schema.parse({ tweetId: '1001' })).toEqual({ tweetId: '1001' });
  });

  it('keeps the pagination token', () => {
    expect(schema.parse({ tweetId: '1001', paginationToken: 'next' })).toEqual({
      tweetId: '1001',
      paginationToken: 'next'
    });
  });

  it('accepts an empty tweet id', () => {
    expect(schema.safeParse({ tweetId: '' }).success).toBe(true);
  });

  it('rejects a numeric tweet id', () => {
    expect(schema.safeParse({ tweetId: 1001 }).error?.issues[0].path).toEqual([
      'tweetId'
    ]);
  });

  it('rejects a missing tweet id', () => {
    expect(schema.safeParse({}).success).toBe(false);
  });
});

describe('createTweetRequestSchema', () => {
  it('accepts text without media', () => {
    expect(createTweetRequestSchema.parse({ text: 'Hello' })).toEqual({
      text: 'Hello'
    });
  });

  it('accepts an empty text', () => {
    expect(createTweetRequestSchema.safeParse({ text: '' }).success).toBe(true);
  });

  it('accepts text of exactly 280 characters', () => {
    expect(
      createTweetRequestSchema.safeParse({ text: 'a'.repeat(280) }).success
    ).toBe(true);
  });

  it('rejects text longer than 280 characters', () => {
    const result = createTweetRequestSchema.safeParse({
      text: 'a'.repeat(281)
    });

    expect(result.error?.issues[0]).toMatchObject({
      path: ['text'],
      code: 'too_big',
      maximum: 280,
      message: 'String must contain at most 280 character(s)'
    });
  });

  it('keeps media ids', () => {
    expect(
      createTweetRequestSchema.parse({
        text: 'Hello',
        media: { media_ids: ['m1', 'm2'] }
      })
    ).toEqual({ text: 'Hello', media: { media_ids: ['m1', 'm2'] } });
  });

  it('rejects media without media ids', () => {
    const result = createTweetRequestSchema.safeParse({
      text: 'Hello',
      media: {}
    });

    expect(result.error?.issues[0].path).toEqual(['media', 'media_ids']);
  });

  it('rejects numeric media ids', () => {
    expect(
      createTweetRequestSchema.safeParse({
        text: 'Hello',
        media: { media_ids: [1] }
      }).success
    ).toBe(false);
  });
});

describe('createTweetResponseSchema', () => {
  const response = () => ({
    data: { id: '1', text: 'Hello', edit_history_tweet_ids: ['1'] }
  });

  it('parses the created tweet', () => {
    expect(createTweetResponseSchema.parse(response())).toEqual(response());
  });

  it('requires the data envelope', () => {
    expect(
      createTweetResponseSchema.safeParse({ id: '1', text: 'Hello' }).success
    ).toBe(false);
  });

  it('requires the edit history ids', () => {
    const result = createTweetResponseSchema.safeParse({
      data: { id: '1', text: 'Hello' }
    });

    expect(result.error?.issues[0].path).toEqual([
      'data',
      'edit_history_tweet_ids'
    ]);
  });
});

describe('uploadMediaResponseSchema', () => {
  it('parses the minimal upload response', () => {
    expect(
      uploadMediaResponseSchema.parse({ data: { id: '1', media_key: '3_1' } })
    ).toEqual({ data: { id: '1', media_key: '3_1' } });
  });

  it('keeps size and expiry and strips unknown meta keys', () => {
    expect(
      uploadMediaResponseSchema.parse({
        meta: { processing: true },
        data: {
          id: '1',
          media_key: '3_1',
          size: 2048,
          expires_after_secs: 86400
        }
      })
    ).toEqual({
      meta: {},
      data: { id: '1', media_key: '3_1', size: 2048, expires_after_secs: 86400 }
    });
  });

  it('requires a media key', () => {
    const result = uploadMediaResponseSchema.safeParse({ data: { id: '1' } });

    expect(result.error?.issues[0].path).toEqual(['data', 'media_key']);
  });

  it('rejects a string size', () => {
    expect(
      uploadMediaResponseSchema.safeParse({
        data: { id: '1', media_key: '3_1', size: '2048' }
      }).success
    ).toBe(false);
  });

  it('rejects a non-object meta', () => {
    expect(
      uploadMediaResponseSchema.safeParse({
        meta: 'ok',
        data: { id: '1', media_key: '3_1' }
      }).success
    ).toBe(false);
  });
});
