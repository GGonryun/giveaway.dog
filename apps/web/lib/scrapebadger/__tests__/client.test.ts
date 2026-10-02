import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApplicationError } from '@giveaway/util-errors';
import { getScrapeBadgerClient } from '../client';

const m = vi.hoisted(() => ({
  ScrapeBadger: vi.fn(function (this: { config: unknown }, config: unknown) {
    this.config = config;
  })
}));

vi.mock('scrapebadger', () => ({
  ScrapeBadger: m.ScrapeBadger
}));

const captureError = (fn: () => unknown) => {
  try {
    fn();
  } catch (error) {
    return error as ApplicationError;
  }
  throw new Error('Expected the function to throw');
};

describe('getScrapeBadgerClient', () => {
  beforeEach(() => {
    m.ScrapeBadger.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('when the API key is configured', () => {
    it('creates a client with the API key from the environment', () => {
      vi.stubEnv('SCRAPEBADGER_API_KEY', 'sb-key');

      const client = getScrapeBadgerClient();

      expect(m.ScrapeBadger).toHaveBeenCalledWith({ apiKey: 'sb-key' });
      expect(client).toBe(m.ScrapeBadger.mock.instances[0]);
    });

    it('creates a new client on every call', () => {
      vi.stubEnv('SCRAPEBADGER_API_KEY', 'sb-key');

      const first = getScrapeBadgerClient();
      const second = getScrapeBadgerClient();

      expect(first).not.toBe(second);
      expect(m.ScrapeBadger).toHaveBeenCalledTimes(2);
    });
  });

  describe('when the API key is missing', () => {
    it.each([undefined, ''])(
      'throws INTERNAL_SERVER_ERROR when SCRAPEBADGER_API_KEY is %j',
      (value) => {
        vi.stubEnv('SCRAPEBADGER_API_KEY', value);

        const error = captureError(() => getScrapeBadgerClient());

        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.code).toBe('INTERNAL_SERVER_ERROR');
        expect(error.message).toBe(
          'SCRAPEBADGER_API_KEY environment variable not set'
        );
        expect(m.ScrapeBadger).not.toHaveBeenCalled();
      }
    );
  });
});
