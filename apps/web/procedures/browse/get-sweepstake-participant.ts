'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { findOrCreateSweepstakesParticipant } from '@/lib/participant/db';
import { sweepstakesParticipantSchema } from '@/lib/participant/schemas';

import z from 'zod';

export const getOrCreateSweepstakesParticipant = procedure()
  .authorization({ required: false })
  .input(z.object({ sweepstakesId: z.string() }))
  .output(sweepstakesParticipantSchema.optional())
  .handler(async ({ db, user, input }) => {
    if (!user?.id) return undefined;

    const sweepstakes = await db.sweepstakes.findFirst({
      where: {
        OR: [
          { id: input.sweepstakesId },
          { visibility: { slug: input.sweepstakesId } }
        ]
      },
      select: { id: true }
    });

    if (!sweepstakes) {
      return undefined;
    }

    return await findOrCreateSweepstakesParticipant({
      db,
      userId: user.id,
      sweepstakesId: sweepstakes.id
    });
  });
