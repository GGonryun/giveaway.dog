import { PrismaClient } from '@prisma/client';
import {
  ELIGIBLE_TASK_COMPLETION_INCLUDE_QUERY,
  EligibleTaskCompletion
} from '../task/queries';
import { toTaskSchema } from '../task/schemas';
import { RecursiveRequired } from '@/types/index';
import { User } from 'next-auth';
import { findUserSweepstakes } from '@/procedures/sweepstakes/shared';
import { ApplicationError } from '../errors';

import { SweepstakesCriteriaSchema } from './criteria';
import { countCompletionValue } from '../task/entries';

export type ExpandedEligibleTaskCompletion = EligibleTaskCompletion & {
  value: number;
};

export const expandCompletionsByValue = (
  completions: EligibleTaskCompletion[]
): ExpandedEligibleTaskCompletion[] => {
  const expanded: ExpandedEligibleTaskCompletion[] = [];

  for (const completion of completions) {
    expanded.push({ ...completion, value: countCompletionValue(completion) });
  }

  return expanded;
};

export const isEligibleTaskCompletion =
  (args: {
    userCompletionCounts: Map<string, number>;
    criteria: Omit<SweepstakesCriteriaSchema, 'allowMultipleWins'>;
  }) =>
  (completion: EligibleTaskCompletion) => {
    const { userCompletionCounts, criteria } = args;
    const { minQualityScore, minTasksCompleted, externalPlatforms } = criteria;
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

export const toUserCompletionCounts = (
  completions: EligibleTaskCompletion[]
) => {
  const userCompletionCounts = new Map<string, number>();

  for (const completion of completions) {
    const userId = completion.participant.userId;
    userCompletionCounts.set(
      userId,
      (userCompletionCounts.get(userId) || 0) + 1
    );
  }

  return userCompletionCounts;
};

export const getEligibleCompletions = async (args: {
  db: PrismaClient;
  user: RecursiveRequired<User>;
  sweepstakesId: string;
  criteria: SweepstakesCriteriaSchema;
}): Promise<ExpandedEligibleTaskCompletion[]> => {
  const { db, user, sweepstakesId, criteria } = args;
  await findUserSweepstakes({
    db,
    user,
    id: sweepstakesId
  });

  // Get all task completions for this sweepstakes
  const allTaskCompletions = await db.taskCompletion.findMany({
    where: {
      task: {
        sweepstakesId
      }
    },
    include: ELIGIBLE_TASK_COMPLETION_INCLUDE_QUERY
  });

  // Group by user and count their task completions
  const userCompletionCounts = toUserCompletionCounts(allTaskCompletions);

  // Filter users by criteria
  const eligibleTaskCompletions = allTaskCompletions.filter(
    isEligibleTaskCompletion({
      userCompletionCounts,
      criteria
    })
  );

  if (!eligibleTaskCompletions.length) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: 'No eligible participants meet the criteria'
    });
  }

  return expandCompletionsByValue(eligibleTaskCompletions);
};
