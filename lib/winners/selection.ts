import { Prisma, PrizeDrawResult } from '@prisma/client';
import { ExpandedEligibleTaskCompletion } from './completions';
import { DrawInfo, PrizeSlot } from './slots';
import {
  pickManyWeighted,
  pickUniqueWeighted,
  WeightedItem
} from './weighted-rolls';
import { ApplicationError } from '../errors';
import { nanoid } from 'nanoid';
import { SweepstakesCriteriaSchema } from './criteria';

export type PrizeDrawProps = {
  slots: PrizeSlot[];
  draws: DrawInfo[];
  criteria: SweepstakesCriteriaSchema;
  completions: ExpandedEligibleTaskCompletion[];
  allocations: Prisma.SweepstakesAllocationGetPayload<{}>[];
};

/**
 * Picks unique winners for a prize draw, ensuring no participant wins more
 * than once and automatically removes any user that was previously drawn,
 * even those who were disqualified!
 */
export const toUniquePrizeDraw = (
  args: PrizeDrawProps
): Prisma.PrizeDrawCreateManyInput[] => {
  const { slots, draws } = args;

  // filter out completions that have already been included in a draw
  const eligibleCompletions = args.completions.filter(
    (completion) =>
      !draws.some((draw) => draw.userId === completion.participant.userId)
  );

  const winnersData: Prisma.PrizeDrawCreateManyInput[] = [];
  const pickedUserIds = new Set<string>();

  for (let i = 0; i < slots.length; i++) {
    let availableCompletions = eligibleCompletions
      // filter out users that have already been picked in this draw operation
      .filter(
        (completion) => !pickedUserIds.has(completion.participant.userId)
      );

    // filter out user's who do not have an allocation for this prize slot
    if (args.criteria.allowUserSelection) {
      availableCompletions = availableCompletions.filter((completion) =>
        args.allocations.some(
          (alloc) =>
            alloc.participantId === completion.participant.id &&
            alloc.prizeId === slots[i].prizeId
        )
      );
    }

    if (availableCompletions.length === 0) {
      continue;
    }

    const weightedCompletions: WeightedItem<ExpandedEligibleTaskCompletion>[] =
      availableCompletions.map((completion) => ({
        item: completion,
        weight: completion.value
      }));

    const pickedWinners = pickUniqueWeighted(weightedCompletions, 1);
    const winner = pickedWinners[0];

    pickedUserIds.add(winner.participant.userId);

    winnersData.push({
      id: nanoid(),
      prizeId: slots[i].prizeId,
      result: PrizeDrawResult.WINNER,
      taskCompletionId: winner.id
    });
  }

  return winnersData;
};

/**
 * Picks multiple winners for a prize draw, allowing for duplicate winners.
 * Rolls per-slot to take into account user allocations for each specific prize.
 */
export const toDuplicatePrizeDraw = (
  args: PrizeDrawProps
): Prisma.PrizeDrawCreateManyInput[] => {
  const { slots, completions, criteria, allocations } = args;
  const winnersData: Prisma.PrizeDrawCreateManyInput[] = [];

  for (let i = 0; i < slots.length; i++) {
    let eligibleCompletions = completions;

    if (criteria.allowUserSelection) {
      eligibleCompletions = completions.filter((completion) =>
        allocations.some(
          (alloc) =>
            alloc.participantId === completion.participant.id &&
            alloc.prizeId === slots[i].prizeId
        )
      );
    }

    if (eligibleCompletions.length === 0) {
      continue;
    }

    const weightedCompletions: WeightedItem<ExpandedEligibleTaskCompletion>[] =
      eligibleCompletions.map((completion) => ({
        item: completion,
        weight: completion.value
      }));

    const pickedWinners = pickManyWeighted(weightedCompletions, 1);

    if (pickedWinners.length < 1) {
      throw new ApplicationError({
        code: 'VALIDATION_ERROR',
        message: `Not enough eligible participants to fill prize slot for prize ${slots[i].prizeId}`
      });
    }

    winnersData.push({
      id: nanoid(),
      prizeId: slots[i].prizeId,
      result: PrizeDrawResult.WINNER,
      taskCompletionId: pickedWinners[0].id
    });
  }

  return winnersData;
};
