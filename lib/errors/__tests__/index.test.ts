import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  ApplicationError,
  assertNever,
  codeToStatus,
  isApplicationError,
  isRetryableApplicationError,
  statusToCode
} from '../index';

describe('errors', () => {
  describe('statusToCode', () => {
    it('maps every supported http status to an application error code', () => {
      expect(statusToCode).toEqual({
        400: 'BAD_REQUEST',
        401: 'UNAUTHORIZED',
        402: 'PAYMENT_REQUIRED',
        403: 'FORBIDDEN',
        404: 'NOT_FOUND',
        405: 'METHOD_NOT_SUPPORTED',
        408: 'TIMEOUT',
        409: 'CONFLICT',
        412: 'PRECONDITION_FAILED',
        413: 'PAYLOAD_TOO_LARGE',
        415: 'UNSUPPORTED_MEDIA_TYPE',
        422: 'UNPROCESSABLE_CONTENT',
        429: 'TOO_MANY_REQUESTS',
        499: 'CLIENT_CLOSED_REQUEST',
        500: 'INTERNAL_SERVER_ERROR',
        501: 'NOT_IMPLEMENTED',
        502: 'BAD_GATEWAY',
        503: 'SERVICE_UNAVAILABLE',
        504: 'GATEWAY_TIMEOUT'
      });
    });
  });

  describe('codeToStatus', () => {
    it('is the numeric inverse of statusToCode', () => {
      for (const [status, code] of Object.entries(statusToCode)) {
        expect(codeToStatus[code]).toBe(Number(status));
      }
      expect(Object.keys(codeToStatus)).toHaveLength(
        Object.keys(statusToCode).length
      );
    });

    it('has no status for VALIDATION_ERROR or UNKNOWN_HTTP_ERROR', () => {
      expect(codeToStatus.VALIDATION_ERROR).toBeUndefined();
      expect(codeToStatus.UNKNOWN_HTTP_ERROR).toBeUndefined();
    });
  });

  describe('ApplicationError', () => {
    describe('constructor', () => {
      it('is an instance of Error and ApplicationError', () => {
        const error = new ApplicationError({ code: 'CONFLICT', message: 'x' });

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ApplicationError);
      });

      it('uses the code as the error name', () => {
        const error = new ApplicationError({
          code: 'NOT_FOUND',
          message: 'Missing'
        });

        expect(error.name).toBe('NOT_FOUND');
        expect(error.code).toBe('NOT_FOUND');
        expect(error.message).toBe('Missing');
      });

      it('defaults silent to false and leaves cause and data undefined', () => {
        const error = new ApplicationError({ code: 'CONFLICT', message: 'x' });

        expect(error.silent).toBe(false);
        expect(error.cause).toBeUndefined();
        expect(error.data).toBeUndefined();
      });

      it('stores silent, cause and data when provided', () => {
        const cause = new Error('root');
        const error = new ApplicationError({
          code: 'BAD_REQUEST',
          message: 'Bad',
          silent: true,
          cause,
          data: { field: 'email' }
        });

        expect(error.silent).toBe(true);
        expect(error.cause).toBe(cause);
        expect(error.data).toEqual({ field: 'email' });
      });
    });

    describe('toMessage', () => {
      it('returns the message of an application error', () => {
        const error = new ApplicationError({
          code: 'FORBIDDEN',
          message: 'Nope'
        });

        expect(ApplicationError.toMessage(error)).toBe('Nope');
      });

      it.each([new Error('plain error'), 'string error', null, undefined])(
        'returns a generic message for %s',
        (error) => {
          expect(ApplicationError.toMessage(error)).toBe(
            'An unknown error occurred...'
          );
        }
      );
    });

    describe('toNextResponse', () => {
      afterEach(() => {
        vi.useRealTimers();
      });

      it('uses the status mapped from the error code', async () => {
        const response = ApplicationError.toNextResponse(
          new ApplicationError({ code: 'NOT_FOUND', message: 'Missing' })
        );

        expect(response.status).toBe(404);
        expect(response.headers.get('Content-Type')).toBe('application/json');
      });

      it('serializes the code, message and data in an error envelope', async () => {
        const response = ApplicationError.toNextResponse(
          new ApplicationError({
            code: 'CONFLICT',
            message: 'Already exists',
            data: { id: 'abc' }
          })
        );

        expect(await response.json()).toEqual({
          error: {
            code: 'CONFLICT',
            message: 'Already exists',
            data: { id: 'abc' }
          }
        });
      });

      it('omits undefined data from the body', async () => {
        const response = ApplicationError.toNextResponse(
          new ApplicationError({ code: 'BAD_REQUEST', message: 'Bad' })
        );

        expect(await response.json()).toEqual({
          error: { code: 'BAD_REQUEST', message: 'Bad' }
        });
      });

      it('falls back to status 500 for codes without a mapped status', async () => {
        const response = ApplicationError.toNextResponse(
          new ApplicationError({
            code: 'VALIDATION_ERROR',
            message: 'Invalid'
          })
        );

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
          error: { code: 'VALIDATION_ERROR', message: 'Invalid' }
        });
      });

      it('returns a 429 with a Retry-After header for retryable rate limit errors', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
        const retryAfter = Date.now() + 2500;

        const response = ApplicationError.toNextResponse(
          new ApplicationError({
            code: 'TOO_MANY_REQUESTS',
            message: 'Slow down',
            data: { retryAfter }
          })
        );

        expect(response.status).toBe(429);
        expect(response.headers.get('Retry-After')).toBe('3');
        expect(response.headers.get('Content-Type')).toBe('application/json');
        expect(await response.json()).toEqual({
          success: false,
          error: 'Slow down',
          retryAfter
        });
      });

      it('spreads extra rate limit data into the body and lets it override fields', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
        const retryAfter = Date.now() + 1000;

        const response = ApplicationError.toNextResponse(
          new ApplicationError({
            code: 'TOO_MANY_REQUESTS',
            message: 'Slow down',
            data: { retryAfter, remaining: 0, error: 'overridden' }
          })
        );

        expect(response.headers.get('Retry-After')).toBe('1');
        expect(await response.json()).toEqual({
          success: false,
          error: 'overridden',
          retryAfter,
          remaining: 0
        });
      });

      it('reports a negative Retry-After when retryAfter is in the past', () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

        const response = ApplicationError.toNextResponse(
          new ApplicationError({
            code: 'TOO_MANY_REQUESTS',
            message: 'Slow down',
            data: { retryAfter: Date.now() - 5000 }
          })
        );

        expect(response.headers.get('Retry-After')).toBe('-5');
      });

      it('uses the generic envelope for rate limit errors without retry data', async () => {
        const response = ApplicationError.toNextResponse(
          new ApplicationError({
            code: 'TOO_MANY_REQUESTS',
            message: 'Slow down'
          })
        );

        expect(response.status).toBe(429);
        expect(response.headers.get('Retry-After')).toBeNull();
        expect(await response.json()).toEqual({
          error: { code: 'TOO_MANY_REQUESTS', message: 'Slow down' }
        });
      });

      it('uses the generic envelope for non rate limit errors carrying retryAfter', async () => {
        const response = ApplicationError.toNextResponse(
          new ApplicationError({
            code: 'SERVICE_UNAVAILABLE',
            message: 'Down',
            data: { retryAfter: 123 }
          })
        );

        expect(response.status).toBe(503);
        expect(response.headers.get('Retry-After')).toBeNull();
        expect(await response.json()).toEqual({
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Down',
            data: { retryAfter: 123 }
          }
        });
      });

      it.each([new Error('boom'), 'string', null])(
        'returns a generic 500 for the unknown error %s',
        async (error) => {
          const response = ApplicationError.toNextResponse(error);

          expect(response.status).toBe(500);
          expect(response.headers.get('Content-Type')).toBe('application/json');
          expect(await response.json()).toEqual({
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'An unexpected error occurred'
            }
          });
        }
      );
    });

    describe('toJSON', () => {
      it('serializes code, message and data with an undefined cause', () => {
        const error = new ApplicationError({
          code: 'CONFLICT',
          message: 'Dup',
          data: { a: 1 }
        });

        expect(error.toJSON()).toEqual({
          code: 'CONFLICT',
          message: 'Dup',
          data: { a: 1 },
          cause: undefined
        });
      });

      it('recursively serializes an application error cause', () => {
        const error = new ApplicationError({
          code: 'BAD_GATEWAY',
          message: 'Outer',
          cause: new ApplicationError({
            code: 'TIMEOUT',
            message: 'Inner'
          })
        });

        expect(error.toJSON()).toEqual({
          code: 'BAD_GATEWAY',
          message: 'Outer',
          data: undefined,
          cause: {
            code: 'TIMEOUT',
            message: 'Inner',
            data: undefined,
            cause: undefined
          }
        });
      });

      it('stringifies a non application error cause', () => {
        const error = new ApplicationError({
          code: 'BAD_GATEWAY',
          message: 'Outer',
          cause: new Error('root cause')
        });

        expect(error.toJSON()).toMatchObject({ cause: 'Error: root cause' });
      });

      it('stringifies a primitive cause', () => {
        const error = new ApplicationError({
          code: 'BAD_GATEWAY',
          message: 'Outer',
          cause: 42
        });

        expect(error.toJSON()).toMatchObject({ cause: '42' });
      });

      it('drops a falsy cause', () => {
        const error = new ApplicationError({
          code: 'BAD_GATEWAY',
          message: 'Outer',
          cause: 0
        });

        expect(error.toJSON()).toMatchObject({ cause: undefined });
      });

      it('is used by JSON.stringify', () => {
        const error = new ApplicationError({
          code: 'NOT_FOUND',
          message: 'Missing'
        });

        expect(JSON.parse(JSON.stringify(error))).toEqual({
          code: 'NOT_FOUND',
          message: 'Missing'
        });
      });
    });
  });

  describe('isApplicationError', () => {
    it('returns true for application errors', () => {
      expect(
        isApplicationError(
          new ApplicationError({ code: 'CONFLICT', message: 'x' })
        )
      ).toBe(true);
    });

    it.each([
      new Error('x'),
      { code: 'CONFLICT', message: 'x' },
      null,
      undefined,
      'CONFLICT'
    ])('returns false for %s', (value) => {
      expect(isApplicationError(value)).toBe(false);
    });
  });

  describe('isRetryableApplicationError', () => {
    const withData = (data: unknown) =>
      new ApplicationError({ code: 'TOO_MANY_REQUESTS', message: 'x', data });

    it('returns true when data has a numeric retryAfter', () => {
      expect(isRetryableApplicationError(withData({ retryAfter: 0 }))).toBe(
        true
      );
    });

    it('does not depend on the error code', () => {
      const error = new ApplicationError({
        code: 'NOT_FOUND',
        message: 'x',
        data: { retryAfter: 10 }
      });

      expect(isRetryableApplicationError(error)).toBe(true);
    });

    it('returns false for non application errors', () => {
      expect(isRetryableApplicationError({ data: { retryAfter: 10 } })).toBe(
        false
      );
    });

    it.each([
      ['undefined data', undefined],
      ['null data', null],
      ['primitive data', 10],
      ['data without retryAfter', { other: 1 }],
      ['string retryAfter', { retryAfter: '10' }]
    ])('returns false for %s', (_label, data) => {
      expect(isRetryableApplicationError(withData(data))).toBe(false);
    });
  });

  describe('assertNever', () => {
    it('throws an error naming the unexpected value', () => {
      expect(() => assertNever('surprise' as never)).toThrow(
        new Error('Unexpected value: surprise')
      );
    });
  });
});
