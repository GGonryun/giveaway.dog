import { UNKNOWN_USER_COUNTRY_CODE, UNKNOWN_USER_AGENT } from '@/lib/settings';
import {
  SWEEPSTAKES_TASK_WHERE_QUERY,
  toTaskCompletion
} from '@/lib/task/queries';
import { Prisma } from '@prisma/client';
import { clamp } from 'lodash';
import { parseProviders } from './user';

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
    participation: {
      include: {
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
      }
    }
  }) satisfies Prisma.UserInclude;

export const toUserParticipationSchema = (
  user: Prisma.UserGetPayload<{
    include: ReturnType<typeof USER_PARTICIPATION_INCLUDE_QUERY>;
  }>,
  totalTasks: number
) => {
  const userTaskCompletions = user.participation.flatMap(
    (p) => p.taskCompletions
  );
  const entries = userTaskCompletions.sort(
    (a, b) => b.completedAt.getTime() - a.completedAt.getTime()
  );
  const engagement = Math.round(
    (userTaskCompletions.length / totalTasks) * 100
  );
  const status: 'active' | 'blocked' = 'active'; // TODO: allow user status modification

  return {
    id: user.id,
    createdAt: user.createdAt,
    name: user.name,
    email: user.email,
    country: user.ips[0]?.ip.countryCode ?? UNKNOWN_USER_COUNTRY_CODE,
    userAgent: user.agents[0]?.agent.id ?? UNKNOWN_USER_AGENT,
    entries: userTaskCompletions.map((tc) => toTaskCompletion(tc)),
    lastEntryAt: entries[0].completedAt.toISOString(),
    emailVerified: Boolean(user.emailVerified),
    engagement,
    source: user.source,
    qualityScore: clamp(user.quality[0]?.score ?? 0, 0, 100),
    status,
    providers: parseProviders(user.accounts)
  };
};
