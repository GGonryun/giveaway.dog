import 'server-only';

import { customFetch, type NextAuthConfig } from 'next-auth';
import { cookies } from 'next/headers';
import { unstable_rethrow } from 'next/navigation';
import type { NextRequest } from 'next/server';
import { environment } from '@giveaway/app-config/environment';
import { isE2eGateOpen, verifyE2eSecret } from '@giveaway/e2e-gate/gate';
import {
  E2E_OAUTH_ACCESS_TOKEN,
  E2E_OAUTH_AUTHORIZE_PATH,
  E2E_OAUTH_PROVIDERS,
  E2E_OAUTH_SECRET_COOKIE,
  E2E_OAUTH_SERVER,
  E2eOAuthProvider,
  parseE2eOAuthProfile,
  toE2eOAuthProfileCookie
} from '@giveaway/e2e-model/oauth';

type Providers = NonNullable<NextAuthConfig['providers']>;

type CookieJar = { get: (name: string) => { value: string } | undefined };

export type E2eOAuthProfileMap = Partial<
  Record<E2eOAuthProvider, Record<string, unknown>>
>;

const readCookies = async (
  request: NextRequest | undefined
): Promise<CookieJar | undefined> => {
  if (request) return request.cookies;
  try {
    return await cookies();
  } catch (error) {
    unstable_rethrow(error);
    return undefined;
  }
};

export const readE2eOAuthProfiles = async (
  request: NextRequest | undefined
): Promise<E2eOAuthProfileMap> => {
  if (!isE2eGateOpen()) return {};

  const jar = await readCookies(request);
  if (!jar || !verifyE2eSecret(jar.get(E2E_OAUTH_SECRET_COOKIE)?.value)) {
    return {};
  }

  return Object.fromEntries(
    E2E_OAUTH_PROVIDERS.flatMap((provider) => {
      const profile = parseE2eOAuthProfile(
        provider,
        jar.get(toE2eOAuthProfileCookie(provider))?.value
      );
      return profile ? [[provider, profile]] : [];
    })
  );
};

export const E2E_OAUTH_TOKEN_URL = `${E2E_OAUTH_SERVER}/token`;

export const E2E_OAUTH_USERINFO_URL = `${E2E_OAUTH_SERVER}/userinfo`;

const toMockFetch =
  (profile: Record<string, unknown>, scope: string) =>
  async (...args: Parameters<typeof fetch>) => {
    const [input] = args;
    const url = input instanceof Request ? input.url : String(input);

    if (url === E2E_OAUTH_TOKEN_URL) {
      return Response.json({
        access_token: E2E_OAUTH_ACCESS_TOKEN,
        token_type: 'bearer',
        expires_in: 604800,
        refresh_token: `${E2E_OAUTH_ACCESS_TOKEN}-refresh`,
        scope
      });
    }
    if (url === E2E_OAUTH_USERINFO_URL) {
      return Response.json(profile);
    }
    return fetch(...args);
  };

const MOCK_SCOPES: Record<E2eOAuthProvider, string> = {
  discord: 'identify email',
  tiktok: 'user.info.profile'
};

const toMockProvider = (
  provider: E2eOAuthProvider,
  profile: Record<string, unknown>
) => {
  const authorization = new URL(E2E_OAUTH_AUTHORIZE_PATH, environment.appUrl());
  authorization.searchParams.set('scope', MOCK_SCOPES[provider]);

  return {
    clientId: 'e2e',
    clientSecret: 'e2e',
    authorization: authorization.toString(),
    token: E2E_OAUTH_TOKEN_URL,
    userinfo: E2E_OAUTH_USERINFO_URL,
    [customFetch]: toMockFetch(profile, MOCK_SCOPES[provider])
  };
};

export const withE2eOAuth = (
  providers: Providers,
  profiles: E2eOAuthProfileMap
): Providers =>
  providers.map((provider) => {
    if (typeof provider === 'function') return provider;
    const id = provider.id as E2eOAuthProvider;
    const profile = profiles[id];
    if (!profile) return provider;

    const mock = toMockProvider(id, profile);
    const options = 'options' in provider ? provider.options : undefined;
    return { ...provider, ...mock, options: { ...options, ...mock } };
  });
