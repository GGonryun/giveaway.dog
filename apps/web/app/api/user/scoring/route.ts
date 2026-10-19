import prisma from '@giveaway/db-client/prisma';

import { NextRequest, NextResponse } from 'next/server';

import { runUserScoring } from '@giveaway/scoring-server/run-user-scoring';
import { isValidCronSecret } from '@giveaway/jobs/util';

export async function GET(request: NextRequest) {
  if (!isValidCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(await runUserScoring(prisma));
}
