import { describe, it, expect } from 'vitest';
import { UserAccountType } from '@giveaway/db-model';
import { getUserAuthRedirect, toSafeRedirect } from '../redirect';

describe('toSafeRedirect', () => {
  it.each([
    ['a path', '/app', '/app'],
    ['the root', '/', '/'],
    [
      'a path with a query and a hash',
      '/browse/abc?tab=tasks#top',
      '/browse/abc?tab=tasks#top'
    ],
    [
      'an encoded double slash in the path',
      '/%2F%2Fexample.org',
      '/%2F%2Fexample.org'
    ],
    ['a path with dot segments', '/a/../app', '/app']
  ])('keeps %s', (_label, value, expected) => {
    expect(toSafeRedirect(value, '/fallback')).toBe(expected);
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['an empty string', ''],
    ['whitespace only', '   '],
    ['an absolute url', 'https://example.org'],
    ['an absolute url with a path', 'https://example.org/app'],
    ['a protocol-relative url', '//example.org'],
    ['a backslash after the slash', '/\\example.org'],
    ['a javascript url', 'javascript:alert(1)'],
    ['an encoded double slash', '%2F%2Fexample.org'],
    ['a relative path', 'app/settings'],
    ['a path after whitespace', '  /app/settings'],
    ['a tab between the slashes', '/\t/example.org'],
    ['a newline between the slashes', '/\n/example.org'],
    ['a backslash after a tab', '/\t\\example.org']
  ])('returns the fallback for %s', (_label, value) => {
    expect(toSafeRedirect(value, '/fallback')).toBe('/fallback');
  });
});

describe('getUserAuthRedirect', () => {
  describe('when a redirect target is provided', () => {
    it('returns the redirect target for a host', () => {
      expect(
        getUserAuthRedirect({
          redirectTo: '/giveaways/abc',
          accountType: UserAccountType.HOST
        })
      ).toBe('/giveaways/abc');
    });

    it('returns the redirect target for a participant', () => {
      expect(
        getUserAuthRedirect({
          redirectTo: '/giveaways/abc',
          accountType: UserAccountType.PARTICIPANT
        })
      ).toBe('/giveaways/abc');
    });

    it.each([
      ['an absolute url', 'https://evil.example.com'],
      ['a protocol-relative url', '//evil.example.com']
    ])('sends a host to /app for %s', (_label, redirectTo) => {
      expect(
        getUserAuthRedirect({ redirectTo, accountType: UserAccountType.HOST })
      ).toBe('/app');
    });

    it('sends a user without an account type to /browse for an absolute url', () => {
      expect(
        getUserAuthRedirect({ redirectTo: 'https://evil.example.com' })
      ).toBe('/browse');
    });
  });

  describe('when no usable redirect target is provided', () => {
    it.each([
      ['undefined', undefined],
      ['an empty string', ''],
      ['whitespace only', '   ']
    ])('sends a host to /app when the target is %s', (_label, redirectTo) => {
      expect(
        getUserAuthRedirect({ redirectTo, accountType: UserAccountType.HOST })
      ).toBe('/app');
    });

    it('sends a participant to /browse', () => {
      expect(
        getUserAuthRedirect({ accountType: UserAccountType.PARTICIPANT })
      ).toBe('/browse');
    });

    it('sends a user without an account type to /browse', () => {
      expect(getUserAuthRedirect({})).toBe('/browse');
    });

    it('sends a user with whitespace target and no account type to /browse', () => {
      expect(getUserAuthRedirect({ redirectTo: ' \n\t' })).toBe('/browse');
    });
  });
});
