import { NextRequest, NextResponse } from 'next/server';

import prisma from '@giveaway/db-client/prisma';
import { isValidCronSecret } from '@giveaway/jobs/util';
import { dataRetentionMode } from '@giveaway/jobs/retention';
import { runSweepstakesDataRetention } from '@giveaway/sweepstakes-jobs/run-data-retention';
import { runXPickerDataRetention } from '@giveaway/x-picker-server/run-data-retention';

const settle = async <T>(name: string, run: () => Promise<T>) => {
  try {
    return { ok: true as const, data: await run() };
  } catch (error) {
    console.error(`[retention] The ${name} retention failed`, error);
    return {
      ok: false as const,
      data: {
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred'
      }
    };
  }
};

export async function GET(request: NextRequest) {
  if (!isValidCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const mode = dataRetentionMode();
  const sweepstakes = await settle('sweepstakes', () =>
    runSweepstakesDataRetention(prisma, { mode })
  );
  const pickers = await settle('X picker', () =>
    runXPickerDataRetention(prisma, { mode })
  );

  console.log(
    `[retention] ${JSON.stringify({
      mode,
      sweepstakes: sweepstakes.ok ? sweepstakes.data.sweepstakes : 'failed',
      pickers: pickers.ok ? pickers.data.pickers : 'failed'
    })}`
  );

  return NextResponse.json({ mode, sweepstakes, pickers });
}
