import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  E2E_CLOSED_GATES,
  E2E_TEST_SECRET,
  stubE2eFakeEnvironment
} from '@giveaway/e2e-fakes/testing/env';
import { authorizeE2eOAuth } from '../oauth';

const ORIGIN = 'https://preview.giveaway.dog';
const CALLBACK = `${ORIGIN}/api/auth/callback/discord`;

const authorize = ({
  params = {},
  cookie = `e2e-oauth=${encodeURIComponent(E2E_TEST_SECRET)}`
}: {
  params?: Record<string, string>;
  cookie?: string | null;
} = {}) => {
  const url = new URL(`${ORIGIN}/api/e2e/oauth/authorize`);
  url.search = new URLSearchParams({
    redirect_uri: CALLBACK,
    response_type: 'code',
    ...params
  }).toString();
  return authorizeE2eOAuth(
    new Request(url, { headers: cookie === null ? {} : { cookie } })
  );
};

const refreshTarget = async (response: Response) => {
  const html = await response.text();
  const target = html.match(/content="0;url=([^"]+)"/)?.[1];
  const link = html.match(/<a href="([^"]+)">Continue<\/a>/)?.[1];
  expect(link).toBe(target);
  return target?.replaceAll('&amp;', '&');
};

beforeEach(() => {
  stubE2eFakeEnvironment('preview');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('authorizeE2eOAuth', () => {
  it('sends the browser to the callback with the code and the state', async () => {
    const response = await authorize({ params: { state: 'the-state' } });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe(
      'text/html; charset=utf-8'
    );
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await refreshTarget(response)).toBe(
      `${CALLBACK}?code=e2e-oauth-code&state=the-state`
    );
  });

  it('sends no state when the request has none', async () => {
    expect(await refreshTarget(await authorize())).toBe(
      `${CALLBACK}?code=e2e-oauth-code`
    );
  });

  it('escapes the attribute of the URL', async () => {
    const response = await authorize({ params: { state: 'a"b' } });

    const html = await response.text();

    expect(html).toContain('code=e2e-oauth-code&amp;state=a%22b');
    expect(html).not.toContain('a"b');
  });

  it('reads the secret among other cookies', async () => {
    const response = await authorize({
      cookie: `theme=dark; e2e-oauth=${E2E_TEST_SECRET}; other=a=b`
    });

    expect(response.status).toBe(200);
  });

  it('decodes the secret cookie', async () => {
    const secret = 'e2e/secret+with=signs and at least 32 characters';
    vi.stubEnv('E2E_LOGIN_SECRET', secret);

    const response = await authorize({
      cookie: `e2e-oauth=${encodeURIComponent(secret)}`
    });

    expect(response.status).toBe(200);
  });

  it('works on the local development server', async () => {
    stubE2eFakeEnvironment('development');

    expect((await authorize()).status).toBe(200);
  });

  it.each(E2E_CLOSED_GATES)('returns 404 on %s', async (environment) => {
    stubE2eFakeEnvironment(environment);

    const response = await authorize();

    expect(response.status).toBe(404);
    expect(await response.text()).toBe('');
  });

  it.each([
    ['without a cookie', null],
    ['without the secret cookie', 'theme=dark'],
    ['with an empty secret cookie', 'e2e-oauth='],
    [
      'with a cookie whose name ends with the name of the secret',
      `x-e2e-oauth=${E2E_TEST_SECRET}`
    ],
    ['with a wrong secret', `e2e-oauth=${E2E_TEST_SECRET}x`],
    ['with the secret in another cookie', `other=${E2E_TEST_SECRET}`]
  ])('returns 404 %s', async (_, cookie) => {
    expect((await authorize({ cookie })).status).toBe(404);
  });

  it.each([
    ['no redirect URI', { redirect_uri: '' }],
    ['a redirect URI that is not a URL', { redirect_uri: 'not a url' }],
    [
      'a redirect URI on another origin',
      { redirect_uri: 'https://evil.example/api/auth/callback/discord' }
    ],
    [
      'a redirect URI with a query',
      { redirect_uri: `${CALLBACK}?next=https://evil.example` }
    ],
    [
      'the callback of a provider that the mock does not replace',
      { redirect_uri: `${ORIGIN}/api/auth/callback/google` }
    ],
    ['another path', { redirect_uri: `${ORIGIN}/account` }]
  ])('returns 404 for %s', async (_, params) => {
    expect((await authorize({ params })).status).toBe(404);
  });
});
