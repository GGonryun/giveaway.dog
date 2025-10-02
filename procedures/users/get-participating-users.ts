'use server';

import { ip } from '@/lib/ip';
import { procedure } from '@/lib/mrpc/procedures';
import { DEFAULT_PAGE_SIZE } from '@/lib/settings';
import { toParticipantEntry } from '@/schemas/tasks/parse';
import { participatingUserSchema } from '@/schemas/teams';
import { groupBy, uniqBy } from 'lodash';
import z from 'zod';

const getParticipatingUsers = procedure
  .authorization({
    required: true
  })
  .input(
    z.object({
      slug: z.string(),
      sweepstakesId: z.string().optional(),
      search: z.string().optional().default(''),
      page: z.number().min(1).optional().default(1),
      sortField: z.string().optional().default('lastEntryAt'),
      sortDirection: z.enum(['asc', 'desc']).optional().default('desc'),
      status: z.string().optional().default('all'),
      dateRange: z.string().optional().default('all')
    })
  )
  .output(
    z.object({
      users: participatingUserSchema.array(),
      totalUsers: z.number(),
      totalPages: z.number()
    })
  )
  .handler(async ({ db, input, user }) => {
    const sweepstakes = await db.sweepstakes.findMany({
      where: {
        id: input.sweepstakesId,
        team: {
          slug: input.slug,
          members: {
            some: { userId: user.id }
          }
        }
      },
      include: {
        tasks: {
          include: {
            completions: {
              include: {
                task: {
                  include: {
                    sweepstakes: {
                      include: {
                        details: true
                      }
                    }
                  }
                },
                user: {
                  include: {
                    events: {
                      take: 1,
                      orderBy: {
                        timestamp: 'desc'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    const users = sweepstakes.flatMap((s) =>
      s.tasks.flatMap((t) => t.completions.map((c) => c.user))
    );
    const completions = sweepstakes.flatMap((s) =>
      s.tasks.flatMap((t) => t.completions)
    );
    const uniqueUsers = uniqBy(users, (user) => user.id);
    const completionsUserGroups = groupBy(completions, (tc) => tc.userId);
    const totalTasks = sweepstakes.reduce((sum, s) => sum + s.tasks.length, 0);

    let processedUsers = uniqueUsers.map((user) => {
      // uses the most recent event
      const event = user.events[0];
      const geo = ip.ipSchema.safeParse(event.geo);
      const country = geo.success ? geo.data.country : 'Unknown';
      const userAgent = event.userAgent ? event.userAgent : 'Unknown';
      const userTaskCompletions = completionsUserGroups[user.id] || [];
      const entries = userTaskCompletions.sort(
        (a, b) => b.completedAt.getTime() - a.completedAt.getTime()
      );
      const engagement = Math.round(
        (userTaskCompletions.length / totalTasks) * 100
      );
      const qualityScore = 32; // TODO: compute quality score
      const status: 'active' | 'blocked' = 'active'; // TODO: computer user status

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        country,
        entries: userTaskCompletions.map((tc) => toParticipantEntry(tc)),
        lastEntryAt: entries[0].completedAt.toISOString(),
        engagement,
        userAgent,
        emailVerified: Boolean(user.emailVerified),
        qualityScore,
        status
      };
    });

    // Apply filters
    if (input.search) {
      const searchLower = input.search.toLowerCase();
      processedUsers = processedUsers.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.id.toLowerCase().includes(searchLower)
      );
    }

    if (input.status !== 'all') {
      processedUsers = processedUsers.filter(
        (user) => user.status === input.status
      );
    }

    if (input.dateRange !== 'all') {
      const now = new Date();
      let dateThreshold: Date;

      switch (input.dateRange) {
        case 'today':
          dateThreshold = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case '7d':
          dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          dateThreshold = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          dateThreshold = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          dateThreshold = new Date(0);
      }

      processedUsers = processedUsers.filter(
        (user) => new Date(user.lastEntryAt) >= dateThreshold
      );
    }

    // Apply sorting
    processedUsers.sort((a, b) => {
      let valueA: any, valueB: any;

      switch (input.sortField) {
        case 'lastEntryAt':
          valueA = new Date(a.lastEntryAt);
          valueB = new Date(b.lastEntryAt);
          break;
        case 'qualityScore':
          valueA = a.qualityScore;
          valueB = b.qualityScore;
          break;
        case 'engagement':
          valueA = a.engagement;
          valueB = b.engagement;
          break;
        case 'status':
          valueA = a.status;
          valueB = b.status;
          break;
        default:
          valueA = new Date(a.lastEntryAt);
          valueB = new Date(b.lastEntryAt);
      }

      if (valueA < valueB) return input.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return input.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    const pageSize = DEFAULT_PAGE_SIZE;
    const totalUsers = processedUsers.length;
    const totalPages = Math.ceil(totalUsers / pageSize);

    // Apply pagination
    const startIndex = (input.page - 1) * pageSize;
    const paginatedUsers = processedUsers.slice(
      startIndex,
      startIndex + pageSize
    );

    return {
      users: paginatedUsers,
      totalUsers,
      totalPages
    };
  });

export default getParticipatingUsers;
