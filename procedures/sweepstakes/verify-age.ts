'use server';

import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import { ageVerificationSchema } from '@/schemas/user';

const verifyAge = procedure
  .authorization({ required: true })
  .input(ageVerificationSchema)
  .handler(async ({ db, user, input }) => {
    // Validate that the user can only verify their own age
    if (user.id !== input.userId) {
      throw new ApplicationError({
        code: 'UNAUTHORIZED',
        message: 'Cannot verify age for another user'
      });
    }

    // Check if sweepstakes exists and has age restrictions
    const sweepstakes = await db.sweepstakes.findUnique({
      where: { id: input.sweepstakesId },
      include: {
        audience: {
          include: {
            minimumAgeRestriction: true
          }
        }
      }
    });

    if (!sweepstakes) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Sweepstakes not found'
      });
    }

    if (!sweepstakes.audience?.minimumAgeRestriction) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'This sweepstakes does not require age verification'
      });
    }

    // Create or update age verification record
    const ageVerification = await db.ageVerification.upsert({
      where: {
        userId_sweepstakesId: {
          userId: input.userId,
          sweepstakesId: input.sweepstakesId
        }
      },
      update: {
        verified: input.verified,
        verifiedAt: input.verified ? new Date() : null,
        updatedAt: new Date()
      },
      create: {
        userId: input.userId,
        sweepstakesId: input.sweepstakesId,
        verified: input.verified,
        verifiedAt: input.verified ? new Date() : null
      }
    });

    return ageVerification;
  });

export default verifyAge;
