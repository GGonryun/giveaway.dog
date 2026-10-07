import { test as teardown } from '@playwright/test';
import { RUN_ID } from '../env';
import { seedApi } from '../helpers/seed';

teardown('delete the data of the run', async ({ request }) => {
  const seed = seedApi(request);
  const health = await seed.health();
  teardown.skip(!health?.writes, 'The seed API does not allow writes here');

  const result = await seed.deleteRun(RUN_ID);
  teardown.info().annotations.push({
    type: 'cleanup',
    description: JSON.stringify(result)
  });
});
