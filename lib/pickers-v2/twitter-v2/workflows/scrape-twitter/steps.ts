import { getWritable, sleep } from '@workflow/core';
import { ScrapingProgressUpdate } from '../../schemas/workflow';

export async function processItem(max: number, current: number, total: number) {
  'use step';
  const writable = getWritable<ScrapingProgressUpdate>();
  const writer = writable.getWriter();
  // Simulate processing
  await new Promise((resolve) => setTimeout(resolve, 2500));
  // Send progress update
  await writer.write({
    max,
    current,
    progress: Math.round((current / total) * 100)
  });
  writer.releaseLock();
}

export async function finalizeProgress() {
  'use step';
  await getWritable<ScrapingProgressUpdate>().close();
}
