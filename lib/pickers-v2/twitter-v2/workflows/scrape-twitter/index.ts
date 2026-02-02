import { ScrapingProgressRequest } from '../../schemas/workflow';

export async function scrapeTwitterWorkflow({
  tweetId,
  pickerId,
  runDate
}: ScrapingProgressRequest) {
  'use workflow';
  console.log('Scraping Twitter workflow started for tweetId:', tweetId);
  // for (let i = 0; i < items.length; i++) {
  //   await processItem(items[i], i + 1, items.length);
  //   await sleep('1s');
  // }
  // await finalizeProgress();
}
