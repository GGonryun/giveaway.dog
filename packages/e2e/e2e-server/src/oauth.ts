import 'server-only';

import { verifyE2eSecret } from '@giveaway/e2e-gate/gate';
import {
  E2E_OAUTH_CODE,
  E2E_OAUTH_PROVIDERS,
  E2E_OAUTH_SECRET_COOKIE
} from '@giveaway/e2e-model/oauth';

const readCookie = (request: Request, name: string) => {
  const cookie = request.headers
    .get('cookie')
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return cookie && decodeURIComponent(cookie.slice(name.length + 1));
};

const CALLBACK_PATHS = E2E_OAUTH_PROVIDERS.map(
  (provider) => `/api/auth/callback/${provider}`
);

const toCallbackUrl = (request: Request) => {
  const { origin, searchParams } = new URL(request.url);
  const redirectUri = searchParams.get('redirect_uri');
  if (!redirectUri || !URL.canParse(redirectUri)) return undefined;

  const callback = new URL(redirectUri);
  if (callback.origin !== origin || callback.search !== '') return undefined;
  if (!CALLBACK_PATHS.includes(callback.pathname)) return undefined;

  callback.searchParams.set('code', E2E_OAUTH_CODE);
  const state = searchParams.get('state');
  if (state) callback.searchParams.set('state', state);
  return callback.toString();
};

export const authorizeE2eOAuth = (request: Request) => {
  const callback = verifyE2eSecret(readCookie(request, E2E_OAUTH_SECRET_COOKIE))
    ? toCallbackUrl(request)
    : undefined;
  if (!callback) return new Response(null, { status: 404 });

  const href = callback.replaceAll('&', '&amp;');
  return new Response(
    `<!doctype html><html><head><meta http-equiv="refresh" content="0;url=${href}"><title>E2E OAuth</title></head><body><a href="${href}">Continue</a></body></html>`,
    {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    }
  );
};
