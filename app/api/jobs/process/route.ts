import { NextRequest, NextResponse } from 'next/server';

import { processPickerJobs } from '@/lib/pickers/procedures/process-picker-jobs';
import { processTaskJobs } from '@/lib/task/procedures/process-task-jobs';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pickerResults = await processPickerJobs();
  const sweepstakesResults = await processTaskJobs();

  return NextResponse.json({
    pickers: pickerResults,
    sweepstakes: sweepstakesResults
  });
}
