'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { participationHistorySchema } from '@/schemas/participation-history';
import { DEFAULT_SWEEPSTAKES_NAME } from '@giveaway/app-config/settings';
import z from 'zod';
import { toDerivedSweepstakeStatus } from '@/schemas/sweepstakes';

const getParticipationHistory = procedure()
  .authorization({ required: true })
  .output(participationHistorySchema)
  .handler(async ({ db, user }) => {
    const sweepstakesWithParticipation = await db.sweepstakes.findMany({
      where: {
        tasks: {
          some: {
            completions: {
              some: {
                participant: {
                  userId: user.id
                }
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
                participant: {
                  userId: user.id
                }
              },
              orderBy: {
                completedAt: 'desc'
              },
              take: 1,
              include: {
                draws: {
                  where: {
                    result: 'WINNER'
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    const sortedByLastParticipation = sweepstakesWithParticipation
      .map((sweepstakes) => {
        const allCompletions = sweepstakes.tasks.flatMap((task) =>
          task.completions.map((completion) => ({
            taskId: task.id,
            completedAt: completion.completedAt,
            hasWinningDraw: completion.draws.length > 0
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

        const hasWon = allCompletions.some((c) => c.hasWinningDraw);

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
          sweepstakesStatus: toDerivedSweepstakeStatus(sweepstakes),
          hasWon,
          _sortDate: lastParticipation
        };
      })
      .sort((a, b) => b._sortDate.getTime() - a._sortDate.getTime())
      .map(({ _sortDate, ...rest }) => rest);

    return sortedByLastParticipation;
  });

export default getParticipationHistory;
