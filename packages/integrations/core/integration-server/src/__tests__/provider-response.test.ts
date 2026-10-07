import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { ApplicationError } from '@giveaway/util-errors';
import {
  findProviderResponseIssues,
  parseProviderItems,
  parseProviderResponse,
  toProviderResponseIssues,
  withFallback
} from '../provider-response';

const userSchema = z.object({
  id: z.string(),
  name: z.string().default(''),
  followers: z.number()
});

const pageSchema = z.object({ data: z.array(userSchema) });

const profileSchema = z.object({
  id: z.string(),
  bio: withFallback(z.string().nullish(), null),
  followers: withFallback(z.number(), 0)
});

const issuesOf = (schema: z.ZodTypeAny, data: unknown) => {
  const result = schema.safeParse(data);
  if (result.success) throw new Error('expected the parse to fail');
  return toProviderResponseIssues(result.error);
};

const loggedLines = () =>
  vi
    .mocked(console.error)
    .mock.calls.map(([tag, line]) => [tag, JSON.parse(String(line))]);

describe('toProviderResponseIssues', () => {
  it('joins the path of each issue with dots', () => {
    expect(issuesOf(z.object({ user: userSchema }), { user: {} })).toEqual([
      {
        path: 'user.id',
        code: 'invalid_type',
        expected: 'string',
        received: 'undefined'
      },
      {
        path: 'user.followers',
        code: 'invalid_type',
        expected: 'number',
        received: 'undefined'
      }
    ]);
  });

  it('replaces array indices with * and keeps one issue for each path', () => {
    const data = {
      data: [
        { id: 'u-1', followers: '10' },
        { id: 'u-2', followers: '20' }
      ]
    };

    expect(issuesOf(pageSchema, data)).toEqual([
      {
        path: 'data.*.followers',
        code: 'invalid_type',
        expected: 'number',
        received: 'string'
      }
    ]);
  });

  it('keeps issues on the same path that differ in what was received', () => {
    const data = { data: [{ id: 'u-1', followers: '10' }, { id: 'u-2' }] };

    expect(issuesOf(pageSchema, data)).toEqual([
      {
        path: 'data.*.followers',
        code: 'invalid_type',
        expected: 'number',
        received: 'string'
      },
      {
        path: 'data.*.followers',
        code: 'invalid_type',
        expected: 'number',
        received: 'undefined'
      }
    ]);
  });

  it('reports an empty path for an issue at the root', () => {
    expect(issuesOf(userSchema, null)).toEqual([
      {
        path: '',
        code: 'invalid_type',
        expected: 'object',
        received: 'null'
      }
    ]);
  });

  it('reports only the path and code of issues that can carry a received value', () => {
    const schema = z.object({
      status: z.enum(['enabled', 'disabled']),
      type: z.literal('webhook'),
      url: z.string().url()
    });

    expect(
      issuesOf(schema, {
        status: 'secret-status',
        type: 'secret-type',
        url: 'secret-url'
      })
    ).toEqual([
      { path: 'status', code: 'invalid_enum_value' },
      { path: 'type', code: 'invalid_literal' },
      { path: 'url', code: 'invalid_string' }
    ]);
  });
});

describe('parseProviderResponse', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const parse = (data: unknown) =>
    parseProviderResponse({
      provider: 'scrapebadger',
      call: 'users.getByUsername',
      schema: userSchema,
      data
    });

  const failure = (data: unknown) => {
    try {
      parse(data);
    } catch (error) {
      return error;
    }
    throw new Error('expected the parse to fail');
  };

  it('returns the parsed response, with the defaults of the schema', () => {
    expect(parse({ id: 'u-1', followers: 3, extra: true })).toEqual({
      id: 'u-1',
      name: '',
      followers: 3
    });
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('throws a BAD_GATEWAY application error that names the provider and the call', () => {
    const error = failure({ id: 'u-1' });

    expect(error).toBeInstanceOf(ApplicationError);
    expect(error).toMatchObject({
      code: 'BAD_GATEWAY',
      message: 'Unexpected response from X',
      data: { provider: 'scrapebadger', call: 'users.getByUsername' }
    });
  });

  it.each([
    ['bluesky', 'Bluesky'],
    ['discord', 'Discord'],
    ['scrapebadger', 'X'],
    ['twitch', 'Twitch'],
    ['x', 'X']
  ] as const)('names %s as %s in the error message', (provider, name) => {
    expect(() =>
      parseProviderResponse({
        provider,
        call: 'call',
        schema: userSchema,
        data: {}
      })
    ).toThrow(`Unexpected response from ${name}`);
  });

  it('writes one rejected log line with the provider, the call and the issues', () => {
    failure({ id: 'u-1', followers: '12' });

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      '[provider-response]',
      JSON.stringify({
        provider: 'scrapebadger',
        call: 'users.getByUsername',
        outcome: 'rejected',
        issues: [
          {
            path: 'followers',
            code: 'invalid_type',
            expected: 'number',
            received: 'string'
          }
        ]
      })
    );
  });

  it('keeps every value of the response out of the log and the error', () => {
    const secret = 'personal-data-1234';
    const schema = z.object({
      id: z.number(),
      email: z.literal('nobody@example.com'),
      kind: z.enum(['user']),
      bio: withFallback(z.literal('bio'), 'bio')
    });

    let error: unknown;
    try {
      parseProviderResponse({
        provider: 'discord',
        call: 'GET /guilds/:id',
        schema,
        data: {
          id: secret,
          email: secret,
          kind: secret,
          bio: secret,
          token: secret
        }
      });
    } catch (caught) {
      error = caught;
    }

    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(secret);
    expect(error).toBeInstanceOf(ApplicationError);
    expect(JSON.stringify(error)).not.toContain(secret);
    expect((error as ApplicationError).cause).toBeUndefined();
  });

  describe('with fields that fall back', () => {
    const parseProfile = (data: unknown) =>
      parseProviderResponse({
        provider: 'twitch',
        call: 'GET /helix/users',
        schema: profileSchema,
        data
      });

    it('returns the fallback of a field that does not match', () => {
      expect(parseProfile({ id: 'u-1', bio: 7, followers: 'many' })).toEqual({
        id: 'u-1',
        bio: null,
        followers: 0
      });
    });

    it('writes one fallback log line with the issues of the fields', () => {
      parseProfile({ id: 'u-1', bio: 7, followers: 'many' });

      expect(loggedLines()).toEqual([
        [
          '[provider-response]',
          {
            provider: 'twitch',
            call: 'GET /helix/users',
            outcome: 'fallback',
            issues: [
              {
                path: 'bio',
                code: 'invalid_type',
                expected: 'string',
                received: 'number'
              },
              {
                path: 'followers',
                code: 'invalid_type',
                expected: 'number',
                received: 'string'
              }
            ]
          }
        ]
      ]);
    });

    it('falls back and reports a field that the response leaves out', () => {
      expect(parseProfile({ id: 'u-1' })).toEqual({ id: 'u-1', followers: 0 });
      expect(loggedLines()).toEqual([
        [
          '[provider-response]',
          {
            provider: 'twitch',
            call: 'GET /helix/users',
            outcome: 'fallback',
            issues: [
              {
                path: 'followers',
                code: 'invalid_type',
                expected: 'number',
                received: 'undefined'
              }
            ]
          }
        ]
      ]);
    });

    it('writes nothing when every field matches', () => {
      expect(parseProfile({ id: 'u-1', bio: null, followers: 4 })).toEqual({
        id: 'u-1',
        bio: null,
        followers: 4
      });
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('reports only the rejection when a required field does not match', () => {
      expect(() => parseProfile({ id: 1, followers: 'many' })).toThrow(
        ApplicationError
      );
      expect(loggedLines()).toEqual([
        [
          '[provider-response]',
          {
            provider: 'twitch',
            call: 'GET /helix/users',
            outcome: 'rejected',
            issues: [
              {
                path: 'id',
                code: 'invalid_type',
                expected: 'string',
                received: 'number'
              }
            ]
          }
        ]
      ]);
    });

    it('does not report the fallbacks of an earlier parse', () => {
      parseProfile({ id: 'u-1', followers: 'many' });
      errorSpy.mockClear();

      parseProfile({ id: 'u-2', followers: 2 });

      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('applies the fallback without a report outside the helper', () => {
      expect(profileSchema.parse({ id: 'u-1', followers: 'many' })).toEqual({
        id: 'u-1',
        followers: 0
      });
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });
});

describe('findProviderResponseIssues', () => {
  it('returns no issue for a response that matches every field', () => {
    expect(
      findProviderResponseIssues(profileSchema, { id: 'u-1', followers: 1 })
    ).toEqual([]);
  });

  it('returns the issues of the fields that fall back', () => {
    expect(
      findProviderResponseIssues(profileSchema, { id: 'u-1', followers: 'x' })
    ).toEqual([
      {
        path: 'followers',
        code: 'invalid_type',
        expected: 'number',
        received: 'string'
      }
    ]);
  });

  it('returns the issues of the fields that fall back and of the rejection', () => {
    expect(
      findProviderResponseIssues(profileSchema, { followers: 'x' })
    ).toEqual([
      {
        path: 'followers',
        code: 'invalid_type',
        expected: 'number',
        received: 'string'
      },
      {
        path: 'id',
        code: 'invalid_type',
        expected: 'string',
        received: 'undefined'
      }
    ]);
  });
});

describe('parseProviderItems', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const parseItems = (items: unknown[]) =>
    parseProviderItems({
      provider: 'scrapebadger',
      call: 'tweets.getRetweeters',
      schema: profileSchema,
      items,
      path: ['data']
    });

  it('returns every item that matches, in order', () => {
    expect(
      parseItems([
        { id: 'u-1', followers: 1 },
        { id: 'u-2', followers: 2 }
      ])
    ).toEqual([
      { id: 'u-1', followers: 1 },
      { id: 'u-2', followers: 2 }
    ]);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('drops the items that do not match and reports how many it dropped', () => {
    expect(
      parseItems([
        { id: 'u-1', followers: 1 },
        null,
        { id: 3, followers: 3 },
        { id: 'u-4', followers: 4 }
      ])
    ).toEqual([
      { id: 'u-1', followers: 1 },
      { id: 'u-4', followers: 4 }
    ]);
    expect(loggedLines()).toEqual([
      [
        '[provider-response]',
        {
          provider: 'scrapebadger',
          call: 'tweets.getRetweeters',
          outcome: 'dropped',
          dropped: 2,
          issues: [
            {
              path: 'data.*',
              code: 'invalid_type',
              expected: 'object',
              received: 'null'
            },
            {
              path: 'data.*.id',
              code: 'invalid_type',
              expected: 'string',
              received: 'number'
            }
          ]
        }
      ]
    ]);
  });

  it('keeps the items whose fields fall back and reports the fields', () => {
    expect(parseItems([{ id: 'u-1', followers: 'x' }])).toEqual([
      { id: 'u-1', followers: 0 }
    ]);
    expect(loggedLines()).toEqual([
      [
        '[provider-response]',
        {
          provider: 'scrapebadger',
          call: 'tweets.getRetweeters',
          outcome: 'fallback',
          issues: [
            {
              path: 'data.*.followers',
              code: 'invalid_type',
              expected: 'number',
              received: 'string'
            }
          ]
        }
      ]
    ]);
  });

  it('does not report the fallbacks of an item it drops', () => {
    parseItems([{ id: 3, followers: 'x' }]);

    expect(loggedLines().map(([, line]) => line.outcome)).toEqual(['dropped']);
  });

  it('returns an empty list for no items', () => {
    expect(parseItems([])).toEqual([]);
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
