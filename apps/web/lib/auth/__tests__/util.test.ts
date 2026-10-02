import { describe, it, expect } from 'vitest';
import { toAuthErrorDescription } from '../util';

const UNEXPECTED = 'An unexpected error occurred. Please try again.';

describe('toAuthErrorDescription', () => {
  it.each([
    [
      'OAuthAccountNotLinked',
      'An account with the same email address already exists. Please sign in using a different method.'
    ],
    [
      'OAuthAccountAlreadyLinked',
      'This account is already linked to a different user. Please use a different account or sign in to the account that owns this connection.'
    ],
    [
      'instagram_link_failed',
      'Failed to link Instagram account. Please try again.'
    ],
    [
      'facebook_link_failed',
      'Failed to link Facebook account. Please try again.'
    ],
    [
      'OAuthCallbackError',
      'User canceled the sign-in process or an error occurred during sign-in. Please try again.'
    ],
    [
      'AccessDenied',
      'Access was denied. Please check your permissions and try again.'
    ]
  ])('describes the %s error', (code, description) => {
    expect(toAuthErrorDescription(code)).toBe(description);
  });

  it('returns the generic description for an unknown error code', () => {
    expect(toAuthErrorDescription('Configuration')).toBe(UNEXPECTED);
  });

  it('returns the generic description for null', () => {
    expect(toAuthErrorDescription(null)).toBe(UNEXPECTED);
  });

  it('returns the generic description for undefined', () => {
    expect(toAuthErrorDescription(undefined)).toBe(UNEXPECTED);
  });

  it('returns the generic description for an empty string', () => {
    expect(toAuthErrorDescription('')).toBe(UNEXPECTED);
  });

  it('matches error codes case sensitively', () => {
    expect(toAuthErrorDescription('accessdenied')).toBe(UNEXPECTED);
  });
});
