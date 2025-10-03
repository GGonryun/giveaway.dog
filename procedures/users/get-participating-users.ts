'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { DEFAULT_PAGE_SIZE } from '@/lib/settings';
import { sweepstakesParticipantSchema } from '@/schemas/giveaway/participant';

import {
  SWEEPSTAKES_TASK_WHERE_QUERY,
  toUserParticipationSchema,
  USER_PARTICIPATION_INCLUDE_QUERY
} from '@/schemas/participants';
import z from 'zod';

const getParticipatingUsers = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      slug: z.string(),
      sweepstakesId: z.string().optional(),
      search: z.string().optional(),
      page: z.number().min(1).optional(),
      sortField: z.string().optional(),
      sortDirection: z.enum(['asc', 'desc']).optional(),
      status: z.string().optional(),
      dateRange: z.string().optional()
    })
  )
  .output(
    z.object({
      users: sweepstakesParticipantSchema.array(),
      totalUsers: z.number(),
      totalPages: z.number()
    })
  )
  .handler(async ({ db, input, user }) => {
    const ownedBySweepstakes = SWEEPSTAKES_TASK_WHERE_QUERY({
      ...input,
      userId: user.id
    });

    const totalTasks = await db.task.count({
      where: ownedBySweepstakes
    });

    const participants = await db.user.findMany({
      where: {
        taskCompletions: {
          some: {
            task: ownedBySweepstakes
          }
        }
      },
      include: USER_PARTICIPATION_INCLUDE_QUERY(input.sweepstakesId)
    });

    let processedUsers = participants.map((user) =>
      toUserParticipationSchema(user, totalTasks)
    );

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

    if (input.status) {
      processedUsers = processedUsers.filter(
        (user) => user.status === input.status
      );
    }

    if (input.dateRange) {
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
    if (input.sortField) {
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
    }

    // Apply pagination
    const pageSize = DEFAULT_PAGE_SIZE;

    if (input.page) {
      const startIndex = (input.page - 1) * pageSize;
      processedUsers = processedUsers.slice(startIndex, startIndex + pageSize);
    }

    const totalUsers = processedUsers.length;
    const totalPages = Math.ceil(totalUsers / pageSize);

    return {
      users: processedUsers,
      totalUsers,
      totalPages
    };
  });

export default getParticipatingUsers;
