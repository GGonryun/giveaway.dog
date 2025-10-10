'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { participationHistorySchema } from '@/schemas/participation-history';
import { DEFAULT_SWEEPSTAKES_NAME } from '@/schemas/giveaway/defaults';
import z from 'zod';

const DEFAULT_PAGE_SIZE = 10;

const getParticipationHistory = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(DEFAULT_PAGE_SIZE)
    })
  )
  .output(participationHistorySchema)
  .handler(async ({ db, user, input }) => {
    const skip = (input.page - 1) * input.pageSize;

    const sweepstakesWithParticipation = await db.sweepstakes.findMany({
      where: {
        tasks: {
          some: {
            completions: {
              some: {
                userId: user.id
              }
            }
          }
        }
      },
      include: {
        details: true,
        timing: true,
        tasks: {
          include: {
            completions: {
              where: {
                userId: user.id
              },
              orderBy: {
                completedAt: 'desc'
              },
              take: 1
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    const total = sweepstakesWithParticipation.length;
    const totalPages = Math.ceil(total / input.pageSize);

    const sortedByLastParticipation = sweepstakesWithParticipation
      .map((sweepstakes) => {
        const allCompletions = sweepstakes.tasks.flatMap((task) =>
          task.completions.map((completion) => ({
            taskId: task.id,
            completedAt: completion.completedAt
          }))
        );

        const lastParticipation = allCompletions.reduce(
          (latest, current) =>
            current.completedAt > latest ? current.completedAt : latest,
          new Date(0)
        );

        const uniqueCompletedTaskIds = new Set(
          allCompletions.map((c) => c.taskId)
        );
        const completedTasks = uniqueCompletedTaskIds.size;
        const totalTasks = sweepstakes.tasks.length;
        const engagement =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          sweepstakesId: sweepstakes.id,
          sweepstakesName:
            sweepstakes.details?.name ?? DEFAULT_SWEEPSTAKES_NAME,
          sweepstakesStartDate: sweepstakes.timing?.startDate ?? new Date(),
          sweepstakesEndDate: sweepstakes.timing?.endDate ?? new Date(),
          engagement,
          totalTasks,
          completedTasks,
          lastParticipatedAt: lastParticipation.toISOString(),
          banner: sweepstakes.details?.banner ?? null,
          sweepstakesStatus: sweepstakes.status,
          _sortDate: lastParticipation
        };
      })
      .sort((a, b) => b._sortDate.getTime() - a._sortDate.getTime());

    const paginatedItems = sortedByLastParticipation
      .slice(skip, skip + input.pageSize)
      .map(({ _sortDate, ...item }) => item);

    return {
      items: paginatedItems,
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages
    };
  });

export default getParticipationHistory;
