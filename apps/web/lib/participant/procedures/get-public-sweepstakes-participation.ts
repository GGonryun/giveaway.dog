import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import {
  PublicSweepstakesParticipationSchema,
  publicSweepstakesParticipationSchema
} from '../schemas';

export const getPublicSweepstakesParticipation = procedure()
  .authorization({
    required: false
  })
  .output(publicSweepstakesParticipationSchema)
  .handler(async ({ db, user }) => {
    if (!user?.id) {
      return {};
    }

    const now = new Date();

    const participations = await db.sweepstakesParticipant.findMany({
      where: {
        userId: user.id,
        sweepstakes: {
          status: 'ACTIVE',
          visibility: { visibility: 'PUBLIC' },
          timing: {
            startDate: {
              lte: now
            },
            endDate: {
              gte: now
            }
          }
        }
      },
      include: {
        taskCompletions: true,
        sweepstakes: { include: { tasks: true } }
      }
    });

    const map: PublicSweepstakesParticipationSchema = {};

    for (const participation of participations) {
      const uniqueTasksCompleted = new Set(
        participation.taskCompletions.map((tc) => tc.taskId)
      ).size;

      map[participation.sweepstakesId] = {
        sweepstakesId: participation.sweepstakesId,
        completed: uniqueTasksCompleted,
        maximum: participation.sweepstakes.tasks.length
      };
    }

    return map;
  });
