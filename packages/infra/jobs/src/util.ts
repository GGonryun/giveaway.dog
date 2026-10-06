import 'server-only';

import { timingSafeEqual } from 'crypto';
import {
  PrismaClient,
  SweepstakesJobStatus,
  SweepstakesJobType
} from '@giveaway/db-model';
import { NextRequest } from 'next/server';

export const isValidCronSecret = (request: NextRequest) => {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (!secret || authHeader === null) {
    return false;
  }
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(authHeader);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};

export const scheduleRandomlyAssignPrizesJob = async ({
  db,
  sweepstakesId
}: {
  db: PrismaClient;
  sweepstakesId: string;
}) => {
  await db.sweepstakesJob.upsert({
    where: {
      sweepstakesId_type: {
        sweepstakesId,
        type: SweepstakesJobType.RANDOMLY_ASSIGN_PRIZES
      }
    },
    create: {
      sweepstakesId: sweepstakesId,
      type: SweepstakesJobType.RANDOMLY_ASSIGN_PRIZES,
      status: SweepstakesJobStatus.PENDING,
      runAt: new Date()
    },
    update: {
      status: SweepstakesJobStatus.PENDING,
      runAt: new Date()
    }
  });
};
