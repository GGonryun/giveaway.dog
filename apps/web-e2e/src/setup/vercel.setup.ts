import { expect, test as setup } from '@playwright/test';
import { BASE_URL, BYPASS_SECRET as secret, BYPASS_STATE } from '../env';
import { userMetricsCookie } from '../helpers/user-metrics';

setup.use({ storageState: { cookies: [userMetricsCookie()], origins: [] } });

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
    expect(new URL(client_id).origin).toBe(new URL(BASE_URL).origin);
  }
);
