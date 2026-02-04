import { getWritable } from 'workflow';
import type { TwitterScrapeProgress } from '../../../schemas/workflow';
import { writeProgress } from './write-progress';

export async function finalizeProgress(retweets: number) {
  'use step';
  await writeProgress({
    max: retweets,
    current: retweets,
    status: 'COMPLETE'
  });
  await getWritable<TwitterScrapeProgress>().close();
}
