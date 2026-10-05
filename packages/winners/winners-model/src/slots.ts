import { PrismaClient, PrizeDrawResult } from '@giveaway/db-model';
import { ApplicationError } from '@giveaway/util-errors';

export type PrizeSlot = {
  prizeId: string;
};

export type DrawInfo = {
  drawId: string;
  userId: string;
};

export const getEmptyPrizeSlots = async (
  args:
    | {
        db: PrismaClient;
        sweepstakesId: string;
      }
    | {
        db: PrismaClient;
        sweepstakesId: string;
        prizeId: string;
      }
    | {
        db: PrismaClient;
        sweepstakesId: string;
        drawId: string;
      }
): Promise<PrizeSlot[]> => {
  const { db, sweepstakesId } = args;

  const prizes = await db.prize.findMany({
    where: {
      sweepstakesId,
      ...('prizeId' in args && { id: args.prizeId }),
      ...('drawId' in args && { draws: { some: { id: args.drawId } } })
    },
    include: {
      draws: true
    },
    orderBy: {
      index: 'asc'
    }
  });

  if (!prizes.length) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: 'No prizes found for this sweepstakes'
    });
  }

  // create slots
  const slots: PrizeSlot[] = [];
  for (const prize of prizes) {
    const quota = prize.quota ?? 1;
    const existingWinners = prize.draws.filter(
      (d) => d.result === PrizeDrawResult.WINNER
    ).length;

    const slotsToFill = quota - existingWinners;

    for (let i = 0; i < slotsToFill; i++) {
      slots.push({ prizeId: prize.id });
    }
  }

  if (slots.length === 0) {
    throw new ApplicationError({
      code: 'CONFLICT',
      message: 'All prize slots are already filled'
    });
  }

  return slots;
};

export const getDrawsInfo = async (args: {
  db: PrismaClient;
  sweepstakesId: string;
}): Promise<DrawInfo[]> => {
  const { db, sweepstakesId } = args;

  const draws = await db.prizeDraw.findMany({
    where: {
      prize: {
        sweepstakesId: sweepstakesId
      }
    },
    include: {
      taskCompletion: {
        include: {
          participant: true
        }
      }
    }
  });

  return draws.map((draw) => ({
    drawId: draw.id,
    userId: draw.taskCompletion.participant.userId
  }));
};

export const getPrizeAllocations = async (args: {
  db: PrismaClient;
  sweepstakesId: string;
}) => {
  const { db, sweepstakesId } = args;

  const allocations = await db.sweepstakesAllocation.findMany({
    where: {
      participant: {
        sweepstakesId
      }
    }
  });

  return allocations;
};
