import { describe, it, expect, vi, afterEach } from 'vitest';
import { ApplicationError } from '@giveaway/util-errors';
import { JOB_RETRY_BASE_MS, MAX_JOB_ATTEMPTS, toJobRetryAt } from '../retry';

const NOW = new Date('2026-06-01T12:00:00.000Z');
const MINUTE = 60_000;

const unavailable = () =>
  new ApplicationError({ code: 'SERVICE_UNAVAILABLE', message: 'down' });

const at = (ms: number) => new Date(NOW.getTime() + ms);

afterEach(() => {
  vi.useRealTimers();
});

describe('toJobRetryAt', () => {
  it('allows five attempts and waits five minutes before the first retry', () => {
    expect(MAX_JOB_ATTEMPTS).toBe(5);
    expect(JOB_RETRY_BASE_MS).toBe(5 * MINUTE);
  });

  it.each([
    [0, 5],
    [1, 10],
    [2, 20],
    [3, 40]
  ])(
    'retries a transient error after %i failed attempts in %i minutes',
    (attempts, minutes) => {
      expect(
        toJobRetryAt({ error: unavailable(), attempts, now: NOW })
      ).toEqual(at(minutes * MINUTE));
    }
  );

  it('fails a transient error on the last attempt', () => {
    expect(
      toJobRetryAt({
        error: unavailable(),
        attempts: MAX_JOB_ATTEMPTS - 1,
        now: NOW
      })
    ).toBeNull();
    expect(
      toJobRetryAt({ error: unavailable(), attempts: 9, now: NOW })
    ).toBeNull();
  });

  it('does not retry an error that is not transient', () => {
    expect(
      toJobRetryAt({
        error: new ApplicationError({ code: 'NOT_FOUND', message: 'gone' }),
        attempts: 0,
        now: NOW
      })
    ).toBeNull();
    expect(
      toJobRetryAt({ error: new Error('bug'), attempts: 0, now: NOW })
    ).toBeNull();
  });

  it('waits until a later retry time that the error sends', () => {
    const retryAfter = NOW.getTime() + 30 * MINUTE;

    expect(
      toJobRetryAt({
        error: new ApplicationError({
          code: 'TOO_MANY_REQUESTS',
          message: 'slow down',
          data: { retryAfter }
        }),
        attempts: 0,
        now: NOW
      })
    ).toEqual(new Date(retryAfter));
  });

  it('keeps the backoff when the retry time is sooner', () => {
    expect(
      toJobRetryAt({
        error: new ApplicationError({
          code: 'TOO_MANY_REQUESTS',
          message: 'slow down',
          data: { retryAfter: NOW.getTime() + MINUTE }
        }),
        attempts: 0,
        now: NOW
      })
    ).toEqual(at(5 * MINUTE));
  });

  it('counts from the current time by default', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);

    expect(toJobRetryAt({ error: unavailable(), attempts: 0 })).toEqual(
      at(5 * MINUTE)
    );
  });
});
