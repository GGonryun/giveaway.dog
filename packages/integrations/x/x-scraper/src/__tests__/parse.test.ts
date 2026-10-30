import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ApplicationError } from '@giveaway/util-errors';
import { NotFoundError, RateLimitError, ServerError } from 'scrapebadger';
import { parseScrapeBadgerResponse, toScrapeBadgerError } from '../parse';
import { scrapeBadgerTweetSchema } from '../schemas';
import { scrapeBadgerTweetFixture } from '../testing/fixtures-scrapebadger-tweet';

const captureError = (fn: () => unknown) => {
  try {
    fn();
  } catch (error) {
    return error as ApplicationError;
  }
  throw new Error('Expected the function to throw');
};

describe('parseScrapeBadgerResponse', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the response unchanged when it matches the schema', () => {
    const response = { ...scrapeBadgerTweetFixture, view_count: '9876' };

    expect(
      parseScrapeBadgerResponse(scrapeBadgerTweetSchema, response, 'tweet')
    ).toBe(response);
    expect(console.error).not.toHaveBeenCalled();
  });

  it('keeps the fields that the schema does not list', () => {
    const response = { count: 1, extra: 'kept' };

    expect(
      parseScrapeBadgerResponse(z.object({ count: z.number() }), response, 'x')
    ).toEqual({ count: 1, extra: 'kept' });
  });

  describe('when the response does not match the schema', () => {
    const response = { ...scrapeBadgerTweetFixture, view_count: 'many' };

    it('throws BAD_GATEWAY with the zod error as its cause', () => {
      const error = captureError(() =>
        parseScrapeBadgerResponse(scrapeBadgerTweetSchema, response, 'tweet')
      );

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.code).toBe('BAD_GATEWAY');
      expect(error.message).toBe('Could not read the tweet from X');
      expect(error.cause).toBeInstanceOf(z.ZodError);
    });

    it.each(['tweet', 'user', 'retweeters'])(
      'does not name the scraper in the %s error that customers see',
      (call) => {
        const error = captureError(() =>
          parseScrapeBadgerResponse(scrapeBadgerTweetSchema, response, call)
        );

        expect(error.message).toBe(`Could not read the ${call} from X`);
        expect(error.message.toLowerCase()).not.toContain('scrapebadger');
      }
    );

    it('logs the call and the zod issues for the developers', () => {
      captureError(() =>
        parseScrapeBadgerResponse(scrapeBadgerTweetSchema, response, 'tweet')
      );

      expect(console.error).toHaveBeenCalledWith(
        '[ScrapeBadger] The tweet response does not match its schema:',
        [expect.objectContaining({ path: ['view_count'] })]
      );
    });
  });
});

describe('toScrapeBadgerError', () => {
  it('turns a rate limit with a reset time into a retryable error at that time', () => {
    const cause = new RateLimitError('Too many', { retryAfter: 1_790_000_000 });

    const error = toScrapeBadgerError(cause, 'retweeters');

    expect(error).toBeInstanceOf(ApplicationError);
    expect(error).toMatchObject({
      code: 'TOO_MANY_REQUESTS',
      message: 'ScrapeBadger rate limited the retweeters request',
      cause,
      data: { status: 429, retryAfter: 1_790_000_000_000 }
    });
  });

  it('turns a rate limit without a reset time into an error with no retry time', () => {
    const error = toScrapeBadgerError(new RateLimitError(), 'retweeters');

    expect((error as ApplicationError).data).toEqual({ status: 429 });
  });

  it('turns a server error into a bad gateway error with its status', () => {
    const cause = new ServerError('Down', 503);

    expect(toScrapeBadgerError(cause, 'tweet')).toMatchObject({
      code: 'BAD_GATEWAY',
      message: 'ScrapeBadger failed the tweet request: 503',
      cause,
      data: { status: 503 }
    });
  });

  it('returns any other error unchanged', () => {
    const error = new NotFoundError();

    expect(toScrapeBadgerError(error, 'tweet')).toBe(error);
  });
});
