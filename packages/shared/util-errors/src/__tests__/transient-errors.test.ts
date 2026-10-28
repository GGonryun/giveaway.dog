import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  ApplicationError,
  isTransientError,
  isTransientHttpStatus,
  retryAfterFromHeaders,
  retryAfterOf,
  toTransientHttpError
} from '../index';

const NOW = Date.UTC(2026, 5, 1, 12, 0, 0);

const withField = (key: string, value: unknown) =>
  Object.assign(new Error('failed'), { [key]: value });

afterEach(() => {
  vi.useRealTimers();
});

describe('isTransientHttpStatus', () => {
  it.each([408, 429, 500, 502, 503, 504, 599])('is true for %i', (status) => {
    expect(isTransientHttpStatus(status)).toBe(true);
  });

  it.each([200, 400, 401, 403, 404, 409, 428, 430, 499, 600])(
    'is false for %i',
    (status) => {
      expect(isTransientHttpStatus(status)).toBe(false);
    }
  );
});

describe('retryAfterFromHeaders', () => {
  it('reads a Retry-After in seconds from now', () => {
    expect(
      retryAfterFromHeaders(new Headers({ 'retry-after': '30' }), NOW)
    ).toBe(NOW + 30_000);
  });

  it('reads a Retry-After date', () => {
    expect(
      retryAfterFromHeaders(
        new Headers({ 'retry-after': 'Mon, 01 Jun 2026 12:05:00 GMT' }),
        NOW
      )
    ).toBe(NOW + 300_000);
  });

  it('reads an X reset time in epoch seconds', () => {
    expect(
      retryAfterFromHeaders(
        new Headers({ 'x-rate-limit-reset': String(NOW / 1000 + 90) }),
        NOW
      )
    ).toBe(NOW + 90_000);
  });

  it('takes the later of the two times', () => {
    expect(
      retryAfterFromHeaders(
        new Headers({
          'retry-after': '120',
          'x-rate-limit-reset': String(NOW / 1000 + 60)
        }),
        NOW
      )
    ).toBe(NOW + 120_000);
    expect(
      retryAfterFromHeaders(
        new Headers({
          'retry-after': '60',
          'x-rate-limit-reset': String(NOW / 1000 + 120)
        }),
        NOW
      )
    ).toBe(NOW + 120_000);
  });

  it.each(['30s', 'a30', '3 0'])(
    'does not read %s as a number of seconds',
    (value) => {
      expect(
        retryAfterFromHeaders(new Headers({ 'retry-after': value }), NOW)
      ).toBeUndefined();
      expect(
        retryAfterFromHeaders(new Headers({ 'x-rate-limit-reset': value }), NOW)
      ).toBeUndefined();
    }
  );

  it('ignores values it cannot read', () => {
    expect(
      retryAfterFromHeaders(
        new Headers({ 'retry-after': 'soon', 'x-rate-limit-reset': 'later' }),
        NOW
      )
    ).toBeUndefined();
  });

  it('returns undefined without the headers', () => {
    expect(retryAfterFromHeaders(new Headers(), NOW)).toBeUndefined();
  });

  it('counts from the current time by default', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);

    expect(retryAfterFromHeaders(new Headers({ 'retry-after': '5' }))).toBe(
      NOW + 5_000
    );
  });
});

describe('toTransientHttpError', () => {
  it.each([
    [408, 'TIMEOUT'],
    [429, 'TOO_MANY_REQUESTS'],
    [500, 'BAD_GATEWAY'],
    [502, 'BAD_GATEWAY'],
    [503, 'SERVICE_UNAVAILABLE'],
    [504, 'GATEWAY_TIMEOUT'],
    [520, 'BAD_GATEWAY']
  ] as const)('maps %i to %s', (status, code) => {
    const error = toTransientHttpError(
      new Response(null, { status, statusText: 'Status text' }),
      'Failed to call'
    );

    expect(error).toBeInstanceOf(ApplicationError);
    expect(error.code).toBe(code);
    expect(error.message).toBe(`Failed to call: ${status} Status text`);
    expect(error.data).toStrictEqual({ status });
  });

  it('omits an empty status text from the message', () => {
    const error = toTransientHttpError(
      new Response(null, { status: 500 }),
      'Failed to call'
    );

    expect(error.message).toBe('Failed to call: 500');
  });

  it('keeps the retry time of the response', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);

    const error = toTransientHttpError(
      new Response(null, {
        status: 429,
        headers: { 'retry-after': '45' }
      }),
      'Failed to call'
    );

    expect(error.data).toEqual({ status: 429, retryAfter: NOW + 45_000 });
  });
});

describe('isTransientError', () => {
  it.each([
    ['TIMEOUT'],
    ['TOO_MANY_REQUESTS'],
    ['SERVICE_UNAVAILABLE'],
    ['GATEWAY_TIMEOUT']
  ] as const)('is true for an application error with code %s', (code) => {
    expect(isTransientError(new ApplicationError({ code, message: 'x' }))).toBe(
      true
    );
  });

  it.each([
    ['BAD_REQUEST'],
    ['NOT_FOUND'],
    ['FORBIDDEN'],
    ['INTERNAL_SERVER_ERROR'],
    ['BAD_GATEWAY'],
    ['VALIDATION_ERROR']
  ] as const)('is false for an application error with code %s', (code) => {
    expect(isTransientError(new ApplicationError({ code, message: 'x' }))).toBe(
      false
    );
  });

  it('is true for an application error with a retry time', () => {
    expect(
      isTransientError(
        new ApplicationError({
          code: 'BAD_REQUEST',
          message: 'x',
          data: { retryAfter: NOW }
        })
      )
    ).toBe(true);
  });

  it('is true for an application error made from a transient response', () => {
    expect(
      isTransientError(
        new ApplicationError({
          code: 'BAD_GATEWAY',
          message: 'x',
          data: { status: 502 }
        })
      )
    ).toBe(true);
  });

  it('is false for an application error with another status', () => {
    expect(
      isTransientError(
        new ApplicationError({
          code: 'BAD_GATEWAY',
          message: 'x',
          data: { status: 400 }
        })
      )
    ).toBe(false);
    expect(
      isTransientError(
        new ApplicationError({
          code: 'BAD_GATEWAY',
          message: 'x',
          data: { status: '502' }
        })
      )
    ).toBe(false);
  });

  it('is true for a failed fetch', () => {
    expect(isTransientError(new TypeError('fetch failed'))).toBe(true);
  });

  it('is false for another error that says the fetch failed', () => {
    expect(isTransientError(new Error('fetch failed'))).toBe(false);
  });

  it('is false for another type error', () => {
    expect(isTransientError(new TypeError('x is not a function'))).toBe(false);
  });

  it.each(['TimeoutError', 'AbortError', 'PrismaClientInitializationError'])(
    'is true for an error named %s',
    (name) => {
      expect(isTransientError(withField('name', name))).toBe(true);
    }
  );

  it.each([
    'ECONNRESET',
    'ECONNREFUSED',
    'ECONNABORTED',
    'ETIMEDOUT',
    'EPIPE',
    'EAI_AGAIN',
    'UND_ERR_SOCKET',
    'UND_ERR_CONNECT_TIMEOUT',
    'UND_ERR_HEADERS_TIMEOUT',
    'UND_ERR_BODY_TIMEOUT',
    'P1001',
    'P1002',
    'P1008',
    'P1017',
    'P2024',
    'P2034'
  ])('is true for an error with code %s', (code) => {
    expect(isTransientError(withField('code', code))).toBe(true);
  });

  it.each(['P2002', 'P2025', 'ENOENT'])(
    'is false for an error with code %s',
    (code) => {
      expect(isTransientError(withField('code', code))).toBe(false);
    }
  );

  it.each([408, 429, 500, 503])(
    'is true for an error with status %i',
    (status) => {
      expect(isTransientError(withField('status', status))).toBe(true);
    }
  );

  it.each([400, 404, '500'])(
    'is false for an error with status %s',
    (status) => {
      expect(isTransientError(withField('status', status))).toBe(false);
    }
  );

  it('follows the cause of an error', () => {
    expect(
      isTransientError(
        new Error('wrapped', { cause: new TypeError('fetch failed') })
      )
    ).toBe(true);
    expect(
      isTransientError(
        new ApplicationError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'wrapped',
          cause: withField('status', 503)
        })
      )
    ).toBe(true);
  });

  it('stops following causes after five levels', () => {
    const nest = (depth: number): unknown =>
      depth === 0
        ? new TypeError('fetch failed')
        : new Error('wrapped', { cause: nest(depth - 1) });

    expect(isTransientError(nest(5))).toBe(true);
    expect(isTransientError(nest(6))).toBe(false);
  });

  it.each([undefined, null, 'fetch failed', 503])(
    'is false for %s',
    (value) => {
      expect(isTransientError(value)).toBe(false);
    }
  );

  it('is false for a plain error', () => {
    expect(isTransientError(new Error('nope'))).toBe(false);
  });
});

describe('retryAfterOf', () => {
  it('reads the retry time of an application error', () => {
    expect(
      retryAfterOf(
        new ApplicationError({
          code: 'TOO_MANY_REQUESTS',
          message: 'x',
          data: { retryAfter: NOW }
        })
      )
    ).toBe(NOW);
  });

  it('reads a retry time field', () => {
    expect(retryAfterOf(withField('retryAfter', NOW))).toBe(NOW);
  });

  it('ignores a retry time that is not a number', () => {
    expect(retryAfterOf(withField('retryAfter', String(NOW)))).toBeUndefined();
  });

  it('reads the headers of an error', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);

    expect(
      retryAfterOf(withField('headers', new Headers({ 'retry-after': '10' })))
    ).toBe(NOW + 10_000);
    expect(retryAfterOf(withField('headers', { 'retry-after': '20' }))).toBe(
      NOW + 20_000
    );
  });

  it('ignores headers without a retry time or that cannot be read', () => {
    expect(retryAfterOf(withField('headers', new Headers()))).toBeUndefined();
    expect(
      retryAfterOf(withField('headers', 'retry-after: 10'))
    ).toBeUndefined();
    expect(
      retryAfterOf(withField('headers', { 'retry-after': Symbol('x') }))
    ).toBeUndefined();
  });

  it('follows the cause of an error', () => {
    expect(
      retryAfterOf(
        new ApplicationError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'wrapped',
          cause: withField('retryAfter', NOW)
        })
      )
    ).toBe(NOW);
  });

  it('stops following causes after five levels', () => {
    const nest = (depth: number): unknown =>
      depth === 0
        ? withField('retryAfter', NOW)
        : new Error('wrapped', { cause: nest(depth - 1) });

    expect(retryAfterOf(nest(5))).toBe(NOW);
    expect(retryAfterOf(nest(6))).toBeUndefined();
  });

  it.each([undefined, null, 'x', new Error('no time')])(
    'returns undefined for %s',
    (value) => {
      expect(retryAfterOf(value)).toBeUndefined();
    }
  );
});
