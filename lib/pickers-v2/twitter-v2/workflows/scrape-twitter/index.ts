import { sleep } from '@workflow/core';
import { ScrapingProgressRequest } from '../../schemas/workflow';
import { processItem, finalizeProgress } from './steps';

export async function scrapeTwitterWorkflow({
  tweetId,
  pickerId,
  runDate
}: ScrapingProgressRequest) {
  'use workflow';
  console.log(
    'Scraping Twitter workflow started for tweetId:',
    tweetId,
    pickerId,
    runDate
  );
  const MAX = 10;
  for (let i = 0; i < MAX; i++) {
    await processItem(MAX, i + 1);
    await sleep('5s');
  }
  await finalizeProgress();
}
