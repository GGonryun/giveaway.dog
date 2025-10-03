import { UNKNOWN_USER_COUNTRY_CODE, UNKNOWN_USER_AGENT } from '@/lib/settings';
import { Prisma } from '@prisma/client';
import { toTaskCompletionSchema } from './giveaway/participant';
import { toTaskInput } from './giveaway/input';
import { taskSchema } from './tasks/schemas';
import { DEFAULT_SWEEPSTAKES_NAME } from './giveaway/defaults';

export const TASK_COMPLETION_INCLUDE_QUERY = {
  task: {
    include: {
      sweepstakes: {
        include: {
          details: true
        }
      }
    }
  }
} satisfies Prisma.TaskCompletionInclude;

export const toTaskCompletion = (
  entry: Prisma.TaskCompletionGetPayload<{
    include: typeof TASK_COMPLETION_INCLUDE_QUERY;
  }>
): toTaskCompletionSchema => {
  const raw = toTaskInput(entry.task);
  const task = taskSchema.safeParse(raw);
  if (!task.success) {
    throw new Error('Invalid task config in entry');
  }
  return {
    completionId: entry.id,
    completedAt: entry.completedAt,
    taskId: entry.taskId,
    taskName: task.data.title,
    sweepstakeId: entry.task.sweepstakes.id,
    sweepstakeName:
      entry.task.sweepstakes.details?.name ?? DEFAULT_SWEEPSTAKES_NAME
  };
};

export const SWEEPSTAKES_TASK_WHERE_QUERY = (input: {
  sweepstakesId?: string;
  slug: string;
  userId: string;
}) => ({
  sweepstakesId: input.sweepstakesId,
  sweepstakes: {
    team: {
      slug: input.slug,
      members: {
        some: { userId: input.userId }
      }
    }
  }
});

export const USER_PARTICIPATION_INCLUDE_QUERY = (sweepstakesId?: string) =>
  ({
    taskCompletions: {
      where: {
        task: {
          sweepstakesId: sweepstakesId
        }
      },
      include: {
        task: {
          include: {
            sweepstakes: {
              include: {
                details: true
              }
            }
          }
        }
      }
    }
  }) satisfies Prisma.UserInclude;

export const toUserParticipationSchema = (
  participant: Prisma.UserGetPayload<{
    include: ReturnType<typeof USER_PARTICIPATION_INCLUDE_QUERY>;
  }>,
  totalTasks: number
) => {
  const userTaskCompletions = participant.taskCompletions;
  const entries = userTaskCompletions.sort(
    (a, b) => b.completedAt.getTime() - a.completedAt.getTime()
  );
  const engagement = Math.round(
    (userTaskCompletions.length / totalTasks) * 100
  );
  const qualityScore = 32; // TODO: compute quality score
  const status: 'active' | 'blocked' = 'active'; // TODO: computer user status

  return {
    id: participant.id,
    name: participant.name,
    email: participant.email,
    country: participant.countryCode ?? UNKNOWN_USER_COUNTRY_CODE,
    userAgent: participant.userAgent ?? UNKNOWN_USER_AGENT,
    entries: userTaskCompletions.map((tc) => toTaskCompletion(tc)),
    lastEntryAt: entries[0].completedAt.toISOString(),
    engagement,
    emailVerified: Boolean(participant.emailVerified),
    qualityScore,
    status
  };
};
