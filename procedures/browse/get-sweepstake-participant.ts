'use server';

import { procedure } from '@/lib/mrpc/procedures';
import {
  SWEEPSTAKES_PARTICIPANT_INCLUDE_QUERY,
  sweepstakesParticipantSchema,
  toParticipantFormValues,
  toParticipantTaskCompletions
} from '@/schemas/giveaway/participant';
import { toUserSchema } from '@/schemas/user';
import { PrismaClient } from '@prisma/client';

import z from 'zod';

export const getOrCreateSweepstakesParticipant = procedure()
  .authorization({ required: false })
  .input(z.object({ sweepstakesId: z.string() }))
  .output(sweepstakesParticipantSchema.optional())
  .handler(async ({ db, user, input }) => {
    if (!user?.id) return undefined;

    const participant = await findOrCreateParticipant({
      db,
      userId: user.id,
      sweepstakesId: input.sweepstakesId
    });

    return {
      id: participant.id,
      user: toUserSchema(participant.user),
      completions: toParticipantTaskCompletions(participant.taskCompletions),
      formValues: toParticipantFormValues(participant.formValues)
    };
  });

const findOrCreateParticipant = async ({
  db,
  userId,
  sweepstakesId
}: {
  db: PrismaClient;
  userId: string;
  sweepstakesId: string;
}) => {
  const participant = await db.sweepstakesParticipant.findUnique({
    where: {
      userId_sweepstakesId: {
        userId,
        sweepstakesId
      }
    },
    include: SWEEPSTAKES_PARTICIPANT_INCLUDE_QUERY
  });

  if (participant) {
    return participant;
  }

  return await db.sweepstakesParticipant.create({
    data: {
      userId,
      sweepstakesId
    },
    include: SWEEPSTAKES_PARTICIPANT_INCLUDE_QUERY
  });
};
