import 'server-only';

import type { Account } from 'next-auth';

const PROVIDERS_WITHOUT_STORED_TOKENS: ReadonlySet<string> = new Set([
  'tiktok'
]);

export const storesProviderTokens = (provider: string) =>
  !PROVIDERS_WITHOUT_STORED_TOKENS.has(provider);

export const CLEARED_TOKENS = {
  access_token: null,
  refresh_token: null,
  expires_at: null,
  id_token: null
} as const;

export const withoutUnstoredTokens = <T extends Account>(account: T): T => {
  if (storesProviderTokens(account.provider)) return account;
  const {
    access_token: _accessToken,
    refresh_token: _refreshToken,
    expires_at: _expiresAt,
    id_token: _idToken,
    ...rest
  } = account;
  return rest as T;
};

export const toStoredTokens = (account: Account) =>
  storesProviderTokens(account.provider)
    ? {
        access_token: account.access_token,
        refresh_token: account.refresh_token,
        expires_at: account.expires_at,
        id_token: account.id_token
      }
    : CLEARED_TOKENS;
