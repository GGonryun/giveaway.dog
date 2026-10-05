import { NextRequest, NextResponse } from 'next/server';

import { processTaskJobs } from '@giveaway/task-jobs/process-task-jobs';
import { processSweepstakesJobs } from '@giveaway/sweepstakes-jobs/process-sweepstakes-jobs';
import { processAutomatedPostJobs } from '@giveaway/automation-server/process-automated-post-jobs';
import { isValidCronSecret } from '@giveaway/jobs/util';

export async function GET(request: NextRequest) {
  if (!isValidCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const taskJobs = await processTaskJobs();
  const sweepstakesJobs = await processSweepstakesJobs();
  const automatedPostJobs = await processAutomatedPostJobs();

  return NextResponse.json({
    tasks: taskJobs,
    sweepstakes: sweepstakesJobs,
    posts: automatedPostJobs
  });
}
