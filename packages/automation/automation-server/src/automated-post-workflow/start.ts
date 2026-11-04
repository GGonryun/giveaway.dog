import 'server-only';

import { AutomatedPostJobStatus, PrismaClient } from '@giveaway/db-model';
import { start } from 'workflow/api';
import { getWorld } from 'workflow/runtime';
import { automatedPostWorkflow } from './workflow';

export const cancelAutomatedPostRun = async (runId: string) => {
  try {
    const world = getWorld();
    const run = await world.runs.get(runId);
    if (run.status === 'running' || run.status === 'pending') {
      await world.runs.cancel(runId);
    }
  } catch (error) {
    console.warn(`Failed to cancel automated post run ${runId}:`, error);
  }
};

export const startAutomatedPostWorkflow = async (
  db: PrismaClient,
  jobId: string
) => {
  try {
    const job = await db.automatedPostJob.findUnique({
      where: { id: jobId },
      select: { runId: true }
    });
    if (!job) return;

    await db.automatedPostJob.updateMany({
      where: { id: jobId, runId: job.runId },
      data: { runId: null }
    });

    const { runId } = await start(automatedPostWorkflow, [{ jobId }]);

    const { count } = await db.automatedPostJob.updateMany({
      where: { id: jobId, runId: null },
      data: { runId }
    });
    if (count === 0) {
      await cancelAutomatedPostRun(runId);
    }

    if (job.runId) {
      await cancelAutomatedPostRun(job.runId);
    }
  } catch (error) {
    console.error(
      `Failed to start the workflow of automated post job ${jobId}:`,
      error
    );
  }
};

export const rescheduleAutomatedPostWorkflows = async (
  db: PrismaClient,
  sweepstakesId: string
) => {
  try {
    const jobs = await db.automatedPostJob.findMany({
      where: { sweepstakesId, status: AutomatedPostJobStatus.PENDING },
      select: { id: true }
    });
    for (const job of jobs) {
      await startAutomatedPostWorkflow(db, job.id);
    }
  } catch (error) {
    console.error(
      `Failed to reschedule the automated posts of sweepstakes ${sweepstakesId}:`,
      error
    );
  }
};
