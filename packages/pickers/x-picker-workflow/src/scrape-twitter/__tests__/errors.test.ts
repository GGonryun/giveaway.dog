import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundError } from 'scrapebadger';
import { ApplicationError } from '@giveaway/util-errors';
import { FatalError, RetryableError } from 'workflow';
import { STEP_RETRY_DELAY_MS, toStepError } from '../errors';

const NOW = new Date('2026-10-01T12:00:00.000Z');
const LATER = new Date(NOW.getTime() + STEP_RETRY_DELAY_MS);

const httpError = (status: number, retryAfter?: number) =>
  new ApplicationError({
    code: status === 429 ? 'TOO_MANY_REQUESTS' : 'BAD_GATEWAY',
    message: `ScrapeBadger answered ${status}`,
    data: { status, ...(retryAfter !== undefined && { retryAfter }) }
  });

const timeoutError = () =>
  Object.assign(new Error('Request timed out'), { name: 'TimeoutError' });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('toStepError', () => {
  it.each([
    ['a server error', httpError(503)],
    ['a timeout', timeoutError()],
    ['a network error', new TypeError('fetch failed')],
    ['a rate limit without a reset time', httpError(429)]
  ])('retries %s a minute later', (_, error) => {
    const result = toStepError(error, 'Failed');

    expect(RetryableError.is(result)).toBe(true);
    expect((result as RetryableError).retryAfter).toEqual(LATER);
    expect(result.message).toBe(`Failed: ${error}`);
  });

  it('retries a rate limit when it resets', () => {
    const resetAt = NOW.getTime() + 600_000;

    const result = toStepError(httpError(429, resetAt), 'Failed');

    expect((result as RetryableError).retryAfter).toEqual(new Date(resetAt));
  });

  it('waits at least a minute when a rate limit resets sooner', () => {
    const result = toStepError(httpError(429, NOW.getTime() + 5_000), 'Failed');

    expect((result as RetryableError).retryAfter).toEqual(LATER);
  });

  it.each([
    ['a missing tweet', new NotFoundError('gone')],
    ['a bad API key', Object.assign(new Error('denied'), { status: 401 })],
    ['an unreadable response', new SyntaxError('Unexpected token')]
  ])('fails for good on %s', (_, error) => {
    const result = toStepError(error, 'Failed');

    expect(FatalError.is(result)).toBe(true);
    expect(RetryableError.is(result)).toBe(false);
    expect(result.message).toBe(`Failed: ${error}`);
  });
});
