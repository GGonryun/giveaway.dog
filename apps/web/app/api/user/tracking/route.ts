import prisma from '@giveaway/db-client/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { runUserTracking } from '@giveaway/scoring-server/run-user-tracking';
import { isValidCronSecret } from '@giveaway/jobs/util';

export async function GET(request: NextRequest) {
  if (!isValidCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    return NextResponse.json({
      success: true,
      ...(await runUserTracking(prisma))
    });
  } catch (error) {
    console.error('Tracking aggregation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
