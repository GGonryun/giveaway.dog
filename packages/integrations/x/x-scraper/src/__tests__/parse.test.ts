import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ApplicationError } from '@giveaway/util-errors';
import { parseScrapeBadgerResponse } from '../parse';
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
