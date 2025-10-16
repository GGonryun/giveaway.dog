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

    const ageVerification = await prisma.ageVerification.findFirst({
      where: {
        userId: user.id,
        OR: [
          {
            sweepstakesId: input.sweepstakesId
          },
          { sweepstakes: { visibility: { slug: input.sweepstakesId } } }
        ]
      }
    });

    return ageVerification;
  });
export default getAgeVerification;
