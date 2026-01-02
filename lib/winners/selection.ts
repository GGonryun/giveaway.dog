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

export type PrizeDrawProps = {
  slots: PrizeSlot[];
  draws: DrawInfo[];
  completions: ExpandedEligibleTaskCompletion[];
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
    // filter out users that have already been picked in this draw operation
    const availableCompletions = eligibleCompletions.filter(
      (completion) => !pickedUserIds.has(completion.participant.userId)
    );

    if (availableCompletions.length === 0) {
      throw new ApplicationError({
        code: 'VALIDATION_ERROR',
        message: `Not enough eligible participants to fill ${slots.length} empty prize slots`
      });
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
 * Picks multiple winners for a prize draw, allowing for duplicate winners
 */
export const toDuplicatePrizeDraw = (
  args: PrizeDrawProps
): Prisma.PrizeDrawCreateManyInput[] => {
  const { slots, completions } = args;
  const weightedCompletions: WeightedItem<ExpandedEligibleTaskCompletion>[] =
    completions.map((completion) => ({
      item: completion,
      weight: completion.value
    }));

  const pickedWinners = pickManyWeighted(weightedCompletions, slots.length);

  if (pickedWinners.length < slots.length) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: `Not enough eligible participants (${pickedWinners.length}) to fill ${slots.length} empty prize slots`
    });
  }

  const winnersData: Prisma.PrizeDrawCreateManyInput[] = [];

  for (let i = 0; i < slots.length; i++) {
    winnersData.push({
      id: nanoid(),
      prizeId: slots[i].prizeId,
      result: PrizeDrawResult.WINNER,
      taskCompletionId: pickedWinners[i].id
    });
  }

  return winnersData;
};
