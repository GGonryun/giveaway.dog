import { describe, it, expect } from 'vitest';
import {
  blueskyPostRefineUrl,
  blueskyPostRefineError,
  blueskyProfileRefineUrl,
  blueskyProfileRefineError
} from '../bluesky-helpers';

const LABEL_63 = `a${'b'.repeat(61)}c`;
const LABEL_64 = `a${'b'.repeat(62)}c`;

describe('blueskyPostRefineUrl', () => {
  describe('when the url points at a post by handle', () => {
    it.each([
      'https://bsky.app/profile/alice.bsky.social/post/3k2abcxyz',
      'http://bsky.app/profile/alice.bsky.social/post/3k2abcxyz',
      'https://bsky.app/profile/alice.bsky.social/post/3k2abcxyz/',
      'https://bsky.app/profile/example.com/post/abc',
      'https://bsky.app/profile/my-name.bsky.social/post/abc',
      'https://bsky.app/profile/Alice.Bsky.Social/post/ABC123',
      'https://bsky.app/profile/a.b/post/1',
      'https://bsky.app/profile/127.0.0.1/post/abc',
      `https://bsky.app/profile/${LABEL_63}.bsky.social/post/abc`
    ])('accepts %s', (url) => {
      expect(blueskyPostRefineUrl(url)).toBe(true);
    });
  });

  describe('when the url points at a post by DID', () => {
    it.each([
      'https://bsky.app/profile/did:plc:abc123xyz/post/3k2abcxyz',
      'http://bsky.app/profile/did:plc:abc123xyz/post/3k2abcxyz',
      'https://bsky.app/profile/did:plc:abc123xyz/post/3k2abcxyz/'
    ])('accepts %s', (url) => {
      expect(blueskyPostRefineUrl(url)).toBe(true);
    });
  });

  describe('when the url is not a bluesky post url', () => {
    it.each([
      ['an empty string', ''],
      ['a single-label handle', 'https://bsky.app/profile/alice/post/abc'],
      [
        'a label starting with a hyphen',
        'https://bsky.app/profile/-alice.bsky.social/post/abc'
      ],
      [
        'a label ending with a hyphen',
        'https://bsky.app/profile/alice-.bsky.social/post/abc'
      ],
      [
        'a label longer than 63 characters',
        `https://bsky.app/profile/${LABEL_64}.bsky.social/post/abc`
      ],
      [
        'a different host',
        'https://bsky.social/profile/alice.bsky.social/post/abc'
      ],
      [
        'a www subdomain',
        'https://www.bsky.app/profile/alice.bsky.social/post/abc'
      ],
      ['an ftp scheme', 'ftp://bsky.app/profile/alice.bsky.social/post/abc'],
      ['a missing post id', 'https://bsky.app/profile/alice.bsky.social/post/'],
      [
        'a post id with a hyphen',
        'https://bsky.app/profile/alice.bsky.social/post/abc-def'
      ],
      [
        'a post id with an underscore',
        'https://bsky.app/profile/alice.bsky.social/post/abc_def'
      ],
      [
        'a query string',
        'https://bsky.app/profile/alice.bsky.social/post/abc?ref=home'
      ],
      [
        'a double trailing slash',
        'https://bsky.app/profile/alice.bsky.social/post/abc//'
      ],
      ['a profile url', 'https://bsky.app/profile/alice.bsky.social'],
      [
        'a did:web identifier',
        'https://bsky.app/profile/did:web:example.com/post/abc'
      ],
      [
        'an uppercase did:plc',
        'https://bsky.app/profile/did:plc:ABC123/post/abc'
      ],
      [
        'leading whitespace',
        ' https://bsky.app/profile/alice.bsky.social/post/abc'
      ],
      ['a plain handle', 'alice.bsky.social']
    ])('rejects %s', (_case, url) => {
      expect(blueskyPostRefineUrl(url)).toBe(false);
    });
  });

  it('exposes a refine error with an example post url', () => {
    expect(blueskyPostRefineError).toBe(
      'Unexpected URL, should be like https://bsky.app/profile/username.bsky.social/post/postId/'
    );
  });
});

describe('blueskyProfileRefineUrl', () => {
  describe('when the value is a profile url by handle', () => {
    it.each([
      'https://bsky.app/profile/alice.bsky.social',
      'http://bsky.app/profile/alice.bsky.social',
      'https://bsky.app/profile/alice.bsky.social/',
      'https://bsky.app/profile/example.com',
      'https://bsky.app/profile/My-Name.example.org'
    ])('accepts %s', (url) => {
      expect(blueskyProfileRefineUrl(url)).toBe(true);
    });
  });

  describe('when the value is a profile url by DID', () => {
    it.each([
      'https://bsky.app/profile/did:plc:abc123xyz',
      'https://bsky.app/profile/did:plc:abc123xyz/'
    ])('accepts %s', (url) => {
      expect(blueskyProfileRefineUrl(url)).toBe(true);
    });
  });

  describe('when the value is a plain handle', () => {
    it.each([
      'alice.bsky.social',
      'example.com',
      'my-name.bsky.social',
      '127.0.0.1',
      `${LABEL_63}.bsky.social`
    ])('accepts %s', (handle) => {
      expect(blueskyProfileRefineUrl(handle)).toBe(true);
    });
  });

  describe('when the value is not a bluesky profile', () => {
    it.each([
      ['an empty string', ''],
      ['a single-label handle', 'alice'],
      ['a handle with an @ prefix', '@alice.bsky.social'],
      ['a plain handle with a trailing slash', 'alice.bsky.social/'],
      ['a plain handle starting with a hyphen', '-alice.bsky.social'],
      ['a plain handle with a long label', `${LABEL_64}.bsky.social`],
      ['a plain DID', 'did:plc:abc123xyz'],
      ['a single-label profile url', 'https://bsky.app/profile/alice'],
      ['a post url', 'https://bsky.app/profile/alice.bsky.social/post/abc'],
      ['a different host', 'https://bsky.social/profile/alice.bsky.social'],
      ['an uppercase did:plc', 'https://bsky.app/profile/did:plc:ABC'],
      ['a did:web identifier', 'https://bsky.app/profile/did:web:example.com'],
      [
        'a query string',
        'https://bsky.app/profile/alice.bsky.social?tab=likes'
      ],
      ['a handle with a space', 'alice .bsky.social']
    ])('rejects %s', (_case, value) => {
      expect(blueskyProfileRefineUrl(value)).toBe(false);
    });
  });

  it('exposes a refine error describing both accepted formats', () => {
    expect(blueskyProfileRefineError).toBe(
      'Invalid Bluesky profile. Must be a handle (e.g., username.bsky.social) or profile URL (e.g., https://bsky.app/profile/username.bsky.social)'
    );
  });
});
