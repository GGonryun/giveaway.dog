import { describe, it, expect } from 'vitest';
import type { Account } from 'next-auth';
import {
  CLEARED_TOKENS,
  storesProviderTokens,
  toStoredTokens,
  withoutUnstoredTokens
} from '../account-tokens';

const account = (provider: string): Account => ({
  type: 'oauth',
  provider,
  providerAccountId: 'p-1',
  access_token: 'access',
  refresh_token: 'refresh',
  expires_at: 1700000000,
  id_token: 'id-token',
  token_type: 'bearer',
  scope: 'user.info.basic'
});

describe('storesProviderTokens', () => {
  it('does not store the tokens of tiktok', () => {
    expect(storesProviderTokens('tiktok')).toBe(false);
  });

  it.each(['discord', 'twitch', 'twitter', 'google', 'velora', 'kick'])(
    'stores the tokens of %s',
    (provider) => {
      expect(storesProviderTokens(provider)).toBe(true);
    }
  );
});

describe('withoutUnstoredTokens', () => {
  it('removes the tokens of a tiktok account and keeps the other fields', () => {
    expect(withoutUnstoredTokens(account('tiktok'))).toEqual({
      type: 'oauth',
      provider: 'tiktok',
      providerAccountId: 'p-1',
      token_type: 'bearer',
      scope: 'user.info.basic'
    });
  });

  it('returns the account of another provider unchanged', () => {
    const discord = account('discord');

    expect(withoutUnstoredTokens(discord)).toBe(discord);
  });
});

describe('toStoredTokens', () => {
  it('clears every token of a tiktok account', () => {
    expect(toStoredTokens(account('tiktok'))).toEqual({
      access_token: null,
      refresh_token: null,
      expires_at: null,
      id_token: null
    });
    expect(CLEARED_TOKENS).toEqual(toStoredTokens(account('tiktok')));
  });

  it('keeps the tokens of another provider', () => {
    expect(toStoredTokens(account('discord'))).toEqual({
      access_token: 'access',
      refresh_token: 'refresh',
      expires_at: 1700000000,
      id_token: 'id-token'
    });
  });
});
