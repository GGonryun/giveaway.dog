import 'server-only';

import prisma from '@giveaway/db-client/prisma';
import { AutomatedPostJobStatus } from '@giveaway/db-model';
import { getWorkflowMetadata } from 'workflow';
import { runAutomatedPostJob } from '../run-automated-post-jobs';

export async function loadAutomatedPostJob({ jobId }: { jobId: string }) {
  'use step';

  const { workflowRunId } = getWorkflowMetadata();
  const job = await prisma.automatedPostJob.findUnique({
    where: { id: jobId },
    select: { status: true, runAt: true, runId: true }
  });

  if (!job || job.status !== AutomatedPostJobStatus.PENDING) return null;
  if (job.runId !== null && job.runId !== workflowRunId) return null;

  return {
    runAt: job.runAt.toISOString(),
    due: job.runAt.getTime() <= Date.now()
  };
}

export async function postAutomatedPostJob({ jobId }: { jobId: string }) {
  'use step';

  return runAutomatedPostJob(prisma, { jobId });
}
