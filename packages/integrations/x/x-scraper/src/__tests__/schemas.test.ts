import { describe, it, expect } from 'vitest';
import { findProviderResponseIssues } from '@giveaway/integration-server/provider-response';
import {
  scrapeBadgerTweetSchema,
  scrapeBadgerUserPageSchema,
  scrapeBadgerUserSchema
} from '../schemas';
import {
  scrapeBadgerTweetResponse,
  scrapeBadgerUserResponse
} from '../testing/fixtures-scrapebadger';

const tweet = (fields: Record<string, unknown>) => ({
  ...scrapeBadgerTweetResponse,
  ...fields
});

const user = (fields: Record<string, unknown>) => ({
  ...scrapeBadgerUserResponse,
  ...fields
});

const typeIssue = (path: string, expected: string, received: string) => ({
  path,
  code: 'invalid_type',
  expected,
  received
});

describe('scrapeBadgerTweetSchema', () => {
  it.each([
    ['a number', 31, 31],
    ['a string of digits', '31', 31],
    ['a string of zero', '0', 0],
    ['null', null, 0],
    ['nothing', undefined, 0]
  ])(
    'reads an engagement count given as %s without a report',
    (_, value, count) => {
      const data = tweet({ retweet_count: value });

      expect(scrapeBadgerTweetSchema.parse(data).retweet_count).toBe(count);
      expect(findProviderResponseIssues(scrapeBadgerTweetSchema, data)).toEqual(
        []
      );
    }
  );

  it.each([
    ['a formatted number', '1,204', 'string'],
    ['a string with a space before the digits', ' 12', 'string'],
    ['a string with a space after the digits', '12 ', 'string'],
    ['an empty string', '', 'string'],
    ['a decimal string', '1.5', 'string'],
    ['a negative string', '-3', 'string'],
    ['a list', [12], 'array'],
    ['a flag', true, 'boolean']
  ])(
    'falls back to 0 and reports an engagement count given as %s',
    (_, value, received) => {
      const data = tweet({ favorite_count: value });

      expect(scrapeBadgerTweetSchema.parse(data).favorite_count).toBe(0);
      expect(findProviderResponseIssues(scrapeBadgerTweetSchema, data)).toEqual(
        [typeIssue('favorite_count', 'number', received)]
      );
    }
  );

  it('keeps an optional count that is missing or null as it is', () => {
    expect(
      scrapeBadgerTweetSchema.parse(tweet({ view_count: null })).view_count
    ).toBeNull();
    expect(
      scrapeBadgerTweetSchema.parse(tweet({ view_count: undefined })).view_count
    ).toBeUndefined();
  });

  it('falls back to no view count and reports a view count that is not a number', () => {
    const data = tweet({ view_count: 'many' });

    expect(scrapeBadgerTweetSchema.parse(data).view_count).toBeNull();
    expect(findProviderResponseIssues(scrapeBadgerTweetSchema, data)).toEqual([
      typeIssue('view_count', 'number', 'string')
    ]);
  });

  it.each([
    ['null', null],
    ['nothing', undefined]
  ])('reads a text given as %s as an empty text', (_, value) => {
    const data = tweet({ text: value });

    expect(scrapeBadgerTweetSchema.parse(data).text).toBe('');
    expect(findProviderResponseIssues(scrapeBadgerTweetSchema, data)).toEqual(
      []
    );
  });

  it('falls back to an empty text and reports a text that is not a string', () => {
    const data = tweet({ text: 7 });

    expect(scrapeBadgerTweetSchema.parse(data).text).toBe('');
    expect(findProviderResponseIssues(scrapeBadgerTweetSchema, data)).toEqual([
      typeIssue('text', 'string', 'number')
    ]);
  });

  it('falls back to no username and reports a username that is not a string', () => {
    const data = tweet({ username: ['TheGiveawayDog'] });

    expect(scrapeBadgerTweetSchema.parse(data).username).toBeNull();
    expect(findProviderResponseIssues(scrapeBadgerTweetSchema, data)).toEqual([
      typeIssue('username', 'string', 'array')
    ]);
  });

  it.each([
    ['null', null],
    ['nothing', undefined]
  ])('reads media given as %s as no media', (_, value) => {
    const data = tweet({ media: value });

    expect(scrapeBadgerTweetSchema.parse(data).media).toEqual([]);
    expect(findProviderResponseIssues(scrapeBadgerTweetSchema, data)).toEqual(
      []
    );
  });

  it('falls back to no media and reports media that is not a list', () => {
    const data = tweet({ media: { type: 'photo' } });

    expect(scrapeBadgerTweetSchema.parse(data).media).toEqual([]);
    expect(findProviderResponseIssues(scrapeBadgerTweetSchema, data)).toEqual([
      typeIssue('media', 'array', 'object')
    ]);
  });

  it('keeps a media item whose fields fall back and reports the fields', () => {
    const data = tweet({
      media: [{ type: 'photo', url: 7, width: '1200', height: 'tall' }]
    });

    expect(scrapeBadgerTweetSchema.parse(data).media).toEqual([
      { type: 'photo', url: null, width: 1200, height: null }
    ]);
    expect(findProviderResponseIssues(scrapeBadgerTweetSchema, data)).toEqual([
      typeIssue('media.*.url', 'string', 'number'),
      typeIssue('media.*.height', 'number', 'string')
    ]);
  });

  it('rejects a tweet without an id', () => {
    expect(
      findProviderResponseIssues(scrapeBadgerTweetSchema, tweet({ id: 7 }))
    ).toEqual([typeIssue('id', 'string', 'number')]);
  });
});

describe('scrapeBadgerUserSchema', () => {
  it('reads counts given as strings of digits', () => {
    const data = user({
      followers_count: '1204',
      following_count: 87,
      tweet_count: null
    });

    expect(scrapeBadgerUserSchema.parse(data)).toMatchObject({
      followers_count: 1204,
      following_count: 87,
      tweet_count: null
    });
    expect(findProviderResponseIssues(scrapeBadgerUserSchema, data)).toEqual(
      []
    );
  });

  it.each([
    ['null', null, false],
    ['nothing', undefined, false],
    ['true', true, true]
  ])('reads the verified flag given as %s', (_, value, verified) => {
    const data = user({ verified: value });

    expect(scrapeBadgerUserSchema.parse(data).verified).toBe(verified);
    expect(findProviderResponseIssues(scrapeBadgerUserSchema, data)).toEqual(
      []
    );
  });

  it('falls back and reports the display fields that do not match', () => {
    const data = user({
      name: null,
      description: 7,
      verified: 'yes',
      is_blue_verified: 'yes',
      followers_count: 'many'
    });

    expect(scrapeBadgerUserSchema.parse(data)).toMatchObject({
      name: '',
      description: null,
      verified: false,
      is_blue_verified: null,
      followers_count: null
    });
    expect(findProviderResponseIssues(scrapeBadgerUserSchema, data)).toEqual([
      typeIssue('description', 'string', 'number'),
      typeIssue('followers_count', 'number', 'string'),
      typeIssue('verified', 'boolean', 'string'),
      typeIssue('is_blue_verified', 'boolean', 'string')
    ]);
  });

  it.each([
    ['id', { id: 7 }, typeIssue('id', 'string', 'number')],
    ['username', { username: null }, typeIssue('username', 'string', 'null')]
  ])('rejects a user whose %s does not match', (_, fields, issue) => {
    expect(
      findProviderResponseIssues(scrapeBadgerUserSchema, user(fields))
    ).toEqual([issue]);
  });
});

describe('scrapeBadgerUserPageSchema', () => {
  it('keeps the entries of the page for the user schema', () => {
    expect(
      scrapeBadgerUserPageSchema.parse({
        data: [null, { id: 'u-1' }],
        nextCursor: null,
        hasMore: false
      })
    ).toEqual({ data: [null, { id: 'u-1' }], hasMore: false });
  });

  it('keeps the cursor of the next page', () => {
    expect(
      scrapeBadgerUserPageSchema.parse({
        data: [],
        nextCursor: 'next',
        hasMore: true
      })
    ).toEqual({ data: [], nextCursor: 'next', hasMore: true });
  });
});
