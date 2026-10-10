import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Prisma } from '@giveaway/db-model';
import z from 'zod';
import { procedure } from '../procedures';
import { ApplicationError } from '@giveaway/util-errors';
import { prismaMock, knownRequestError } from '@giveaway/testing-server/prisma';
import {
  authMock,
  createSession,
  signIn,
  TEST_USER
} from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { nextCacheMock } from '@giveaway/testing-server/next-cache';

const EXPIRED = '2000-01-01T00:00:00.000Z';

const redirectError = () =>
  Object.assign(new Error('NEXT_REDIRECT'), {
    digest: 'NEXT_REDIRECT;replace;/somewhere;307;'
  });

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('procedure', () => {
  describe('when authorization is required', () => {
    it('returns UNAUTHORIZED when there is no session', async () => {
      const handler = vi.fn(async () => 'data');
      const run = procedure()
        .authorization({ required: true })
        .handler(handler);

      const result = await run();

      expect(expectFailure(result, 'UNAUTHORIZED')).toEqual({
        code: 'UNAUTHORIZED',
        message: 'Invalid session',
        cause: undefined,
        data: undefined
      });
      expect(handler).not.toHaveBeenCalled();
    });

    it('returns UNAUTHORIZED when the session user has no id', async () => {
      signIn({ id: '' });
      const run = procedure()
        .authorization({ required: true })
        .handler(async () => 'data');

      const result = await run();

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
    });

    it('returns UNAUTHORIZED when the session has no user', async () => {
      authMock.mockResolvedValue({
        expires: '2999-01-01T00:00:00.000Z'
      } as unknown as Awaited<ReturnType<typeof authMock>>);
      const run = procedure()
        .authorization({ required: true })
        .handler(async () => 'data');

      const result = await run();

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
    });

    it('returns UNAUTHORIZED when the session has expired', async () => {
      authMock.mockResolvedValue(createSession({}, EXPIRED));
      const run = procedure()
        .authorization({ required: true })
        .handler(async () => 'data');

      const result = await run();

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
    });

    it('returns UNAUTHORIZED when the session expiry is not a valid date', async () => {
      authMock.mockResolvedValue(createSession({}, 'not-a-date'));
      const run = procedure()
        .authorization({ required: true })
        .handler(async () => 'data');

      const result = await run();

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
    });

    it('treats a session expiring at exactly the current time as invalid', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2030-06-01T12:00:00.000Z'));
      authMock.mockResolvedValue(createSession({}, '2030-06-01T12:00:00.000Z'));
      const run = procedure()
        .authorization({ required: true })
        .handler(async () => 'data');

      const result = await run();

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
    });

    it('accepts a session expiring one millisecond in the future', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2030-06-01T12:00:00.000Z'));
      authMock.mockResolvedValue(createSession({}, '2030-06-01T12:00:00.001Z'));
      const run = procedure()
        .authorization({ required: true })
        .handler(async () => 'data');

      const result = await run();

      expect(expectOk(result)).toBe('data');
    });

    it('logs the unauthorized application error', async () => {
      const run = procedure()
        .authorization({ required: true })
        .handler(async () => 'data');

      await run();

      expect(console.error).toHaveBeenCalledWith(
        'Application error:',
        expect.objectContaining({ code: 'UNAUTHORIZED' })
      );
    });

    it('passes the session user and prisma client to the handler', async () => {
      const session = signIn();
      const handler = vi.fn(async () => 'data');
      const run = procedure()
        .authorization({ required: true })
        .handler(handler);

      await run();

      expect(handler).toHaveBeenCalledWith({
        db: prismaMock,
        user: session.user,
        input: undefined
      });
    });

    it('returns the handler result as ok data', async () => {
      signIn();
      const run = procedure()
        .authorization({ required: true })
        .handler(async () => ({ value: 42 }));

      const result = await run();

      expect(result).toEqual({ ok: true, data: { value: 42 } });
    });

    it('calls auth exactly once per invocation', async () => {
      signIn();
      const run = procedure()
        .authorization({ required: true })
        .handler(async () => 'data');

      await run();

      expect(authMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('when the authorization config has no boolean required flag', () => {
    it.each([{}, { required: undefined }, { required: 'false' }])(
      'fails the call for %o without running the handler',
      async (config) => {
        signIn();
        const handler = vi.fn(async () => 'data');
        const run = procedure()
          .authorization(config as unknown as { required: boolean })
          .handler(handler);

        const result = await run();

        expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
          'authorization requires a boolean `required` flag'
        );
        expect(handler).not.toHaveBeenCalled();
      }
    );
  });

  describe('when authorization is optional', () => {
    it('passes a null user when there is no session', async () => {
      const handler = vi.fn(async () => 'data');
      const run = procedure()
        .authorization({ required: false })
        .handler(handler);

      const result = await run();

      expect(expectOk(result)).toBe('data');
      expect(handler).toHaveBeenCalledWith({
        db: prismaMock,
        user: null,
        input: undefined
      });
    });

    it('passes the session user when the session is valid', async () => {
      signIn({ name: 'Optional User' });
      const handler = vi.fn(async () => 'data');
      const run = procedure()
        .authorization({ required: false })
        .handler(handler);

      await run();

      expect(handler).toHaveBeenCalledWith({
        db: prismaMock,
        user: { ...TEST_USER, name: 'Optional User' },
        input: undefined
      });
    });

    it('passes a null user when the session has expired', async () => {
      authMock.mockResolvedValue(createSession({}, EXPIRED));
      const handler = vi.fn(async () => 'data');
      const run = procedure()
        .authorization({ required: false })
        .handler(handler);

      await run();

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ user: null })
      );
    });
  });

  describe('input validation', () => {
    const schema = z.object({
      count: z.coerce.number().int(),
      label: z.string().default('none')
    });

    it('passes undefined input to the handler when no schema is configured', async () => {
      const handler = vi.fn(async () => 'data');
      const run = procedure()
        .authorization({ required: false })
        .handler(handler) as unknown as (input: unknown) => Promise<unknown>;

      await run({ ignored: true });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ input: undefined })
      );
    });

    it('passes parsed data with coercions and defaults applied to the handler', async () => {
      const handler = vi.fn(async () => 'data');
      const run = procedure()
        .authorization({ required: false })
        .input(schema)
        .handler(handler);

      await run({ count: '5' } as unknown as Parameters<typeof run>[0]);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ input: { count: 5, label: 'none' } })
      );
    });

    it('strips unknown keys from the input before calling the handler', async () => {
      const handler = vi.fn(async () => 'data');
      const run = procedure()
        .authorization({ required: false })
        .input(schema)
        .handler(handler);

      await run({ count: 1, label: 'a', extra: 'x' } as unknown as Parameters<
        typeof run
      >[0]);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ input: { count: 1, label: 'a' } })
      );
    });

    it('returns UNPROCESSABLE_CONTENT with the zod message when parsing fails', async () => {
      const handler = vi.fn(async () => 'data');
      const run = procedure()
        .authorization({ required: false })
        .input(schema)
        .handler(handler);
      const bad = { count: 'abc' };
      const zodMessage = schema.safeParse(bad).error?.message;

      const result = await run(bad as unknown as Parameters<typeof run>[0]);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toBe(
        `Input validation failed: ${zodMessage}`
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it('checks authorization before validating input', async () => {
      const run = procedure()
        .authorization({ required: true })
        .input(schema)
        .handler(async () => 'data');

      const result = await run({ count: 'abc' } as unknown as Parameters<
        typeof run
      >[0]);

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
    });
  });

  describe('output validation', () => {
    it('strips the keys that the output schema does not declare', async () => {
      const run = procedure()
        .authorization({ required: false })
        .output(z.object({ id: z.string() }))
        .handler(
          async () => ({ id: '1', extra: true }) as unknown as { id: string }
        );

      const result = await run();

      expect(expectOk(result)).toStrictEqual({ id: '1' });
    });

    it('applies output schema transforms to the returned data', async () => {
      const run = procedure()
        .authorization({ required: false })
        .output(z.object({ n: z.number().transform((n) => n * 2) }))
        .handler(async () => ({ n: 2 }));

      const result = await run();

      expect(expectOk(result)).toStrictEqual({ n: 4 });
    });

    it('returns the handler data unchanged when no output schema is set', async () => {
      const data = { id: '1', extra: true };
      const run = procedure()
        .authorization({ required: false })
        .handler(async () => data);

      const result = await run();

      expect(expectOk(result)).toBe(data);
    });

    it('returns UNPROCESSABLE_CONTENT when the handler output does not match', async () => {
      const outputSchema = z.object({ id: z.string() });
      const run = procedure()
        .authorization({ required: false })
        .output(outputSchema)
        .handler(async () => ({ id: 1 }) as unknown as { id: string });
      const zodMessage = outputSchema.safeParse({ id: 1 }).error?.message;

      const result = await run();
      const failure = expectFailure(result, 'UNPROCESSABLE_CONTENT');

      expect(failure.message).toBe(`Output validation failed: ${zodMessage}`);
      expect(failure.cause).toBeInstanceOf(z.ZodError);
    });

    it('logs the invalid output and the zod error', async () => {
      const run = procedure()
        .authorization({ required: false })
        .output(z.string())
        .handler(async () => 7 as unknown as string);

      await run();

      expect(console.error).toHaveBeenCalledWith(
        'Output validation error:',
        7,
        expect.any(z.ZodError)
      );
    });
  });

  describe('caching', () => {
    it('does not use unstable_cache when no cache config is set', async () => {
      const run = procedure()
        .authorization({ required: false })
        .handler(async () => 'data');

      await run();

      expect(nextCacheMock.unstable_cache).not.toHaveBeenCalled();
    });

    it('wraps the handler with key parts, tags and revalidate', async () => {
      const handler = vi.fn(async () => 'cached');
      const run = procedure()
        .authorization({ required: false })
        .input(z.object({ id: z.string() }))
        .cache({ keyParts: ['key'], tags: ['tag-a'], revalidate: 60 })
        .handler(handler);

      const result = await run({ id: 'abc' });

      expect(expectOk(result)).toBe('cached');
      expect(nextCacheMock.unstable_cache).toHaveBeenCalledWith(
        expect.any(Function),
        ['key'],
        { tags: ['tag-a'], revalidate: 60 }
      );
      expect(handler).toHaveBeenCalledWith({
        db: prismaMock,
        user: null,
        input: { id: 'abc' }
      });
    });

    it('passes undefined key parts when only tags are configured', async () => {
      const run = procedure()
        .authorization({ required: false })
        .cache({ tags: ['tag-a'] })
        .handler(async () => 'data');

      await run();

      expect(nextCacheMock.unstable_cache).toHaveBeenCalledWith(
        expect.any(Function),
        undefined,
        { tags: ['tag-a'], revalidate: undefined }
      );
    });

    it('passes cache options with undefined tags when only key parts are configured', async () => {
      const run = procedure()
        .authorization({ required: false })
        .cache({ keyParts: ['k'] })
        .handler(async () => 'data');

      await run();

      expect(nextCacheMock.unstable_cache).toHaveBeenCalledWith(
        expect.any(Function),
        ['k'],
        { tags: undefined, revalidate: undefined }
      );
    });

    it('drops the revalidate option when neither tags nor key parts are configured', async () => {
      const run = procedure()
        .authorization({ required: false })
        .cache({ revalidate: 60 })
        .handler(async () => 'data');

      await run();

      expect(nextCacheMock.unstable_cache).toHaveBeenCalledWith(
        expect.any(Function),
        undefined,
        undefined
      );
    });

    it('treats an empty key parts array as configured', async () => {
      const run = procedure()
        .authorization({ required: false })
        .cache({ keyParts: [] })
        .handler(async () => 'data');

      await run();

      expect(nextCacheMock.unstable_cache).toHaveBeenCalledWith(
        expect.any(Function),
        [],
        { tags: undefined, revalidate: undefined }
      );
    });

    it('passes the session user to the handler through the cache wrapper', async () => {
      const session = signIn();
      const handler = vi.fn(async () => 'cached');
      const run = procedure()
        .authorization({ required: true })
        .input(z.object({ id: z.string() }))
        .cache({ keyParts: ['k'], tags: ['t'] })
        .handler(handler);

      await run({ id: 'abc' });

      expect(handler).toHaveBeenCalledWith({
        db: prismaMock,
        user: session.user,
        input: { id: 'abc' }
      });
    });

    it('returns the cached value without calling the handler on a cache hit', async () => {
      nextCacheMock.unstable_cache.mockImplementation(
        () => async () => 'from-cache'
      );
      const handler = vi.fn(async () => 'fresh');
      const run = procedure()
        .authorization({ required: false })
        .cache({ tags: ['t'] })
        .handler(handler);

      const result = await run();

      expect(expectOk(result)).toBe('from-cache');
      expect(handler).not.toHaveBeenCalled();
    });

    it('calls the cached function with the parsed input', async () => {
      const cachedFn = vi.fn(async () => 'from-cache');
      nextCacheMock.unstable_cache.mockImplementation(() => cachedFn);
      const run = procedure()
        .authorization({ required: false })
        .input(z.object({ id: z.string() }))
        .cache({ tags: ['t'] })
        .handler(async () => 'fresh');

      await run({ id: 'abc' });

      expect(cachedFn).toHaveBeenCalledWith({ id: 'abc' });
    });

    it('resolves a cache config function with the db, user and input', async () => {
      const session = signIn();
      const cacheConfig = vi.fn(() => ({ tags: ['dynamic'] }));
      const run = procedure()
        .authorization({ required: true })
        .input(z.object({ id: z.string() }))
        .cache(cacheConfig)
        .handler(async () => 'data');

      await run({ id: 'abc' });

      expect(cacheConfig).toHaveBeenCalledWith({
        db: prismaMock,
        user: session.user,
        input: { id: 'abc' }
      });
      expect(nextCacheMock.unstable_cache).toHaveBeenCalledWith(
        expect.any(Function),
        undefined,
        { tags: ['dynamic'], revalidate: undefined }
      );
    });

    it('skips caching when the cache config function returns undefined', async () => {
      const handler = vi.fn(async () => 'direct');
      const run = procedure()
        .authorization({ required: false })
        .cache(() => undefined)
        .handler(handler);

      const result = await run();

      expect(expectOk(result)).toBe('direct');
      expect(nextCacheMock.unstable_cache).not.toHaveBeenCalled();
      expect(handler).toHaveBeenCalledWith({
        db: prismaMock,
        user: null,
        input: undefined
      });
    });

    it('keeps the cache config when the input schema is set afterwards', async () => {
      const run = procedure()
        .authorization({ required: false })
        .cache({ tags: ['kept'] })
        .input(z.string())
        .handler(async () => 'data');

      await run('x');

      expect(nextCacheMock.unstable_cache).toHaveBeenCalledWith(
        expect.any(Function),
        undefined,
        { tags: ['kept'], revalidate: undefined }
      );
    });

    it('keeps the cache config when the output schema is set afterwards', async () => {
      const run = procedure()
        .authorization({ required: false })
        .cache({ tags: ['kept'] })
        .output(z.string())
        .handler(async () => 'data');

      await run();

      expect(nextCacheMock.unstable_cache).toHaveBeenCalledTimes(1);
      expect(nextCacheMock.unstable_cache).toHaveBeenCalledWith(
        expect.any(Function),
        undefined,
        { tags: ['kept'], revalidate: undefined }
      );
    });
  });

  describe('invalidation', () => {
    it('revalidates every returned tag with the max profile', async () => {
      const run = procedure()
        .authorization({ required: false })
        .invalidate(async () => ['tag-a', 'tag-b'])
        .handler(async () => 'data');

      await run();

      expect(nextCacheMock.revalidateTag).toHaveBeenNthCalledWith(
        1,
        'tag-a',
        'max'
      );
      expect(nextCacheMock.revalidateTag).toHaveBeenNthCalledWith(
        2,
        'tag-b',
        'max'
      );
      expect(nextCacheMock.revalidateTag).toHaveBeenCalledTimes(2);
    });

    it('passes the user, db, input and output to the invalidate function', async () => {
      const session = signIn();
      const invalidate = vi.fn(async () => []);
      const run = procedure()
        .authorization({ required: true })
        .input(z.object({ id: z.string() }))
        .output(z.object({ saved: z.boolean() }))
        .invalidate(invalidate)
        .handler(async () => ({ saved: true }));

      await run({ id: 'abc' });

      expect(invalidate).toHaveBeenCalledWith({
        user: session.user,
        db: prismaMock,
        input: { id: 'abc' },
        output: { saved: true }
      });
    });

    it('passes the parsed output to the invalidate function', async () => {
      const invalidate = vi.fn(async () => []);
      const run = procedure()
        .authorization({ required: false })
        .output(z.object({ saved: z.boolean() }))
        .invalidate(invalidate)
        .handler(
          async () =>
            ({ saved: true, extra: 1 }) as unknown as { saved: boolean }
        );

      await run();

      expect(invalidate).toHaveBeenCalledWith(
        expect.objectContaining({ output: { saved: true } })
      );
    });

    it('does not revalidate anything when no tags are returned', async () => {
      const run = procedure()
        .authorization({ required: false })
        .invalidate(async () => [])
        .handler(async () => 'data');

      const result = await run();

      expect(expectOk(result)).toBe('data');
      expect(nextCacheMock.revalidateTag).not.toHaveBeenCalled();
    });

    it('does not invalidate when the handler throws', async () => {
      const invalidate = vi.fn(async () => ['tag']);
      const run = procedure()
        .authorization({ required: false })
        .invalidate(invalidate)
        .handler(async () => {
          throw new Error('fail');
        });

      await run();

      expect(invalidate).not.toHaveBeenCalled();
      expect(nextCacheMock.revalidateTag).not.toHaveBeenCalled();
    });

    it('does not invalidate when output validation fails', async () => {
      const invalidate = vi.fn(async () => ['tag']);
      const run = procedure()
        .authorization({ required: false })
        .output(z.string())
        .invalidate(invalidate)
        .handler(async () => 1 as unknown as string);

      await run();

      expect(invalidate).not.toHaveBeenCalled();
    });

    it('returns a failure when the invalidate function throws', async () => {
      const run = procedure()
        .authorization({ required: false })
        .invalidate(async () => {
          throw new Error('invalidate failed');
        })
        .handler(async () => 'data');

      const result = await run();

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'invalidate failed'
      );
    });

    it('drops the invalidate config when the input schema is set afterwards', async () => {
      const invalidate = vi.fn(async () => ['tag']);
      const run = procedure()
        .authorization({ required: false })
        .invalidate(invalidate)
        .input(z.string())
        .handler(async () => 'data');

      await run('x');

      expect(invalidate).not.toHaveBeenCalled();
    });

    it('drops the invalidate config when the output schema is set afterwards', async () => {
      const invalidate = vi.fn(async () => ['tag']);
      const run = procedure()
        .authorization({ required: false })
        .invalidate(invalidate)
        .output(z.string())
        .handler(async () => 'data');

      await run();

      expect(invalidate).not.toHaveBeenCalled();
    });

    it('keeps the invalidate config when the cache config is set afterwards', async () => {
      const run = procedure()
        .authorization({ required: false })
        .invalidate(async () => ['kept'])
        .cache({ tags: ['t'] })
        .handler(async () => 'data');

      await run();

      expect(nextCacheMock.revalidateTag).toHaveBeenCalledWith('kept', 'max');
    });
  });

  describe('error handling', () => {
    it('maps an ApplicationError to a failure with its code, message, cause and data', async () => {
      const cause = new Error('root');
      const run = procedure()
        .authorization({ required: false })
        .handler(async () => {
          throw new ApplicationError({
            code: 'CONFLICT',
            message: 'Already exists',
            cause,
            data: { field: 'slug' }
          });
        });

      const result = await run();

      expect(result).toEqual({
        ok: false,
        data: {
          code: 'CONFLICT',
          message: 'Already exists',
          cause,
          data: { field: 'slug' }
        }
      });
    });

    it('logs non-silent application errors', async () => {
      const error = new ApplicationError({ code: 'FORBIDDEN', message: 'No' });
      const run = procedure()
        .authorization({ required: false })
        .handler(async () => {
          throw error;
        });

      await run();

      expect(console.error).toHaveBeenCalledWith('Application error:', error);
    });

    it('does not log silent application errors', async () => {
      const run = procedure()
        .authorization({ required: false })
        .handler(async () => {
          throw new ApplicationError({
            code: 'FORBIDDEN',
            message: 'No',
            silent: true
          });
        });

      const result = await run();

      expect(expectFailure(result, 'FORBIDDEN').message).toBe('No');
      expect(console.error).not.toHaveBeenCalled();
    });

    it('maps a prisma P2025 error to NOT_FOUND', async () => {
      const run = procedure()
        .authorization({ required: false })
        .handler(async () => {
          throw knownRequestError('P2025');
        });

      const result = await run();

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Unable to process your request. The item may no longer exist. Give us a minute before you try again.'
      );
    });

    it('maps other prisma known errors to INTERNAL_SERVER_ERROR with a reference code', async () => {
      const run = procedure()
        .authorization({ required: false })
        .handler(async () => {
          throw knownRequestError('P2002');
        });

      const result = await run();

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toMatch(
        /^We f\*\*\*\*d up\. Try again or contact giveaway\.dog support staff and provide the following error code: [A-Za-z0-9_-]{6}$/
      );
    });

    it('maps a prisma validation error to BAD_REQUEST', async () => {
      const run = procedure()
        .authorization({ required: false })
        .handler(async () => {
          throw new Prisma.PrismaClientValidationError('bad', {
            clientVersion: 'test'
          });
        });

      const result = await run();

      expect(expectFailure(result, 'BAD_REQUEST').message).toBe(
        'Invalid data provided. Please check your input and try again. If the problem persists, contact support.'
      );
    });

    it('maps a prisma error thrown by the db client to a failure', async () => {
      signIn();
      prismaMock.user.findUniqueOrThrow.mockRejectedValue(
        knownRequestError('P2025')
      );
      const run = procedure()
        .authorization({ required: true })
        .handler(async ({ db, user }) =>
          db.user.findUniqueOrThrow({ where: { id: user.id } })
        );

      const result = await run();

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Unable to process your request. The item may no longer exist. Give us a minute before you try again.'
      );
      expect(prismaMock.user.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: TEST_USER.id }
      });
    });

    it('maps a generic error to INTERNAL_SERVER_ERROR with its message, cause and data', async () => {
      const error = Object.assign(new Error('Exploded', { cause: 'fuse' }), {
        data: { extra: 1 }
      });
      const run = procedure()
        .authorization({ required: false })
        .handler(async () => {
          throw error;
        });

      const result = await run();

      expect(result).toEqual({
        ok: false,
        data: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Exploded',
          cause: 'fuse',
          data: { extra: 1 }
        }
      });
    });

    it('uses a default message when the thrown object has no message', async () => {
      const run = procedure()
        .authorization({ required: false })
        .handler(async () => {
          throw {};
        });

      const result = await run();

      expect(result).toEqual({
        ok: false,
        data: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
          cause: undefined,
          data: undefined
        }
      });
    });

    it('maps an error thrown by auth to INTERNAL_SERVER_ERROR', async () => {
      authMock.mockRejectedValue(new Error('auth down'));
      const run = procedure()
        .authorization({ required: false })
        .handler(async () => 'data');

      const result = await run();

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'auth down'
      );
    });

    it('re-throws Next.js redirect errors', async () => {
      const error = redirectError();
      const run = procedure()
        .authorization({ required: false })
        .handler(async () => {
          throw error;
        });

      await expect(run()).rejects.toBe(error);
    });

    it('rejects with a TypeError when the handler throws a string', async () => {
      const run = procedure()
        .authorization({ required: false })
        .handler(async () => {
          throw 'plain string';
        });

      await expect(run()).rejects.toThrow(TypeError);
    });

    it('rejects with a TypeError when the handler throws null', async () => {
      const run = procedure()
        .authorization({ required: false })
        .handler(async () => {
          throw null;
        });

      await expect(run()).rejects.toThrow(TypeError);
    });
  });

  describe('network delay simulation', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.spyOn(Math, 'random').mockReturnValue(0);
      vi.stubEnv('E2E_LOGIN_SECRET', undefined);
      vi.stubEnv('VERCEL_ENV', undefined);
      vi.stubEnv('VERCEL_TARGET_ENV', undefined);
    });

    it('waits before authenticating in development', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      const run = procedure()
        .authorization({ required: false })
        .handler(async () => 'data');

      const pending = run();
      await vi.advanceTimersByTimeAsync(199);
      const calledBeforeDelay = authMock.mock.calls.length;
      await vi.advanceTimersByTimeAsync(1);
      const result = await pending;

      expect(calledBeforeDelay).toBe(0);
      expect(authMock).toHaveBeenCalledTimes(1);
      expect(expectOk(result)).toBe('data');
    });

    it('does not wait in development when the e2e gate is open', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      vi.stubEnv('E2E_LOGIN_SECRET', 'e2e-secret-with-at-least-32-chars');
      const run = procedure()
        .authorization({ required: false })
        .handler(async () => 'data');

      const pending = run();
      await vi.advanceTimersByTimeAsync(0);

      expect(authMock).toHaveBeenCalledTimes(1);
      expect(expectOk(await pending)).toBe('data');
    });

    it('does not wait outside development', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      const run = procedure()
        .authorization({ required: false })
        .handler(async () => 'data');

      const pending = run();
      await vi.advanceTimersByTimeAsync(0);

      expect(authMock).toHaveBeenCalledTimes(1);
      expect(expectOk(await pending)).toBe('data');
    });
  });
});
