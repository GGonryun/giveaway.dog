import { NextRequest, NextResponse } from 'next/server';

import prisma from '@giveaway/db-client/prisma';
import { runTaskJobs } from '@giveaway/task-jobs/run-task-jobs';
import { runSweepstakesJobs } from '@giveaway/sweepstakes-jobs/run-sweepstakes-jobs';
import { runAutomatedPostJobs } from '@giveaway/automation-server/run-automated-post-jobs';
import { isValidCronSecret } from '@giveaway/jobs/util';
import { ApplicationError } from '@giveaway/util-errors';

const settle = async <T>(name: string, run: () => Promise<T>) => {
  try {
    return { ok: true as const, data: await run() };
  } catch (error) {
    console.error(`The ${name} job processor failed`, error);
    return {
      ok: false as const,
      data: {
        code:
          error instanceof ApplicationError
            ? error.code
            : 'INTERNAL_SERVER_ERROR',
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

  const tasks = await settle('task', () => runTaskJobs(prisma));
  const sweepstakes = await settle('sweepstakes', () =>
    runSweepstakesJobs(prisma)
  );
  const posts = await settle('automated post', () =>
    runAutomatedPostJobs(prisma)
  );

  return NextResponse.json({ tasks, sweepstakes, posts });
}
