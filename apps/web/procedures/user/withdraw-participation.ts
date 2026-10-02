'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { ApplicationError } from '@giveaway/util-errors';
import { toDerivedSweepstakeStatus } from '@/schemas/sweepstakes';
import z from 'zod';

const withdrawParticipation = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      sweepstakesId: z.string()
    })
  )
  .output(
    z.object({
      success: z.boolean()
    })
  )
  .handler(async ({ db, user, input }) => {
    const participant = await db.sweepstakesParticipant.findUnique({
      where: {
        userId_sweepstakesId: {
          userId: user.id,
          sweepstakesId: input.sweepstakesId
        }
      },
      include: {
        sweepstakes: {
          include: {
            timing: true
          }
        }
      }
    });

    if (!participant) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Participation record not found'
      });
    }

    const status = toDerivedSweepstakeStatus(participant.sweepstakes);

    if (status === 'COMPLETED' || status === 'ERROR') {
      throw new ApplicationError({
        code: 'FORBIDDEN',
        message: 'You can only withdraw from active or scheduled giveaways'
      });
    }

    await db.sweepstakesParticipant.delete({
      where: {
        id: participant.id
      }
    });

    return { success: true };
  });

export default withdrawParticipation;
