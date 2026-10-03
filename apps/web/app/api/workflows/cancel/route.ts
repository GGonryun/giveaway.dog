import { isValidCronSecret } from '@giveaway/jobs/util';
import { NextRequest, NextResponse } from 'next/server';
import { getWorld } from 'workflow/runtime';

export async function POST(request: NextRequest) {
  if (!isValidCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { runId } = await request.json();
  if (!runId) {
    return Response.json({ error: 'No runId provided' }, { status: 400 });
  }
  try {
    const world = getWorld();
    const run = await world.runs.cancel(runId);
    return Response.json({ status: run.status });
  } catch (error) {
    return Response.json(
      { error: 'Failed to cancel workflow run' },
      { status: 500 }
    );
  }
}
