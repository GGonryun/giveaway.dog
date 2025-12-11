'use server';

import { procedure } from '@/lib/mrpc/procedures';
import prisma from '@/lib/prisma';
import { ageVerificationSchema } from '@/schemas/user';
import z from 'zod';

const getAgeVerification = procedure()
  .authorization({ required: false })
  .input(
    z.object({
      sweepstakesId: z.string()
    })
  )
  .output(ageVerificationSchema.nullable())
  .handler(async ({ input, user }) => {
    if (!user?.id) return null;

    const participant = await prisma.sweepstakesParticipant.findFirst({
      where: {
        userId: user.id,
        sweepstakes: {
          OR: [
            { id: input.sweepstakesId },
            { visibility: { slug: input.sweepstakesId } }
          ]
        }
      },
      include: {
        ageVerification: true
      }
    });

    if (!participant || !participant.ageVerification) {
      return null;
    }

    return {
      userId: participant.userId,
      sweepstakesId: participant.sweepstakesId
    };
  });
export default getAgeVerification;
