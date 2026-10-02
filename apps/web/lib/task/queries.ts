import { Prisma } from '@prisma/client';

export const ELIGIBLE_TASK_COMPLETION_INCLUDE_QUERY = {
  participant: {
    include: {
      user: {
        include: {
          quality: {
            take: 1,
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      }
    }
  },
  task: true
} satisfies Prisma.TaskCompletionInclude;

export type EligibleTaskCompletion = Prisma.TaskCompletionGetPayload<{
  include: typeof ELIGIBLE_TASK_COMPLETION_INCLUDE_QUERY;
}>;

export const SWEEPSTAKES_TASK_WHERE_QUERY = (input: {
  sweepstakesId?: string;
  slug: string;
  userId: string;
}) => {
  if (input.sweepstakesId) {
    return {
      sweepstakesId: input.sweepstakesId
    };
  }
  return {
    sweepstakes: {
      team: {
        slug: input.slug,
        members: {
          some: { userId: input.userId }
        }
      }
    }
  } satisfies Prisma.TaskWhereInput;
};
