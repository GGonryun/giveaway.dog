import prisma from '@giveaway/db-client/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { isValidCronSecret } from '@giveaway/jobs/util';
import { runTracking } from '@giveaway/scoring-server/tracking';

export async function GET(request: NextRequest) {
  if (!isValidCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runTracking(prisma);

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Tracking aggregation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
