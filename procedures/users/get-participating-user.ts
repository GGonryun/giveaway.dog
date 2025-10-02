'use server';

import { ApplicationError } from '@/lib/errors';
import { ip } from '@/lib/ip';
import { procedure } from '@/lib/mrpc/procedures';
import { toTaskInput } from '@/schemas/giveaway/input';
import { toParticipantEntry } from '@/schemas/tasks/parse';
import { taskSchema } from '@/schemas/tasks/schemas';
import {
  ParticipantEntrySchema,
  participatingUserSchema
} from '@/schemas/teams';
import { Prisma } from '@prisma/client';
import z from 'zod';

const getParticipatingUser = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      // scope down participation of user to a specific sweepstake
      sweepstakesId: z.string().optional(),
      userId: z.string()
    })
  )
  .output(participatingUserSchema)
  .handler(async ({ db, input, user }) => {
    const tasks = await db.task.findMany({
      where: {
        sweepstakesId: input.sweepstakesId,
        sweepstakes: {
          team: {
            members: {
              some: { userId: user.id }
            }
          }
        }
      }
    });

    const participant = await db.user.findFirst({
      where: {
        id: input.userId
      },
      include: {
        taskCompletions: {
          where: {
            task: {
              sweepstakesId: input.sweepstakesId
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
        },
        events: {
          take: 1,
          orderBy: {
            timestamp: 'desc'
          }
        }
      }
    });

    if (!participant) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: `User with ID ${input.userId} not found`
      });
    }

    const totalTasks = new Set(tasks.map((t) => t.id)).size;
    // uses the most recent event
    const event = participant.events[0];
    const geo = ip.ipSchema.safeParse(event.geo);
    const country = geo.success ? geo.data.country : 'Unknown';
    const userAgent = event.userAgent ? event.userAgent : 'Unknown';
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
      country,
      entries: userTaskCompletions.map((tc) => toParticipantEntry(tc)),
      lastEntryAt: entries[0].completedAt.toISOString(),
      engagement,
      userAgent,
      emailVerified: Boolean(participant.emailVerified),
      qualityScore,
      status
    };
  });

export default getParticipatingUser;
