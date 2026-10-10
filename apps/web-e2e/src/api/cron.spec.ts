import { expect, test } from '../fixtures/test';
import { expectNoStackTrace } from '../helpers/http';

const ENDPOINTS = [
  { method: 'GET', path: '/api/jobs/process' },
  { method: 'GET', path: '/api/user/tracking' },
  { method: 'GET', path: '/api/user/scoring' },
  { method: 'POST', path: '/api/workflows/cancel' },
  { method: 'POST', path: '/api/workflows/twitter/scrape/start' }
] as const;

const AUTHORIZATIONS: { name: string; headers: Record<string, string> }[] = [
  { name: 'no header', headers: {} },
  { name: 'a wrong secret', headers: { Authorization: 'Bearer wrong' } },
  {
    name: 'the secret of a deployment without CRON_SECRET',
    headers: { Authorization: 'Bearer undefined' }
  },
  { name: 'an empty secret', headers: { Authorization: 'Bearer ' } },
  { name: 'no Bearer scheme', headers: { Authorization: 'undefined' } }
];

test.describe('cron and workflow endpoints', { tag: '@security' }, () => {
  for (const { method, path } of ENDPOINTS) {
    test(`${method} ${path} refuses a caller without the cron secret`, async ({
      request
    }) => {
      for (const { name, headers } of AUTHORIZATIONS) {
        const response = await request.fetch(path, {
          method,
          headers,
          data: method === 'POST' ? {} : undefined
        });

        expect(response.status(), `${method} ${path} with ${name}`).toBe(401);
        const body = await response.text();
        expectNoStackTrace(body);
        expect(JSON.parse(body)).toEqual({ error: 'Unauthorized' });
      }
    });
  }

  test(
    'POST /api/workflows/cancel refuses Bearer undefined',
    { tag: '@prod-safe' },
    async ({ request }) => {
      // With an unset CRON_SECRET this request would pass the check. It
      // still cancels nothing: the empty body has no runId, so it gets 400.
      const response = await request.post('/api/workflows/cancel', {
        headers: { Authorization: 'Bearer undefined' },
        data: {}
      });

      expect(response.status()).toBe(401);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
    }
  );
});
