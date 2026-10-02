'use server';

import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';

import z from 'zod';
import { findSweepstakesParticipant } from '../db';
import { sweepstakesParticipantSchema } from '../schemas';

export const getSweepstakesParticipant = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      slug: z.string(),
      sweepstakesId: z.string(),
      userId: z.string()
    })
  )
  .output(sweepstakesParticipantSchema)
  .handler(async ({ db, input }) => {
    const participant = await findSweepstakesParticipant({
      db,
      userId: input.userId,
      sweepstakesId: input.sweepstakesId
    });

    if (!participant) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: `User not found`,
        data: { userId: input.userId }
      });
    }

    return participant;
  });
