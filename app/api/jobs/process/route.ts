import { NextRequest, NextResponse } from 'next/server';

import { processJobs } from '@/lib/pickers/procedures/process-jobs';
import { processTaskJobs } from '@/procedures/sweepstakes/process-task-jobs';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [pickerResults, sweepstakesResults] = await Promise.all([
    processJobs(),
    processTaskJobs()
  ]);

  return NextResponse.json({
    pickers: pickerResults,
    sweepstakes: sweepstakesResults
  });
}
