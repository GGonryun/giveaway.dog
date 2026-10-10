import { NextRequest, NextResponse } from 'next/server';

import prisma from '@giveaway/db-client/prisma';
import { runTaskJobs } from '@giveaway/task-jobs/process-task-jobs';
import { runSweepstakesJobs } from '@giveaway/sweepstakes-jobs/process-sweepstakes-jobs';
import { runAutomatedPostJobs } from '@giveaway/automation-server/process-automated-post-jobs';
import { isValidCronSecret } from '@giveaway/jobs/util';
import { settle } from '@giveaway/rpc-server/errors';

export async function GET(request: NextRequest) {
  if (!isValidCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const taskJobs = await settle(runTaskJobs(prisma));
  const sweepstakesJobs = await runSweepstakesJobs(prisma);
  const automatedPostJobs = await settle(runAutomatedPostJobs(prisma));

  return NextResponse.json({
    tasks: taskJobs,
    sweepstakes: sweepstakesJobs,
    posts: automatedPostJobs
  });
}
