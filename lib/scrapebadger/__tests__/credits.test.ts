import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApplicationError } from '@/lib/errors';
import { checkAndConsumeCredits } from '../credits';

const m = vi.hoisted(() => ({
  limit: vi.fn()
}));

vi.mock('@/lib/ratelimit', () => ({
  scrapeBadgerCredits: { limit: m.limit }
}));

const NOW = new Date('2026-03-01T10:00:00.000Z');

const captureError = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return error as ApplicationError;
  }
  throw new Error('Expected the promise to reject');
};

describe('checkAndConsumeCredits', () => {
  beforeEach(() => {
    m.limit.mockReset();
    m.limit.mockResolvedValue({
      success: true,
      remaining: 19,
      reset: NOW.getTime() + 1000
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('client identification', () => {
    it('uses the first x-forwarded-for address', async () => {
      const headers = new Headers({
        'x-forwarded-for': ' 203.0.113.5 , 10.0.0.1',
        'x-real-ip': '198.51.100.7'
      });

      await checkAndConsumeCredits(headers, 1);

      expect(m.limit).toHaveBeenCalledWith('ip:203.0.113.5', { rate: 1 });
    });

    it('falls back to x-real-ip when x-forwarded-for is absent', async () => {
      const headers = new Headers({ 'x-real-ip': '198.51.100.7' });

      await checkAndConsumeCredits(headers, 1);

      expect(m.limit).toHaveBeenCalledWith('ip:198.51.100.7', { rate: 1 });
    });

    it('uses unknown when no address header is present', async () => {
      await checkAndConsumeCredits(new Headers(), 1);

      expect(m.limit).toHaveBeenCalledWith('ip:unknown', { rate: 1 });
    });

    it('uses an empty address when x-forwarded-for is empty', async () => {
      const headers = new Headers({
        'x-forwarded-for': '',
        'x-real-ip': '198.51.100.7'
      });

      await checkAndConsumeCredits(headers, 1);

      expect(m.limit).toHaveBeenCalledWith('ip:', { rate: 1 });
    });
  });

  describe('when enough credits remain', () => {
    it('consumes the requested cost as the rate', async () => {
      await checkAndConsumeCredits(new Headers(), 5);

      expect(m.limit).toHaveBeenCalledWith('ip:unknown', { rate: 5 });
    });

    it('resolves without a value', async () => {
      await expect(
        checkAndConsumeCredits(new Headers(), 1)
      ).resolves.toBeUndefined();
    });
  });

  describe('when credits are exhausted', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(NOW);
    });

    it('throws TOO_MANY_REQUESTS with the remaining credits and reset time', async () => {
      const reset = NOW.getTime() + 90_000;
      m.limit.mockResolvedValue({ success: false, remaining: 0, reset });

      const error = await captureError(
        checkAndConsumeCredits(new Headers(), 2)
      );

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.code).toBe('TOO_MANY_REQUESTS');
      expect(error.message).toBe(
        'Insufficient credits. Need 2, have 0. Resets in 90 seconds.'
      );
      expect(error.data).toEqual({
        creditsNeeded: 2,
        creditsRemaining: 0,
        retryAfter: reset,
        retryAfterISO: '2026-03-01T10:01:30.000Z'
      });
    });

    it('reports the credits that remain in the error data', async () => {
      const reset = NOW.getTime() + 30_000;
      m.limit.mockResolvedValue({ success: false, remaining: 3, reset });

      const error = await captureError(
        checkAndConsumeCredits(new Headers(), 4)
      );

      expect(error.message).toBe(
        'Insufficient credits. Need 4, have 3. Resets in 30 seconds.'
      );
      expect(error.data).toEqual({
        creditsNeeded: 4,
        creditsRemaining: 3,
        retryAfter: reset,
        retryAfterISO: '2026-03-01T10:00:30.000Z'
      });
    });

    it('rounds partial seconds up in the message', async () => {
      m.limit.mockResolvedValue({
        success: false,
        remaining: 1,
        reset: NOW.getTime() + 1001
      });

      const error = await captureError(
        checkAndConsumeCredits(new Headers(), 3)
      );

      expect(error.message).toBe(
        'Insufficient credits. Need 3, have 1. Resets in 2 seconds.'
      );
    });

    it('reports a non-positive wait when the reset time has already passed', async () => {
      m.limit.mockResolvedValue({
        success: false,
        remaining: 0,
        reset: NOW.getTime() - 5000
      });

      const error = await captureError(
        checkAndConsumeCredits(new Headers(), 1)
      );

      expect(error.message).toBe(
        'Insufficient credits. Need 1, have 0. Resets in -5 seconds.'
      );
    });
  });

  it('propagates rate limiter failures', async () => {
    m.limit.mockRejectedValue(new Error('redis down'));

    await expect(checkAndConsumeCredits(new Headers(), 1)).rejects.toThrow(
      'redis down'
    );
  });
});
