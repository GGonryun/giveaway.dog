import type { APIRequestContext } from '@playwright/test';
import { expect, test } from '../fixtures/test';
import { expectNoStackTrace, noRedirect } from '../helpers/http';
import { knownBug } from '../helpers/known-bug';

type Probe = { method: 'GET' | 'POST'; path: string; data?: string };

const LOAD_TWEET = '/api/pickers/x/public/load-tweet';

const PICK_WINNERS = '/api/pickers/x/public/pick-winners';

const RESUME = '/api/workflows/twitter/scrape/resume';

const send = (request: APIRequestContext, { method, path, data }: Probe) =>
  request.fetch(path, {
    method,
    headers: data ? { 'Content-Type': 'application/json' } : undefined,
    data,
    ...noRedirect
  });

const MALFORMED: Probe[] = [
  { method: 'POST', path: '/api/upload', data: '{' },
  { method: 'POST', path: PICK_WINNERS, data: '{}' },
  { method: 'GET', path: `${RESUME}?runId=nope` },
  { method: 'GET', path: '/api/bluesky/user/callback' },
  { method: 'GET', path: '/api/bluesky/team/callback' },
  { method: 'GET', path: '/api/twitch/callback?state=a:b' }
];

const SERVER_ERRORS: (Probe & { why: string })[] = [
  {
    method: 'GET',
    path: `${RESUME}?runId=wrun_missing`,
    why: 'an unknown run'
  },
  {
    method: 'GET',
    path: '/api/bluesky/user/callback',
    why: 'no OAuth parameters'
  },
  {
    method: 'GET',
    path: '/api/bluesky/team/callback',
    why: 'no session'
  }
];

test.describe('error responses', { tag: ['@security', '@prod-safe'] }, () => {
  test('never send a stack trace or an internal path', async ({
    request
  }, testInfo) => {
    for (const probe of MALFORMED) {
      const response = await send(request, probe);

      expectNoStackTrace(await response.text());
      testInfo.annotations.push({
        type: 'status',
        description: `${probe.method} ${probe.path}: ${response.status()}`
      });
    }
  });

  for (const probe of SERVER_ERRORS) {
    test(
      `${probe.method} ${probe.path} answers ${probe.why} with a 4xx`,
      knownBug(350),
      async ({ request }) => {
        const response = await send(request, probe);

        expect(response.status()).toBeLessThan(500);
      }
    );
  }

  test('the X picker refuses a malformed post URL', async ({ request }) => {
    for (const postUrl of [
      'nope',
      'https://example.com/a',
      'https://x.com/a/status/abc'
    ]) {
      const response = await request.post(LOAD_TWEET, { data: { postUrl } });

      expect(response.status(), postUrl).toBe(400);
      expect(await response.json()).toEqual({
        success: false,
        error: expect.any(String)
      });
    }
  });

  test(
    'the X picker answers a body without a post URL with 400',
    knownBug(350),
    async ({ request }) => {
      const response = await request.post(PICK_WINNERS, { data: {} });

      expect(response.status()).toBe(400);
      expect(await response.json()).toMatchObject({ success: false });
    }
  );

  test('the scrape stream needs a run id', async ({ request }) => {
    const response = await request.get(RESUME);

    expect(response.status()).toBe(400);
  });
});
