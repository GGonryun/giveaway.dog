import { getWritable, sleep } from '@workflow/core';

async function writeProgress(message: string) {
  'use step';
  // Steps can write to the run's default stream
  const writable = getWritable<string>();
  const writer = writable.getWriter();
  try {
    await writer.write(message);
  } finally {
    writer.releaseLock();
  }
}

async function finalizeProgress() {
  'use step';
  await getWritable().close();
}

export async function simpleStreamingWorkflow(tweetId: string) {
  'use workflow';

  const max = 15;
  await writeProgress(`Starting task ${tweetId}...`);
  for (let i = 0; i < max; i++) {
    await writeProgress(`Processing step ${i + 1} of ${max}...`);
    await sleep(`${i + 1}s`); // Sleep will suspend without consuming any resources
  }
  await writeProgress('Task completed successfully!');
  await finalizeProgress();
}

// export async function handleProcessPicker(tweetId: string) {
//   'use workflow';
//   const response = await getScrapeBadgerRetweeters({
//     tweetId
//   });

//   await fetch('/api/pickers/twitter-v2/complete', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       Authorization: `Bearer ${process.env.CRON_SECRET}`
//     },
//     body: JSON.stringify({
//       jobData: response
//     })
//   });
// }
