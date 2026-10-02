import { describe, it, expect } from 'vitest';
import { extractTweetId } from '../extract-tweet-id';

describe('extractTweetId', () => {
  describe('when the url contains a status id', () => {
    it.each([
      ['https://x.com/doglover/status/1234567890', '1234567890'],
      ['https://twitter.com/doglover/status/42', '42'],
      ['https://x.com/doglover/status/987?s=20', '987'],
      ['https://x.com/doglover/status/555/photo/1', '555'],
      ['status/7', '7']
    ])('extracts the id from %s', (url, expected) => {
      expect(extractTweetId(url)).toBe(expected);
    });

    it('returns the first status id when several are present', () => {
      expect(extractTweetId('https://x.com/a/status/1/quotes/status/2')).toBe(
        '1'
      );
    });
  });

  describe('when the url has no numeric status id', () => {
    it.each([
      '',
      'https://x.com/doglover',
      'https://x.com/doglover/status/',
      'https://x.com/doglover/status/abc',
      'https://x.com/doglover/statuses/123'
    ])('returns null for %j', (url) => {
      expect(extractTweetId(url)).toBeNull();
    });
  });

  describe('when the input is not a string', () => {
    it('returns null instead of throwing', () => {
      expect(extractTweetId(null as unknown as string)).toBeNull();
    });
  });
});
