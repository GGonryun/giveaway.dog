import { getWritable, sleep } from '@workflow/core';
import { ScrapingProgressUpdate } from '../schemas/workflow';

async function processItem(item: string, current: number, total: number) {
  'use step';
  const writable = getWritable<ScrapingProgressUpdate>();
  const writer = writable.getWriter();
  // Simulate processing
  await new Promise((resolve) => setTimeout(resolve, 2500));
  // Send progress update
  await writer.write({
    current,
    max: total,
    progress: Math.round((current / total) * 100)
  });
  writer.releaseLock();
}

async function finalizeProgress() {
  'use step';
  await getWritable<ScrapingProgressUpdate>().close();
}

export async function batchProcessingWorkflow(items: string[]) {
  'use workflow';
  for (let i = 0; i < items.length; i++) {
    await processItem(items[i], i + 1, items.length);
    await sleep('1s');
  }
  await finalizeProgress();
}
