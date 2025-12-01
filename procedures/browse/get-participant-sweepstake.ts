'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { PARTICIPANT_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import { z } from 'zod';
import { ApplicationError } from '@/lib/errors';
import { toSweepstakesInput } from '@/schemas/giveaway/input';
import {
  ParticipantSweepstakeSchema,
  participantSweepstakeSchema
} from '@/schemas/giveaway/schemas';
import {
  toSweepstakesHost,
  toSweepstakesPrizes
} from '@/schemas/giveaway/participant';
import { DeepNullable, DeepPartial } from '@/lib/types';
import { toDerivedSweepstakeStatus } from '@/schemas/sweepstakes';
import { toTaskSchema } from '@/lib/task/schemas';

const getParticipantSweepstake = procedure()
  .authorization({
    required: false
  })
  .input(
    z.object({
      sweepstakesId: z.string()
    })
  )
  .output(participantSweepstakeSchema)
  .handler(async ({ input, db }) => {
    const sweepstakes = await db.sweepstakes.findFirst({
      where: {
        OR: [
          { id: input.sweepstakesId },
          { visibility: { slug: input.sweepstakesId } }
        ]
      },
      include: PARTICIPANT_SWEEPSTAKES_PAYLOAD
    });

    if (!sweepstakes || !sweepstakes.team) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: `Sweepstakes with ID ${input.sweepstakesId} not found`
      });
    }

    const taskCompletions = await db.taskCompletion.findMany({
      where: {
        task: {
          sweepstakesId: sweepstakes.id
        }
      },
      include: {
        task: true
      }
    });

    const totalEntries = taskCompletions.reduce((sum, completion) => {
      const taskSchema = toTaskSchema(completion.task);
      return sum + taskSchema.value;
    }, 0);

    const uniqueUserIds = new Set(taskCompletions.map((c) => c.userId));
    const totalUsers = uniqueUserIds.size;
    const usersByTask = taskCompletions.reduce<Record<string, number>>(
      (acc, completion) => {
        acc[completion.taskId] = (acc[completion.taskId] || 0) + 1;
        return acc;
      },
      {}
    );

    const unparsed: DeepPartial<DeepNullable<ParticipantSweepstakeSchema>> = {
      sweepstakes: {
        id: sweepstakes.id,
        status: toDerivedSweepstakeStatus(sweepstakes),
        ...toSweepstakesInput(sweepstakes)
      },
      host: toSweepstakesHost(sweepstakes.team),
      prizes: toSweepstakesPrizes(sweepstakes.prizes),
      participation: {
        totalUsers,
        usersByTask,
        totalEntries
      }
    };
    const parsed = participantSweepstakeSchema.safeParse(unparsed);

    if (!parsed.success) {
      console.error('Sweepstakes parse error:', parsed.error);
      throw new ApplicationError({
        code: 'VALIDATION_ERROR',
        message: 'Sweepstakes data is invalid',
        cause: parsed.error
      });
    }

    return parsed.data;
  });

export default getParticipantSweepstake;
