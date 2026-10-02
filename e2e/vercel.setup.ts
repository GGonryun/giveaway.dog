import { expect, test as setup } from '@playwright/test';
import { BASE_URL, BYPASS_STATE } from './env';

setup('open the deployment', async ({ request }) => {
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
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
