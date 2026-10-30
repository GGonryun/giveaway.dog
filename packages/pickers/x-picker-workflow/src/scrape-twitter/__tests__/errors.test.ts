import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundError } from 'scrapebadger';
import { FatalError, RetryableError } from 'workflow';
import { STEP_RETRY_DELAY_MS, toStepError } from '../errors';

const scrapeBadgerError = (name: string, fields: object = {}) =>
  Object.assign(new Error(name), { name, ...fields });

const NOW = new Date('2026-10-01T12:00:00.000Z');
const LATER = new Date(NOW.getTime() + STEP_RETRY_DELAY_MS);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('toStepError', () => {
  it.each([
    ['a server error', scrapeBadgerError('ServerError', { statusCode: 503 })],
    ['a timeout', scrapeBadgerError('TimeoutError')],
    ['a network error', new TypeError('fetch failed')],
    ['a rate limit without a reset time', scrapeBadgerError('RateLimitError')]
  ])('retries %s a minute later', (_, error) => {
    const result = toStepError(error, 'Failed');

    expect(RetryableError.is(result)).toBe(true);
    expect((result as RetryableError).retryAfter).toEqual(LATER);
    expect(result.message).toBe(`Failed: ${error}`);
  });

  it('retries a rate limit when it resets', () => {
    const resetAt = NOW.getTime() / 1000 + 600;

    const result = toStepError(
      scrapeBadgerError('RateLimitError', { retryAfter: resetAt }),
      'Failed'
    );

    expect((result as RetryableError).retryAfter).toEqual(
      new Date(resetAt * 1000)
    );
  });

  it('waits at least a minute when a rate limit resets sooner', () => {
    const result = toStepError(
      scrapeBadgerError('RateLimitError', {
        retryAfter: NOW.getTime() / 1000 + 5
      }),
      'Failed'
    );

    expect((result as RetryableError).retryAfter).toEqual(LATER);
  });

  it('reads a reset time only from a rate limit', () => {
    const result = toStepError(
      scrapeBadgerError('ServerError', {
        retryAfter: NOW.getTime() / 1000 + 600
      }),
      'Failed'
    );

    expect((result as RetryableError).retryAfter).toEqual(LATER);
  });

  it.each([
    ['a missing tweet', new NotFoundError('gone')],
    ['a bad API key', scrapeBadgerError('AuthenticationError')],
    ['an unreadable response', new SyntaxError('Unexpected token')]
  ])('fails for good on %s', (_, error) => {
    const result = toStepError(error, 'Failed');

    expect(FatalError.is(result)).toBe(true);
    expect(RetryableError.is(result)).toBe(false);
    expect(result.message).toBe(`Failed: ${error}`);
  });
});
