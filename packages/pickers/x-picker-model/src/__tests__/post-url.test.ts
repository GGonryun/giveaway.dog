import { describe, it, expect } from 'vitest';
import { isXPostUrl, toCanonicalXPostUrl } from '../post-url';

describe('isXPostUrl', () => {
  it.each([
    'https://x.com/author/status/1',
    'https://www.x.com/author/status/1',
    'https://mobile.x.com/author/status/1',
    'https://twitter.com/author/status/1',
    'https://www.twitter.com/author/status/1',
    'https://mobile.twitter.com/author/status/1',
    'https://X.COM/author/status/1',
    'http://x.com/author/status/1',
    'https://t.co/AbC123'
  ])('accepts %s', (url) => {
    expect(isXPostUrl(url)).toBe(true);
  });

  it.each([
    'https://evil.example/?u=x.com/a/status/1',
    'https://evil.example/x.com/a/status/1',
    'https://notx.com/a/status/1',
    'https://x.com.evil.example/a/status/1',
    'https://x.com@evil.example/a/status/1',
    'https://ghost.co/xyz',
    'https://api.x.com/a/status/1',
    'javascript://x.com/%0Aalert(1)',
    'ftp://x.com/a/status/1',
    'x.com/a/status/1',
    'not a url',
    ''
  ])('refuses %s', (url) => {
    expect(isXPostUrl(url)).toBe(false);
  });

  it.each([undefined, null, 1, {}])('refuses the value %j', (value) => {
    expect(isXPostUrl(value)).toBe(false);
  });
});

describe('toCanonicalXPostUrl', () => {
  it('builds the x.com url of the post', () => {
    expect(toCanonicalXPostUrl({ id: '123', username: 'author_1' })).toBe(
      'https://x.com/author_1/status/123'
    );
  });

  it.each([undefined, null, '', 'a'.repeat(16), 'evil.example/x', '../a'])(
    'uses i for the username %j',
    (username) => {
      expect(toCanonicalXPostUrl({ id: '123', username })).toBe(
        'https://x.com/i/status/123'
      );
    }
  );

  it('encodes the id', () => {
    expect(toCanonicalXPostUrl({ id: '1/../../a?b', username: 'a' })).toBe(
      'https://x.com/a/status/1%2F..%2F..%2Fa%3Fb'
    );
  });
});
