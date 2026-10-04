import { describe, it, expect } from 'vitest';
import {
  xProfileRefineUrl,
  xProfileRefineError,
  xStatusRefineUrl,
  xStatusRefineError,
  extractTweetId,
  extractUsernameFromTweetUrl,
  extractUsernameFromProfileUrl
} from '../twitter';

describe('xProfileRefineUrl', () => {
  it.each([
    'https://x.com/giveawaydog',
    'http://x.com/giveawaydog',
    'https://www.x.com/giveawaydog',
    'https://x.com/a',
    'https://x.com/Under_Score_123',
    'https://x.com/abcdefghijklmnop'
  ])('accepts %s', (url) => {
    expect(xProfileRefineUrl(url)).toBe(true);
  });

  it.each([
    ['an empty string', ''],
    ['a bare host', 'https://x.com/'],
    ['a username longer than 16 characters', 'https://x.com/abcdefghijklmnopq'],
    ['a trailing slash', 'https://x.com/giveawaydog/'],
    ['a twitter.com host', 'https://twitter.com/giveawaydog'],
    ['a mobile subdomain', 'https://mobile.x.com/giveawaydog'],
    ['a query string', 'https://x.com/giveawaydog?ref=home'],
    ['a hyphenated username', 'https://x.com/giveaway-dog'],
    ['an @ prefixed username', 'https://x.com/@giveawaydog'],
    ['a status url', 'https://x.com/giveawaydog/status/123'],
    ['a plain username', 'giveawaydog'],
    ['a missing scheme', 'x.com/giveawaydog'],
    ['leading whitespace', ' https://x.com/giveawaydog'],
    ['a url embedded in text', 'see https://x.com/giveawaydog']
  ])('rejects %s', (_case, url) => {
    expect(xProfileRefineUrl(url)).toBe(false);
  });

  it('exposes a refine error with an example profile url', () => {
    expect(xProfileRefineError).toBe(
      'Unexpected URL, should be like https://x.com/username'
    );
  });
});

describe('xStatusRefineUrl', () => {
  it.each([
    'https://x.com/giveawaydog/status/1234567890',
    'http://x.com/giveawaydog/status/1',
    'https://www.x.com/giveawaydog/status/1234567890',
    'https://x.com/abcdefghijklmno/status/1',
    'https://x.com/a/status/1'
  ])('accepts %s', (url) => {
    expect(xStatusRefineUrl(url)).toBe(true);
  });

  it.each([
    ['an empty string', ''],
    [
      'a username longer than 15 characters',
      'https://x.com/abcdefghijklmnop/status/1'
    ],
    ['a non-numeric status id', 'https://x.com/giveawaydog/status/abc'],
    ['a missing status id', 'https://x.com/giveawaydog/status/'],
    ['a trailing slash', 'https://x.com/giveawaydog/status/123/'],
    ['a query string', 'https://x.com/giveawaydog/status/123?s=20'],
    ['a photo suffix', 'https://x.com/giveawaydog/status/123/photo/1'],
    ['a twitter.com host', 'https://twitter.com/giveawaydog/status/123'],
    ['a statuses path', 'https://x.com/giveawaydog/statuses/123'],
    ['a profile url', 'https://x.com/giveawaydog'],
    ['a bare tweet id', '1234567890'],
    ['leading whitespace', ' https://x.com/giveawaydog/status/123'],
    ['a url embedded in text', 'see https://x.com/giveawaydog/status/123']
  ])('rejects %s', (_case, url) => {
    expect(xStatusRefineUrl(url)).toBe(false);
  });

  it('exposes a refine error with an example status url', () => {
    expect(xStatusRefineError).toBe(
      'Unexpected URL, should be like https://x.com/username/status/1234567890'
    );
  });
});

describe('extractTweetId', () => {
  it('returns the numeric id from a status url', () => {
    expect(extractTweetId('https://x.com/giveawaydog/status/1234567890')).toBe(
      '1234567890'
    );
  });

  it('returns the id from a www status url', () => {
    expect(extractTweetId('https://www.x.com/dog/status/42')).toBe('42');
  });

  it('returns a bare tweet id unchanged', () => {
    expect(extractTweetId('1234567890')).toBe('1234567890');
  });

  it('returns arbitrary non-url text unchanged', () => {
    expect(extractTweetId('not a tweet')).toBe('not a tweet');
  });

  it('returns an empty string unchanged', () => {
    expect(extractTweetId('')).toBe('');
  });

  it('returns a status url with a query string unchanged', () => {
    const url = 'https://x.com/giveawaydog/status/1234567890?s=20';

    expect(extractTweetId(url)).toBe(url);
  });

  it('returns a twitter.com status url unchanged', () => {
    const url = 'https://twitter.com/giveawaydog/status/1234567890';

    expect(extractTweetId(url)).toBe(url);
  });

  it('returns a status url with a trailing slash unchanged', () => {
    const url = 'https://x.com/giveawaydog/status/1234567890/';

    expect(extractTweetId(url)).toBe(url);
  });

  it('returns a status url with a photo suffix unchanged', () => {
    const url = 'https://x.com/giveawaydog/status/1234567890/photo/1';

    expect(extractTweetId(url)).toBe(url);
  });

  it('returns the id from a status url with a single character username', () => {
    expect(extractTweetId('https://x.com/a/status/987')).toBe('987');
  });
});

describe('extractUsernameFromTweetUrl', () => {
  it('returns the username from a status url', () => {
    expect(
      extractUsernameFromTweetUrl('https://x.com/giveaway_dog/status/123')
    ).toBe('giveaway_dog');
  });

  it('returns a single character username', () => {
    expect(extractUsernameFromTweetUrl('https://x.com/a/status/123')).toBe('a');
  });

  it('returns a 15 character username', () => {
    expect(
      extractUsernameFromTweetUrl('https://x.com/abcdefghijklmno/status/1')
    ).toBe('abcdefghijklmno');
  });

  it('returns the username even when the url has a query string', () => {
    expect(
      extractUsernameFromTweetUrl('https://x.com/giveawaydog/status/123?s=20')
    ).toBe('giveawaydog');
  });

  it('matches any host ending in x.com because the pattern is not anchored', () => {
    expect(
      extractUsernameFromTweetUrl('https://notx.com/someone/status/123')
    ).toBe('someone');
  });

  it('returns null for a username longer than 15 characters', () => {
    expect(
      extractUsernameFromTweetUrl('https://x.com/abcdefghijklmnop/status/1')
    ).toBeNull();
  });

  it('returns null for a profile url', () => {
    expect(extractUsernameFromTweetUrl('https://x.com/giveawaydog')).toBeNull();
  });

  it('returns null for a twitter.com status url', () => {
    expect(
      extractUsernameFromTweetUrl('https://twitter.com/giveawaydog/status/1')
    ).toBeNull();
  });
});

describe('extractUsernameFromProfileUrl', () => {
  it('returns the username from a profile url', () => {
    expect(extractUsernameFromProfileUrl('https://x.com/giveawaydog')).toBe(
      'giveawaydog'
    );
  });

  it('returns the username from a www profile url', () => {
    expect(extractUsernameFromProfileUrl('http://www.x.com/giveaway_dog')).toBe(
      'giveaway_dog'
    );
  });

  it('accepts a 16 character username', () => {
    expect(
      extractUsernameFromProfileUrl('https://x.com/abcdefghijklmnop')
    ).toBe('abcdefghijklmnop');
  });

  it('accepts a single character username', () => {
    expect(extractUsernameFromProfileUrl('https://x.com/a')).toBe('a');
  });

  it.each([
    'https://x.com/abcdefghijklmnopq',
    'https://x.com/giveawaydog/',
    'https://x.com/giveawaydog/status/1',
    'https://twitter.com/giveawaydog',
    ' https://x.com/giveawaydog',
    'giveawaydog',
    ''
  ])('returns null for %j', (url) => {
    expect(extractUsernameFromProfileUrl(url)).toBeNull();
  });
});
