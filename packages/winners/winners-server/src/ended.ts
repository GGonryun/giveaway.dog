import 'server-only';

import { PrismaClient } from '@giveaway/db-model';
import { toDerivedSweepstakeStatus } from '@giveaway/sweepstakes-model/sweepstakes';
import { ApplicationError } from '@giveaway/util-errors';

export const assertSweepstakesEnded = async ({
  db,
  sweepstakesId
}: {
  db: PrismaClient;
  sweepstakesId: string;
}) => {
  const sweepstakes = await db.sweepstakes.findUnique({
    where: { id: sweepstakesId },
    select: { status: true, timing: true }
  });

  if (!sweepstakes) {
    throw new ApplicationError({
      code: 'NOT_FOUND',
      message: `Sweepstakes with ID ${sweepstakesId} not found`
    });
  }

  const status = toDerivedSweepstakeStatus(sweepstakes);

  if (status !== 'EXPIRED' && status !== 'COMPLETED') {
    throw new ApplicationError({
      code: 'PRECONDITION_FAILED',
      message: 'Winners can only be drawn after the giveaway ends'
    });
  }
};
