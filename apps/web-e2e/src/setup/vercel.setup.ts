import { expect, test as setup } from '@playwright/test';
import {
  APP_URL,
  BASE_URL,
  BYPASS_SECRET as secret,
  BYPASS_STATE
} from '../env';
import { userMetricsCookie } from '../helpers/user-metrics';
import { isLocalDeployment, warmUp } from '../helpers/warm-up';

setup.describe.configure({ mode: 'default' });

setup.use({ storageState: { cookies: [userMetricsCookie()], origins: [] } });

setup('compile the routes of the setup projects', async ({ request }) => {
  setup.skip(
    !isLocalDeployment(BASE_URL),
    'Only next dev compiles a route on its first request'
  );
  setup.setTimeout(600_000);

  const results = await warmUp(request);
  const notFound = results.filter(({ status }) => status === 404);

  for (const { path, status, attempts } of results) {
    console.log(`[warm-up] GET ${path} ${status} after ${attempts} attempt(s)`);
  }
  if (notFound.length > 0) {
    setup.info().annotations.push({
      type: 'warning',
      description: `Still 404 after the warm-up: ${notFound.map(({ path }) => path).join(', ')}`
    });
  }
});

setup('open the deployment', async ({ request }) => {
  const headers = secret
    ? {
        'x-vercel-protection-bypass': secret,
        'x-vercel-set-bypass-cookie': 'true'
      }
    : undefined;

  const response = await request.get('/', { headers });

  expect(
    response.ok(),
    `GET ${BASE_URL} returned ${response.status()}. A protected Vercel deployment needs VERCEL_AUTOMATION_BYPASS_SECRET.`
  ).toBe(true);
  expect(new URL(response.url()).host).toBe(new URL(BASE_URL).host);

  await request.storageState({ path: BYPASS_STATE });
});

setup(
  'build absolute URLs on the origin of the deployment',
  async ({ request }) => {
    const response = await request.get('/api/bluesky/client-metadata.json', {
      headers: secret ? { 'x-vercel-protection-bypass': secret } : undefined
    });

    expect(
      response.ok(),
      `GET /api/bluesky/client-metadata.json returned ${response.status()}`
    ).toBe(true);
    const { client_id } = await response.json();
    expect(new URL(client_id).origin).toBe(new URL(APP_URL).origin);
  }
);
