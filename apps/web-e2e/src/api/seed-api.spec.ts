import { expect, test } from '../fixtures/test';
import { E2E_SECRET, RUN_ID } from '../env';
import { seedApi } from '../helpers/seed';

const PATHS = [
  ['GET', 'health'],
  ['GET', 'rows?view=team&slug=e2e-nope'],
  ['POST', 'teams'],
  ['POST', 'sweepstakes'],
  ['POST', 'janitor'],
  ['GET', 'jobs?id=nope'],
  ['POST', 'jobs/run'],
  ['POST', 'jobs/user'],
  ['DELETE', `runs/${RUN_ID}`],
  ['GET', 'does-not-exist']
] as const;

test.describe('seed API', { tag: '@security' }, () => {
  for (const [header, label] of [
    [undefined, 'without the secret'],
    ['x'.repeat(40), 'with a wrong secret']
  ] as const) {
    test(`hides every path from a caller ${label}`, async ({ request }) => {
      for (const [method, path] of PATHS) {
        const response = await request.fetch(`/api/e2e/${path}`, {
          method,
          headers: header ? { 'x-e2e-secret': header } : {},
          data: method === 'POST' ? {} : undefined
        });

        expect(response.status(), `${method} ${path}`).toBe(404);
        expect(await response.text(), `${method} ${path}`).toBe('');
      }
    });
  }

  test('reports the environment to a caller with the secret', async ({
    request
  }) => {
    test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');

    expect(await seedApi(request).health()).toEqual({
      environment: expect.stringMatching(/^(preview|development)$/),
      writes: expect.any(Boolean),
      allowPublic: expect.any(Boolean),
      fakes: expect.any(Array)
    });
  });
});
