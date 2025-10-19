'use server';

import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import { z } from 'zod';

const deleteWinner = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      winnerId: z.string(),
      sweepstakesId: z.string()
    })
  )
  .output(z.object({ success: z.boolean() }))
  .handler(async ({ db, user, input }) => {
    // Verify the sweepstakes belongs to the user's team
    const sweepstakes = await db.sweepstakes.findUnique({
      where: {
        id: input.sweepstakesId
      },
      include: {
        team: {
          include: {
            members: {
              where: {
                userId: user.id
              }
            }
          }
        },
        visibility: true
      }
    });

    if (!sweepstakes) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Sweepstakes not found.'
      });
    }

    if (!sweepstakes.team || sweepstakes.team.members.length === 0) {
      throw new ApplicationError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to manage this sweepstakes.'
      });
    }

    // Delete the winner
    await db.prizeWinners.delete({
      where: {
        id: input.winnerId
      }
    });

    return { success: true };
  });

export default deleteWinner;
