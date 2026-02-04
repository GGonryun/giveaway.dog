import { getWritable } from 'workflow';
import type { TwitterScrapeProgress } from '../../../schemas/workflow';

export async function finalizeProgress() {
  'use step';
  await getWritable<TwitterScrapeProgress>().close();
}
