import 'server-only';

import { sleep } from 'workflow';
import { loadAutomatedPostJob, postAutomatedPostJob } from './steps';

export async function automatedPostWorkflow({ jobId }: { jobId: string }) {
  'use workflow';

  for (;;) {
    const job = await loadAutomatedPostJob({ jobId });
    if (!job) return;
    if (!job.due) {
      await sleep(new Date(job.runAt));
      continue;
    }
    if (!(await postAutomatedPostJob({ jobId }))) return;
  }
}
