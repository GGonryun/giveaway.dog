import 'server-only';

import { Prisma, SweepstakesStatus, TeamTier } from '@giveaway/db-model';
import {
  exceedsSweepstakesDuration,
  sweepstakesDurationMessage
} from '@giveaway/team-model/team/limits';
import { ApplicationError } from '@giveaway/util-errors';

type DateInput = Date | string | number | null | undefined;

const toDate = (value: DateInput): Date | null => {
  const date = new Date(value ?? Number.NaN);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isSameDate = (saved: Date | null, date: Date) =>
  saved?.getTime() === date.getTime();

export const assertSweepstakesDuration = async ({
  db,
  sweepstakes,
  tier,
  timing
}: {
  db: Prisma.TransactionClient;
  sweepstakes: { id: string; status: SweepstakesStatus };
  tier: TeamTier | null | undefined;
  timing: { startDate?: DateInput; endDate?: DateInput } | undefined;
}) => {
  const startDate = toDate(timing?.startDate);
  const endDate = toDate(timing?.endDate);
  if (!startDate || !endDate) return;
  if (!exceedsSweepstakesDuration({ tier, startDate, endDate })) return;

  if (sweepstakes.status !== SweepstakesStatus.DRAFT) {
    const saved = await db.sweepstakesTiming.findUnique({
      where: { sweepstakesId: sweepstakes.id },
      select: { startDate: true, endDate: true }
    });
    if (
      saved &&
      isSameDate(saved.startDate, startDate) &&
      isSameDate(saved.endDate, endDate)
    ) {
      return;
    }
  }

  throw new ApplicationError({
    code: 'FORBIDDEN',
    message: `${sweepstakesDurationMessage(tier)}. Upgrade the team to run a longer giveaway.`
  });
};
