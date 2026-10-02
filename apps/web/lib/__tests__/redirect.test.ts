import { describe, it, expect } from 'vitest';
import { UserAccountType } from '@prisma/client';
import { getUserAuthRedirect } from '../redirect';

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

    it('returns the redirect target untrimmed', () => {
      expect(getUserAuthRedirect({ redirectTo: '  /app/settings ' })).toBe(
        '  /app/settings '
      );
    });

    it('returns an absolute external url as is', () => {
      expect(
        getUserAuthRedirect({ redirectTo: 'https://evil.example.com' })
      ).toBe('https://evil.example.com');
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
