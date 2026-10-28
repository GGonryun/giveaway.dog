import { describe, expect, it } from 'vitest';
import {
  E2E_OAUTH_ACCESS_TOKEN,
  E2E_OAUTH_AUTHORIZE_PATH,
  E2E_OAUTH_CODE,
  E2E_OAUTH_PROVIDERS,
  E2E_OAUTH_SECRET_COOKIE,
  E2E_OAUTH_SERVER,
  parseE2eOAuthProfile,
  toE2eOAuthProfileCookie,
  toE2eOAuthProfileCookieValue
} from '../oauth';

const PROFILE = {
  id: '1234567890',
  username: 'e2e_user',
  email: 'e2e-newbie-abc123@example.com'
};

describe('E2E_OAUTH_PROVIDERS', () => {
  it('lists the providers that the mock can replace', () => {
    expect(E2E_OAUTH_PROVIDERS).toEqual(['discord', 'tiktok']);
  });
});

describe('the mock OAuth constants', () => {
  it('names the cookie of the secret, the route and the values of the mock', () => {
    expect({
      E2E_OAUTH_SECRET_COOKIE,
      E2E_OAUTH_AUTHORIZE_PATH,
      E2E_OAUTH_CODE,
      E2E_OAUTH_ACCESS_TOKEN,
      E2E_OAUTH_SERVER
    }).toEqual({
      E2E_OAUTH_SECRET_COOKIE: 'e2e-oauth',
      E2E_OAUTH_AUTHORIZE_PATH: '/api/e2e/oauth/authorize',
      E2E_OAUTH_CODE: 'e2e-oauth-code',
      E2E_OAUTH_ACCESS_TOKEN: 'e2e-oauth-access-token',
      E2E_OAUTH_SERVER: 'https://e2e-oauth.invalid'
    });
  });
});

describe('toE2eOAuthProfileCookie', () => {
  it('names the profile cookie of a provider', () => {
    expect(toE2eOAuthProfileCookie('discord')).toBe('e2e-oauth-discord');
  });
});

describe('parseE2eOAuthProfile', () => {
  it('reads a profile from the encoded cookie value and fills the defaults', () => {
    expect(
      parseE2eOAuthProfile('discord', toE2eOAuthProfileCookieValue(PROFILE))
    ).toEqual({
      ...PROFILE,
      global_name: null,
      verified: true,
      avatar: null,
      discriminator: '0'
    });
  });

  it('reads a profile that is plain JSON', () => {
    const profile = { ...PROFILE, global_name: 'E2E', verified: false };

    expect(
      parseE2eOAuthProfile('discord', JSON.stringify(profile))
    ).toMatchObject(profile);
  });

  it.each([
    ['no value', undefined],
    ['an empty value', ''],
    ['a value that is not JSON', 'not json'],
    ['a value that cannot be decoded', '%E0%A4%A'],
    ['JSON that is not a profile', JSON.stringify(['a'])]
  ])('returns null for %s', (_, value) => {
    expect(parseE2eOAuthProfile('discord', value)).toBeNull();
  });

  it.each([
    ['an email of a real user', { email: 'someone@gmail.com' }],
    ['an e2e email of another domain', { email: 'e2e-newbie@example.org' }],
    ['an id that is not a Discord id', { id: 'abc' }],
    ['an id that is too long', { id: '1'.repeat(21) }],
    ['an empty username', { username: '' }],
    ['a username that is too long', { username: 'u'.repeat(33) }],
    ['an empty global name', { global_name: '' }],
    ['a global name that is too long', { global_name: 'g'.repeat(33) }],
    ['an avatar', { avatar: 'a_123' }],
    ['a discriminator', { discriminator: '1234' }],
    ['an unknown field', { admin: true }]
  ])('refuses a profile with %s', (_, change) => {
    expect(
      parseE2eOAuthProfile(
        'discord',
        toE2eOAuthProfileCookieValue({ ...PROFILE, ...change })
      )
    ).toBeNull();
  });

  it('accepts the longest id, username and global name', () => {
    const profile = {
      ...PROFILE,
      id: '9'.repeat(20),
      username: 'u'.repeat(32),
      global_name: 'g'.repeat(32)
    };

    expect(
      parseE2eOAuthProfile('discord', toE2eOAuthProfileCookieValue(profile))
    ).toMatchObject(profile);
  });
});

describe('parseE2eOAuthProfile for TikTok', () => {
  const TIKTOK = { open_id: 'e2e-newbie-abc123', username: 'e2e_tiktok' };

  it('wraps the user as the TikTok user info endpoint does', () => {
    expect(
      parseE2eOAuthProfile('tiktok', toE2eOAuthProfileCookieValue(TIKTOK))
    ).toEqual({
      data: { user: { ...TIKTOK, display_name: null, avatar_url: null } }
    });
  });

  it('accepts a display name and a username that looks like an email', () => {
    const profile = {
      ...TIKTOK,
      username: 'e2e-participant-abc123@example.com',
      display_name: 'E2E TikTok'
    };

    expect(
      parseE2eOAuthProfile('tiktok', toE2eOAuthProfileCookieValue(profile))
    ).toEqual({ data: { user: { ...profile, avatar_url: null } } });
  });

  it.each([
    ['an open id that is not an e2e account id', { open_id: '-000abc' }],
    ['an open id without a namespace', { open_id: 'e2e-newbie' }],
    ['an empty username', { username: '' }],
    ['a username that is too long', { username: 'u'.repeat(81) }],
    ['an empty display name', { display_name: '' }],
    ['an avatar', { avatar_url: 'https://example.com/a.png' }],
    ['an email', { email: 'e2e-newbie-abc123@example.com' }]
  ])('refuses a profile with %s', (_, change) => {
    expect(
      parseE2eOAuthProfile(
        'tiktok',
        toE2eOAuthProfileCookieValue({ ...TIKTOK, ...change })
      )
    ).toBeNull();
  });
});
