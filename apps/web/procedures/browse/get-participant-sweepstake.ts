'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { PARTICIPANT_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import { z } from 'zod';
import { ApplicationError } from '@giveaway/util-errors';
import { toSweepstakesInput } from '@/schemas/giveaway/input';
import {
  ParticipantSweepstakeSchema,
  participantSweepstakeSchema
} from '@/schemas/giveaway/schemas';
import {
  toSweepstakesHost,
  toSweepstakesPrizes
} from '@/schemas/giveaway/participant';
import { DeepNullable, DeepPartial } from '@giveaway/util-types/types';
import { toDerivedSweepstakeStatus } from '@/schemas/sweepstakes';
import { Prisma } from '@prisma/client';
import { toCompletionValue } from '@giveaway/task-model/entries';
import { ELIGIBLE_TASK_COMPLETION_INCLUDE_QUERY } from '@giveaway/task-model/queries';
import { toTaskSchema } from '@giveaway/task-model/schemas';

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
  .cache(({ input }) => ({
    keyParts: [`participant-sweepstake-${input.sweepstakesId}`],
    tags: [`sweepstakes-${input.sweepstakesId}`, 'participant-sweepstake'],
    revalidate: 600 // Cache for 10 minutes
  }))
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
      include: ELIGIBLE_TASK_COMPLETION_INCLUDE_QUERY
    });

    const totalEntries = taskCompletions.reduce((sum, completion) => {
      return (
        sum +
        toCompletionValue({
          task: toTaskSchema(completion.task),
          proof: completion.proof
        })
      );
    }, 0);

    const uniqueUserIds = new Set(
      taskCompletions.map((c) => c.participant.user.id)
    );
    const totalUsers = uniqueUserIds.size;
    const usersByTask = computeUsersByTask(taskCompletions);

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

const computeUsersByTask = (
  taskCompletions: Prisma.TaskCompletionGetPayload<{}>[]
) =>
  taskCompletions.reduce<Record<string, number>>((acc, completion) => {
    acc[completion.taskId] = (acc[completion.taskId] || 0) + 1;
    return acc;
  }, {});
