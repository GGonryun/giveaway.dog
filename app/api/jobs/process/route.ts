import { NextRequest, NextResponse } from 'next/server';

import { processPickerJobs } from '@/lib/pickers/twitter/procedures/process-picker-jobs';
import { processTaskJobs } from '@/lib/task/procedures/process-task-jobs';
import { processSweepstakesJobs } from '@/lib/sweepstakes/procedures/process-sweepstakes-jobs';
import { processAutomatedPostJobs } from '@/lib/automation/procedures/process-automated-post-jobs';
import { isValidCronSecret } from '@/lib/jobs/util';

export async function GET(request: NextRequest) {
  if (!isValidCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pickerResults = await processPickerJobs();
  const taskJobs = await processTaskJobs();
  const sweepstakesJobs = await processSweepstakesJobs();
  const automatedPostJobs = await processAutomatedPostJobs();

  return NextResponse.json({
    pickers: pickerResults,
    tasks: taskJobs,
    sweepstakes: sweepstakesJobs,
    posts: automatedPostJobs
  });
}
