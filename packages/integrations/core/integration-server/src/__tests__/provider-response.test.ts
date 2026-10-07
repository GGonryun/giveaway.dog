import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { ApplicationError } from '@giveaway/util-errors';
import {
  parseProviderResponse,
  toProviderResponseIssues
} from '../provider-response';

const userSchema = z.object({
  id: z.string(),
  name: z.string().default(''),
  followers: z.number()
});

const pageSchema = z.object({ data: z.array(userSchema) });

const issuesOf = (schema: z.ZodTypeAny, data: unknown) => {
  const result = schema.safeParse(data);
  if (result.success) throw new Error('expected the parse to fail');
  return toProviderResponseIssues(result.error);
};

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

  it('writes one log line with the provider, the call and the issues', () => {
    failure({ id: 'u-1', followers: '12' });

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      '[provider-response]',
      JSON.stringify({
        provider: 'scrapebadger',
        call: 'users.getByUsername',
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
      kind: z.enum(['user'])
    });

    let error: unknown;
    try {
      parseProviderResponse({
        provider: 'discord',
        call: 'GET /guilds/:id',
        schema,
        data: { id: secret, email: secret, kind: secret, token: secret }
      });
    } catch (caught) {
      error = caught;
    }

    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(secret);
    expect(error).toBeInstanceOf(ApplicationError);
    expect(JSON.stringify(error)).not.toContain(secret);
    expect((error as ApplicationError).cause).toBeUndefined();
  });
});
