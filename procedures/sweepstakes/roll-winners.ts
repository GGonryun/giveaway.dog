'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { z } from 'zod';
import { ApplicationError } from '@/lib/errors';
import { findUserSweepstakes } from './shared';
import { nanoid } from 'nanoid';

import { Prisma, PrismaClient, PrizeDrawResult } from '@prisma/client';
import { rng } from '@/lib/rng';
import {
  SWEEPSTAKES_TASK_WHERE_QUERY,
  ELIGIBLE_TASK_COMPLETION_INCLUDE_QUERY,
  EligibleTaskCompletion
} from '@/lib/task/queries';
import { toTaskSchema } from '@/lib/task/schemas';

const expandCompletionsByValue = (
  completions: EligibleTaskCompletion[]
): EligibleTaskCompletion[] => {
  const expanded: EligibleTaskCompletion[] = [];

  for (const completion of completions) {
    const taskSchema = toTaskSchema(completion.task);
    const value = taskSchema.value;

    for (let i = 0; i < value; i++) {
      expanded.push(completion);
    }
  }

  return expanded;
};

const rollWinners = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      sweepstakesId: z.string(),
      slug: z.string(),
      minQualityScore: z.number().min(0).max(100),
      minTasksCompleted: z.number().min(1).optional().default(1),
      preventDuplicateWinners: z.boolean(),
      rerollWinnerId: z.string().optional(),
      disqualificationReason: z.string().optional(),
      prizeId: z.string().optional(),
      winnersCount: z.number().min(1).optional()
    })
  )
  .output(z.object({ success: z.boolean() }))
  .handler(
    async ({
      input: {
        sweepstakesId,
        slug,
        minQualityScore,
        minTasksCompleted,
        preventDuplicateWinners,
        rerollWinnerId,
        disqualificationReason,
        prizeId,
        winnersCount
      },
      db,
      user
    }) => {
      await findUserSweepstakes({
        db,
        user,
        id: sweepstakesId
      });

      const sweepstakesWithCriteria = await db.sweepstakes.findUnique({
        where: { id: sweepstakesId },
        include: { criteria: true }
      });

      const externalPlatforms = sweepstakesWithCriteria?.criteria
        ?.externalPlatforms as string[] | null;

      const prizes = await db.prize.findMany({
        where: {
          sweepstakesId
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

      const taskQuery = SWEEPSTAKES_TASK_WHERE_QUERY({
        sweepstakesId,
        slug,
        userId: user.id
      });

      // Get all task completions for this sweepstakes
      const allTaskCompletions = await db.taskCompletion.findMany({
        where: {
          task: taskQuery
        },
        include: ELIGIBLE_TASK_COMPLETION_INCLUDE_QUERY
      });

      // Group by user and count their task completions
      const userCompletionCounts = new Map<string, number>();
      const userCompletions = new Map<
        string,
        (typeof allTaskCompletions)[0][]
      >();

      for (const completion of allTaskCompletions) {
        const userId = completion.participant.userId;
        userCompletionCounts.set(
          userId,
          (userCompletionCounts.get(userId) || 0) + 1
        );

        if (!userCompletions.has(userId)) {
          userCompletions.set(userId, []);
        }
        userCompletions.get(userId)!.push(completion);
      }

      // Filter users by criteria
      const eligibleTaskCompletions = allTaskCompletions.filter(
        isEligibleTaskCompletion({
          userCompletionCounts,
          minQualityScore,
          minTasksCompleted,
          externalPlatforms
        })
      );

      if (!eligibleTaskCompletions.length) {
        throw new ApplicationError({
          code: 'VALIDATION_ERROR',
          message: 'No eligible participants meet the criteria'
        });
      }

      if (rerollWinnerId) {
        await rerollWinner(db, {
          disqualificationReason,
          rerollWinnerId,
          eligibleTaskCompletions
        });
      } else {
        await pickWinners(db, {
          eligibleTaskCompletions,
          prizes,
          preventDuplicateWinners,
          prizeId,
          winnersCount
        });
      }

      return { success: true };
    }
  );

const rerollWinner = async (
  db: PrismaClient,
  args: {
    disqualificationReason?: string;
    rerollWinnerId: string;
    eligibleTaskCompletions: EligibleTaskCompletion[];
  }
) => {
  const { disqualificationReason, rerollWinnerId, eligibleTaskCompletions } =
    args;
  if (!disqualificationReason || disqualificationReason.trim() === '') {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: 'Disqualification reason is required when re-rolling a winner'
    });
  }

  const existingWinner = await db.prizeDraw.findUnique({
    where: {
      id: rerollWinnerId
    }
  });

  if (!existingWinner) {
    throw new ApplicationError({
      code: 'NOT_FOUND',
      message: 'Winner not found'
    });
  }

  if (existingWinner.result === PrizeDrawResult.DISQUALIFIED) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: 'Cannot re-roll a winner that has already been disqualified'
    });
  }

  const disqualifiedUsers = await db.prizeDraw.findMany({
    where: {
      result: PrizeDrawResult.DISQUALIFIED,
      prizeId: existingWinner.prizeId
    },
    include: {
      taskCompletion: {
        include: {
          participant: {
            include: {
              user: true
            }
          }
        }
      }
    }
  });

  const newlyEligibleCompletions = eligibleTaskCompletions.filter(
    (completion) => {
      // Exclude the current winner
      if (completion.id === existingWinner.taskCompletionId) {
        return false;
      }

      // Exclude previously disqualified users for this prize
      for (const disqualified of disqualifiedUsers) {
        if (
          completion.participant.user.id ===
          disqualified.taskCompletion.participant.user.id
        ) {
          return false;
        }
      }

      return true;
    }
  );

  const weightedCompletions = expandCompletionsByValue(
    newlyEligibleCompletions
  );
  const randomizedCompletions = rng.shuffleArray(weightedCompletions);

  if (randomizedCompletions.length === 0) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message:
        'No more eligible participants available for re-rolling the winner'
    });
  }

  const [newWinningTask] = randomizedCompletions;

  await db.$transaction(async (tx) => {
    await tx.prizeDraw.update({
      where: {
        id: rerollWinnerId
      },
      data: {
        result: PrizeDrawResult.DISQUALIFIED,
        disqualificationReason: disqualificationReason.trim()
      }
    });

    await tx.prizeDraw.create({
      data: {
        id: nanoid(),
        prizeId: existingWinner.prizeId,
        taskCompletionId: newWinningTask.id,
        result: PrizeDrawResult.WINNER,
        previousDrawId: rerollWinnerId
      }
    });
  });
};

const pickWinners = async (
  db: PrismaClient,
  args: {
    eligibleTaskCompletions: EligibleTaskCompletion[];
    prizes: Prisma.PrizeGetPayload<{
      include: { draws: true };
    }>[];
    preventDuplicateWinners: boolean;
    prizeId?: string;
    winnersCount?: number;
  }
) => {
  const {
    eligibleTaskCompletions,
    prizes,
    preventDuplicateWinners,
    prizeId,
    winnersCount
  } = args;
  const emptySlots: { prizeId: string }[] = [];

  // If specific prize is provided, only process that prize
  const prizesToProcess = prizeId
    ? prizes.filter((p) => p.id === prizeId)
    : prizes;

  if (prizeId && prizesToProcess.length === 0) {
    throw new ApplicationError({
      code: 'NOT_FOUND',
      message: 'Prize not found'
    });
  }

  for (const prize of prizesToProcess) {
    const quota = prize.quota ?? 1;
    const existingWinners = prize.draws.filter(
      (d) => d.result === PrizeDrawResult.WINNER
    ).length;

    // If specific winnersCount is provided, draw that many winners
    // Otherwise, fill all empty slots
    const slotsToFill = winnersCount
      ? Math.min(winnersCount, quota - existingWinners)
      : quota - existingWinners;

    for (let i = 0; i < slotsToFill; i++) {
      emptySlots.push({ prizeId: prize.id });
    }
  }

  if (emptySlots.length === 0) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: prizeId
        ? 'This prize has no empty slots or requested winners count is invalid'
        : 'All prize slots are already filled'
    });
  }

  const weightedCompletions = expandCompletionsByValue(eligibleTaskCompletions);
  const randomizedCompletions = rng.shuffleArray(weightedCompletions);

  if (preventDuplicateWinners) {
    const uniqueWinners: typeof eligibleTaskCompletions = [];
    const seenUserIds = new Set<string>();

    for (const completion of randomizedCompletions) {
      if (!seenUserIds.has(completion.participant.user.id)) {
        uniqueWinners.push(completion);
        seenUserIds.add(completion.participant.user.id);
      }
    }

    if (uniqueWinners.length < emptySlots.length) {
      throw new ApplicationError({
        code: 'VALIDATION_ERROR',
        message: `Not enough unique participants (${uniqueWinners.length}) to fill ${emptySlots.length} empty slots`
      });
    }

    for (let i = 0; i < emptySlots.length; i++) {
      await db.prizeDraw.create({
        data: {
          id: nanoid(),
          prizeId: emptySlots[i].prizeId,
          result: PrizeDrawResult.WINNER,
          taskCompletionId: uniqueWinners[i].id
        }
      });
    }
  } else {
    for (let i = 0; i < emptySlots.length; i++) {
      const completionIndex = i % randomizedCompletions.length;
      await db.prizeDraw.create({
        data: {
          id: nanoid(),
          result: PrizeDrawResult.WINNER,
          prizeId: emptySlots[i].prizeId,
          taskCompletionId: randomizedCompletions[completionIndex].id
        }
      });
    }
  }
};

const isEligibleTaskCompletion =
  (args: {
    userCompletionCounts: Map<string, number>;
    minQualityScore: number;
    minTasksCompleted: number;
    externalPlatforms: string[] | null;
  }) =>
  (completion: EligibleTaskCompletion) => {
    const {
      userCompletionCounts,
      minQualityScore,
      minTasksCompleted,
      externalPlatforms
    } = args;
    const userId = completion.participant.user.id;
    const userQuality = completion.participant.user.quality[0]?.score ?? 0;
    const userTaskCount = userCompletionCounts.get(userId) || 0;
    const userSource = completion.participant.user.source;

    // Check external platform source filter
    if (externalPlatforms && externalPlatforms.length > 0) {
      if (!externalPlatforms.includes(userSource)) {
        return false;
      }
    }

    // Check quality score
    if (userQuality < minQualityScore) return false;

    // Check minimum tasks completed
    if (userTaskCount < minTasksCompleted) return false;

    return true;
  };

export default rollWinners;
