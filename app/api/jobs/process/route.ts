import { NextRequest, NextResponse } from 'next/server';

import { processPickerJobs } from '@/lib/pickers/procedures/process-picker-jobs';
import { processTaskJobs } from '@/lib/task/procedures/process-task-jobs';
import { processSweepstakesJobs } from '@/lib/sweepstakes/procedures/process-sweepstakes-jobs';
import { processAutomatedPostJobs } from '@/lib/automation/procedures/process-automated-post-jobs';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
