import { describe, it, expect } from 'vitest';
import type { AutomatedPostJob } from '@prisma/client';
import { ZodError } from 'zod';
import { ApplicationError } from '@giveaway/util-errors';
import {
  asPostToDiscordResponseSchema,
  automatedPostJobSchema,
  postToBlueskyRequestSchema,
  postToDiscordRequestSchema,
  postToDiscordResponseSchema,
  scheduleAutomatedPostSchema,
  toAutomatedPostJobCreateInput,
  toAutomatedPostJobSchema,
  toPostToDiscordResponseSchema
} from '../schemas';

const RUN_AT = new Date('2026-05-01T10:00:00.000Z');
const CREATED_AT = new Date('2026-04-01T10:00:00.000Z');
const UPDATED_AT = new Date('2026-04-02T10:00:00.000Z');

const jobRow = (
  overrides: Partial<AutomatedPostJob> = {}
): AutomatedPostJob => ({
  id: 'job-1',
  sweepstakesId: 'sweep-1',
  type: 'POST_TO_BLUESKY',
  status: 'PENDING',
  runAt: RUN_AT,
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
  request: { integrationId: 'int-1', text: 'Hello world' },
  response: null,
  ...overrides
});

const issuesOf = (result: { success: boolean; error?: ZodError }) =>
  (result.error?.issues ?? []).map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message
  }));

const catchError = (fn: () => unknown): unknown => {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error('Expected function to throw');
};

describe('postToBlueskyRequestSchema', () => {
  it('defaults tasks to an empty array', () => {
    const parsed = postToBlueskyRequestSchema.parse({
      integrationId: 'int-1',
      text: 'Hello'
    });

    expect(parsed).toEqual({
      integrationId: 'int-1',
      text: 'Hello',
      tasks: []
    });
  });

  it('keeps an optional image url and the REPOST and LIKE tasks', () => {
    const parsed = postToBlueskyRequestSchema.parse({
      integrationId: 'int-1',
      text: 'Hello',
      imageUrl: 'not-validated-as-url',
      tasks: ['REPOST', 'LIKE']
    });

    expect(parsed).toEqual({
      integrationId: 'int-1',
      text: 'Hello',
      imageUrl: 'not-validated-as-url',
      tasks: ['REPOST', 'LIKE']
    });
  });

  it('rejects an empty integration id with an account selection message', () => {
    const result = postToBlueskyRequestSchema.safeParse({
      integrationId: '',
      text: 'Hello'
    });

    expect(issuesOf(result)).toEqual([
      { path: 'integrationId', message: 'Please select an account' }
    ]);
  });

  it('rejects empty text with a post content message', () => {
    const result = postToBlueskyRequestSchema.safeParse({
      integrationId: 'int-1',
      text: ''
    });

    expect(issuesOf(result)).toEqual([
      { path: 'text', message: 'Post content is required' }
    ]);
  });

  it('accepts text of exactly 300 characters', () => {
    const result = postToBlueskyRequestSchema.safeParse({
      integrationId: 'int-1',
      text: 'a'.repeat(300)
    });

    expect(result.success).toBe(true);
  });

  it('rejects text longer than 300 characters', () => {
    const result = postToBlueskyRequestSchema.safeParse({
      integrationId: 'int-1',
      text: 'a'.repeat(301)
    });

    expect(issuesOf(result)).toEqual([
      {
        path: 'text',
        message: 'String must contain at most 300 character(s)'
      }
    ]);
  });

  it('rejects task names other than REPOST and LIKE', () => {
    const result = postToBlueskyRequestSchema.safeParse({
      integrationId: 'int-1',
      text: 'Hello',
      tasks: ['FOLLOW']
    });

    expect(result.success).toBe(false);
    expect(issuesOf(result)[0].path).toBe('tasks.0');
  });
});

describe('postToDiscordRequestSchema', () => {
  it('defaults roles and tasks to empty arrays', () => {
    const parsed = postToDiscordRequestSchema.parse({
      integrationId: 'guild-1',
      channelId: 'channel-1'
    });

    expect(parsed).toEqual({
      integrationId: 'guild-1',
      channelId: 'channel-1',
      roles: [],
      tasks: []
    });
  });

  it('accepts role ids and the INTERACTION task', () => {
    const parsed = postToDiscordRequestSchema.parse({
      integrationId: 'guild-1',
      channelId: 'channel-1',
      roles: ['role-1', 'role-2'],
      tasks: ['INTERACTION']
    });

    expect(parsed.roles).toEqual(['role-1', 'role-2']);
    expect(parsed.tasks).toEqual(['INTERACTION']);
  });

  it('rejects an empty integration id with a server selection message', () => {
    const result = postToDiscordRequestSchema.safeParse({
      integrationId: '',
      channelId: 'channel-1'
    });

    expect(issuesOf(result)).toEqual([
      { path: 'integrationId', message: 'Please select a Discord server' }
    ]);
  });

  it('rejects an empty channel id with a channel selection message', () => {
    const result = postToDiscordRequestSchema.safeParse({
      integrationId: 'guild-1',
      channelId: ''
    });

    expect(issuesOf(result)).toEqual([
      { path: 'channelId', message: 'Please select a channel' }
    ]);
  });

  it('rejects tasks other than INTERACTION', () => {
    const result = postToDiscordRequestSchema.safeParse({
      integrationId: 'guild-1',
      channelId: 'channel-1',
      tasks: ['LIKE']
    });

    expect(result.success).toBe(false);
    expect(issuesOf(result)[0].path).toBe('tasks.0');
  });
});

describe('postToDiscordResponseSchema', () => {
  it('accepts an empty object because every field is optional', () => {
    expect(postToDiscordResponseSchema.parse({})).toEqual({});
  });

  it('accepts a full response with a valid message url', () => {
    const response = {
      messageId: 'msg-1',
      channelId: 'channel-1',
      messageUrl: 'https://discord.com/channels/1/2/3',
      error: 'none'
    };

    expect(postToDiscordResponseSchema.parse(response)).toEqual(response);
  });

  it('rejects a message url that is not a url', () => {
    const result = postToDiscordResponseSchema.safeParse({
      messageUrl: 'not a url'
    });

    expect(issuesOf(result)).toEqual([
      { path: 'messageUrl', message: 'Invalid url' }
    ]);
  });
});

describe('scheduleAutomatedPostSchema', () => {
  it('parses a bluesky schedule request and applies request defaults', () => {
    const parsed = scheduleAutomatedPostSchema.parse({
      sweepstakesId: 'sweep-1',
      type: 'POST_TO_BLUESKY',
      request: { integrationId: 'int-1', text: 'Hello' }
    });

    expect(parsed).toEqual({
      sweepstakesId: 'sweep-1',
      type: 'POST_TO_BLUESKY',
      request: { integrationId: 'int-1', text: 'Hello', tasks: [] }
    });
  });

  it('parses a discord schedule request and applies request defaults', () => {
    const parsed = scheduleAutomatedPostSchema.parse({
      sweepstakesId: 'sweep-1',
      type: 'POST_TO_DISCORD',
      request: { integrationId: 'guild-1', channelId: 'channel-1' }
    });

    expect(parsed).toEqual({
      sweepstakesId: 'sweep-1',
      type: 'POST_TO_DISCORD',
      request: {
        integrationId: 'guild-1',
        channelId: 'channel-1',
        roles: [],
        tasks: []
      }
    });
  });

  it('rejects twitter schedule requests because they are not part of the union', () => {
    const result = scheduleAutomatedPostSchema.safeParse({
      sweepstakesId: 'sweep-1',
      type: 'POST_TO_TWITTER',
      request: { integrationId: 'int-1', text: 'Hello' }
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].code).toBe('invalid_union_discriminator');
  });

  it('rejects a request without a sweepstakes id', () => {
    const result = scheduleAutomatedPostSchema.safeParse({
      type: 'POST_TO_BLUESKY',
      request: { integrationId: 'int-1', text: 'Hello' }
    });

    expect(issuesOf(result)).toEqual([
      { path: 'sweepstakesId', message: 'Required' }
    ]);
  });

  it('validates the request against the schema for the selected type', () => {
    const result = scheduleAutomatedPostSchema.safeParse({
      sweepstakesId: 'sweep-1',
      type: 'POST_TO_DISCORD',
      request: { integrationId: 'int-1', text: 'Hello' }
    });

    expect(issuesOf(result)).toEqual([
      { path: 'request.channelId', message: 'Required' }
    ]);
  });
});

describe('automatedPostJobSchema', () => {
  it('parses a twitter job and defaults its request tasks', () => {
    const parsed = automatedPostJobSchema.parse(
      jobRow({
        type: 'POST_TO_TWITTER',
        request: { integrationId: 'int-1', text: 'Tweet' },
        response: { tweetId: '1', tweetUrl: 'https://x.com/a/status/1' }
      })
    );

    expect(parsed).toEqual({
      id: 'job-1',
      sweepstakesId: 'sweep-1',
      type: 'POST_TO_TWITTER',
      status: 'PENDING',
      runAt: RUN_AT,
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      request: { integrationId: 'int-1', text: 'Tweet', tasks: [] },
      response: { tweetId: '1', tweetUrl: 'https://x.com/a/status/1' }
    });
  });

  it('rejects twitter text longer than 280 characters', () => {
    const result = automatedPostJobSchema.safeParse(
      jobRow({
        type: 'POST_TO_TWITTER',
        request: { integrationId: 'int-1', text: 'a'.repeat(281) }
      })
    );

    expect(issuesOf(result)).toEqual([
      {
        path: 'request.text',
        message: 'String must contain at most 280 character(s)'
      }
    ]);
  });

  it('rejects empty twitter text with a tweet content message', () => {
    const result = automatedPostJobSchema.safeParse(
      jobRow({
        type: 'POST_TO_TWITTER',
        request: { integrationId: 'int-1', text: '' }
      })
    );

    expect(issuesOf(result)).toEqual([
      { path: 'request.text', message: 'Tweet content is required' }
    ]);
  });

  it('rejects an empty twitter integration id with an account selection message', () => {
    const result = automatedPostJobSchema.safeParse(
      jobRow({
        type: 'POST_TO_TWITTER',
        request: { integrationId: '', text: 'Tweet' }
      })
    );

    expect(issuesOf(result)).toEqual([
      { path: 'request.integrationId', message: 'Please select an account' }
    ]);
  });

  it('keeps a twitter image url without validating it as a url', () => {
    const parsed = automatedPostJobSchema.parse(
      jobRow({
        type: 'POST_TO_TWITTER',
        request: {
          integrationId: 'int-1',
          text: 'Tweet',
          imageUrl: 'banner.png',
          tasks: ['REPOST', 'LIKE']
        }
      })
    );

    expect(parsed.request).toEqual({
      integrationId: 'int-1',
      text: 'Tweet',
      imageUrl: 'banner.png',
      tasks: ['REPOST', 'LIKE']
    });
  });

  it('rejects twitter task names other than REPOST and LIKE', () => {
    const result = automatedPostJobSchema.safeParse(
      jobRow({
        type: 'POST_TO_TWITTER',
        request: { integrationId: 'int-1', text: 'Tweet', tasks: ['FOLLOW'] }
      })
    );

    expect(result.success).toBe(false);
    expect(issuesOf(result)[0].path).toBe('request.tasks.0');
  });

  it('accepts a null twitter response', () => {
    const parsed = automatedPostJobSchema.parse(
      jobRow({
        type: 'POST_TO_TWITTER',
        request: { integrationId: 'int-1', text: 'Tweet' },
        response: null
      })
    );

    expect(parsed.response).toBeNull();
  });

  it.each(['id', 'sweepstakesId', 'runAt', 'status', 'createdAt', 'updatedAt'])(
    'rejects a job row without %s',
    (key) => {
      const row: Record<string, unknown> = { ...jobRow() };
      delete row[key];

      const result = automatedPostJobSchema.safeParse(row);

      expect(result.success).toBe(false);
      expect(issuesOf(result)[0].path).toBe(key);
    }
  );

  it('rejects a twitter response whose tweet url is not a url', () => {
    const result = automatedPostJobSchema.safeParse(
      jobRow({
        type: 'POST_TO_TWITTER',
        request: { integrationId: 'int-1', text: 'Tweet' },
        response: { tweetUrl: 'nope' }
      })
    );

    expect(issuesOf(result)).toEqual([
      { path: 'response.tweetUrl', message: 'Invalid url' }
    ]);
  });

  it('coerces string dates into Date instances', () => {
    const parsed = automatedPostJobSchema.parse({
      ...jobRow(),
      runAt: '2026-05-01T10:00:00.000Z',
      createdAt: '2026-04-01T10:00:00.000Z',
      updatedAt: '2026-04-02T10:00:00.000Z'
    });

    expect(parsed.runAt).toEqual(RUN_AT);
    expect(parsed.createdAt).toEqual(CREATED_AT);
    expect(parsed.updatedAt).toEqual(UPDATED_AT);
  });

  it('accepts an undefined bluesky response', () => {
    const parsed = automatedPostJobSchema.parse({
      ...jobRow(),
      response: undefined
    });

    expect(parsed.response).toBeUndefined();
  });

  it('rejects a bluesky response whose post url is not a url', () => {
    const result = automatedPostJobSchema.safeParse(
      jobRow({ response: { postUri: 'at://x', postUrl: 'nope' } })
    );

    expect(issuesOf(result)).toEqual([
      { path: 'response.postUrl', message: 'Invalid url' }
    ]);
  });

  it('parses a discord job with a null response', () => {
    const parsed = automatedPostJobSchema.parse(
      jobRow({
        type: 'POST_TO_DISCORD',
        request: { integrationId: 'guild-1', channelId: 'channel-1' },
        response: null
      })
    );

    expect(parsed).toMatchObject({
      type: 'POST_TO_DISCORD',
      request: {
        integrationId: 'guild-1',
        channelId: 'channel-1',
        roles: [],
        tasks: []
      },
      response: null
    });
  });

  it('rejects an unknown job status', () => {
    const result = automatedPostJobSchema.safeParse(
      jobRow({ status: 'RUNNING' as AutomatedPostJob['status'] })
    );

    expect(result.success).toBe(false);
    expect(issuesOf(result)[0].path).toBe('status');
  });
});

describe('toAutomatedPostJobSchema', () => {
  it('returns the parsed job for a valid row', () => {
    const job = toAutomatedPostJobSchema(
      jobRow({
        request: { integrationId: 'int-1', text: 'Hi', tasks: ['LIKE'] }
      })
    );

    expect(job).toEqual({
      id: 'job-1',
      sweepstakesId: 'sweep-1',
      type: 'POST_TO_BLUESKY',
      status: 'PENDING',
      runAt: RUN_AT,
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      request: { integrationId: 'int-1', text: 'Hi', tasks: ['LIKE'] },
      response: null
    });
  });

  it('throws a VALIDATION_ERROR whose message is the serialized zod issues', () => {
    const error = catchError(() =>
      toAutomatedPostJobSchema(jobRow({ request: null }))
    );

    expect(error).toBeInstanceOf(ApplicationError);
    const appError = error as ApplicationError;
    expect(appError.code).toBe('VALIDATION_ERROR');
    expect(appError.cause).toBeInstanceOf(ZodError);
    expect(JSON.parse(appError.message)).toEqual([
      expect.objectContaining({
        code: 'invalid_type',
        expected: 'object',
        received: 'null',
        path: ['request']
      })
    ]);
  });
});

describe('toAutomatedPostJobCreateInput', () => {
  it('connects the sweepstakes and creates a pending job with the request', () => {
    const request = {
      integrationId: 'int-1',
      text: 'Hello',
      tasks: ['REPOST' as const]
    };

    const data = toAutomatedPostJobCreateInput({
      sweepstakesId: 'sweep-1',
      type: 'POST_TO_BLUESKY',
      request,
      runAt: RUN_AT
    });

    expect(data).toEqual({
      sweepstakes: { connect: { id: 'sweep-1' } },
      type: 'POST_TO_BLUESKY',
      status: 'PENDING',
      runAt: RUN_AT,
      request
    });
  });
});

describe('toPostToDiscordResponseSchema', () => {
  it('returns the parsed response for valid data', () => {
    expect(
      toPostToDiscordResponseSchema({ messageId: 'msg-1', extra: true })
    ).toEqual({ messageId: 'msg-1' });
  });

  it('throws a VALIDATION_ERROR with a fixed message for invalid data', () => {
    const error = catchError(() =>
      toPostToDiscordResponseSchema({ messageUrl: 'nope' })
    );

    expect(error).toBeInstanceOf(ApplicationError);
    expect(error).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Invalid Post to Discord response data'
    });
    expect((error as ApplicationError).cause).toBeInstanceOf(ZodError);
  });

  it('throws for a non-object payload', () => {
    expect(() => toPostToDiscordResponseSchema('oops')).toThrow(
      'Invalid Post to Discord response data'
    );
  });
});

describe('asPostToDiscordResponseSchema', () => {
  it('returns the same object it receives', () => {
    const response = { messageId: 'msg-1' };

    expect(asPostToDiscordResponseSchema(response)).toBe(response);
  });
});
