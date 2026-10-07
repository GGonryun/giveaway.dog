import { test as setup } from '@playwright/test';
import { seedApi } from '../helpers/seed';

setup('delete the e2e data that is older than a day', async ({ request }) => {
  const seed = seedApi(request);
  const health = await seed.health();
  setup.skip(!health?.writes, 'The seed API does not allow writes here');

  await seed.janitor();
});
