import { UNKNOWN_USER_COUNTRY_CODE, UNKNOWN_USER_AGENT } from '@/lib/settings';
import { Prisma } from '@prisma/client';
import { TaskCompletionSchema } from './giveaway/participant';
import { toTaskInput } from './giveaway/input';
import { taskSchema } from './tasks/schemas';
import { DEFAULT_SWEEPSTAKES_NAME } from './giveaway/defaults';
import { clamp } from 'lodash';

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
): TaskCompletionSchema => {
  const raw = toTaskInput(entry.task);
  const task = taskSchema.safeParse(raw);
  if (!task.success) {
    throw new Error('Invalid task config in entry');
  }
  return {
    status: entry.status,
    completionId: entry.id,
    completedAt: entry.completedAt,
    taskId: entry.taskId,
    taskName: task.data.title,
    taskType: task.data.type,
    sweepstakeId: entry.task.sweepstakes.id,
    sweepstakeName:
      entry.task.sweepstakes.details?.name ?? DEFAULT_SWEEPSTAKES_NAME
  };
};

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

export const USER_PARTICIPATION_INCLUDE_QUERY = (input: {
  sweepstakesId?: string;
  slug: string;
  userId: string;
}) =>
  ({
    ips: {
      include: {
        ip: true
      },
      take: 1,
      orderBy: {
        // Get the latest IP
        updatedAt: 'desc'
      }
    },
    agents: {
      include: {
        agent: true
      },
      take: 1,
      orderBy: {
        // Get the latest IP
        updatedAt: 'desc'
      }
    },
    quality: {
      take: 1,
      orderBy: {
        // Get the latest quality score
        updatedAt: 'desc'
      }
    },
    accounts: true,
    taskCompletions: {
      where: {
        task: SWEEPSTAKES_TASK_WHERE_QUERY(input)
      },
      include: {
        task: {
          include: {
            sweepstakes: {
              include: {
                details: true,
                team: true
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
  const status: 'active' | 'blocked' = 'active'; // TODO: allow user status modification

  return {
    id: participant.id,
    createdAt: participant.createdAt,
    name: participant.name,
    email: participant.email,
    country: participant.ips[0]?.ip.countryCode ?? UNKNOWN_USER_COUNTRY_CODE,
    userAgent: participant.agents[0]?.agent.id ?? UNKNOWN_USER_AGENT,
    entries: userTaskCompletions.map((tc) => toTaskCompletion(tc)),
    lastEntryAt: entries[0].completedAt.toISOString(),
    emailVerified: Boolean(participant.emailVerified),
    engagement,
    qualityScore: clamp(participant.quality[0]?.score ?? 0, 0, 100),
    status
  };
};
