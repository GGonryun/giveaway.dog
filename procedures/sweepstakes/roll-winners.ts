'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { z } from 'zod';
import { ApplicationError } from '@/lib/errors';
import { findUserSweepstakes } from './shared';
import { nanoid } from 'nanoid';
import { SWEEPSTAKES_TASK_WHERE_QUERY } from '@/schemas/participants';

const rollWinners = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      sweepstakesId: z.string(),
      slug: z.string(),
      minQualityScore: z.number().min(0).max(100),
      preventDuplicateWinners: z.boolean(),
      rerollWinnerId: z.string().optional()
    })
  )
  .output(z.object({ success: z.boolean() }))
  .handler(
    async ({
      input: {
        sweepstakesId,
        slug,
        minQualityScore,
        preventDuplicateWinners,
        rerollWinnerId
      },
      db,
      user
    }) => {
      await findUserSweepstakes({
        db,
        user,
        id: sweepstakesId
      });

      const prizes = await db.prize.findMany({
        where: {
          sweepstakesId
        },
        include: {
          winners: true
        },
        orderBy: {
          index: 'asc'
        }
      });

      if (prizes.length === 0) {
        throw new ApplicationError({
          code: 'VALIDATION_ERROR',
          message: 'No prizes found for this sweepstakes'
        });
      }

      const taskQuery = SWEEPSTAKES_TASK_WHERE_QUERY({
        sweepstakesId,
        slug,
        userId: user.id
      });

      const eligibleTaskCompletions = await db.taskCompletion.findMany({
        where: {
          task: taskQuery,
          user: {
            qualityScore: {
              gte: minQualityScore
            },
            taskCompletions: {
              some: {
                task: taskQuery
              }
            }
          }
        },
        include: {
          user: true
        }
      });

      if (eligibleTaskCompletions.length === 0) {
        throw new ApplicationError({
          code: 'VALIDATION_ERROR',
          message: 'No eligible participants meet the criteria'
        });
      }

      const shuffleArray = <T>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      if (rerollWinnerId) {
        const existingWinner = await db.prizeWinners.findUnique({
          where: {
            id: rerollWinnerId
          }
        });

        if (!existingWinner) {
          throw new ApplicationError({
            code: 'NOT_FOUND',
            message: 'Winner not found'
          });
        }

        const randomizedCompletions = shuffleArray(eligibleTaskCompletions);
        const newWinner = randomizedCompletions[0];

        await db.prizeWinners.update({
          where: {
            id: rerollWinnerId
          },
          data: {
            taskCompletionId: newWinner.id,
            updatedAt: new Date()
          }
        });
      } else {
        const emptySlots: { prizeId: string }[] = [];

        for (const prize of prizes) {
          const quota = prize.quota ?? 1;
          const existingWinners = prize.winners.length;

          for (let i = existingWinners; i < quota; i++) {
            emptySlots.push({ prizeId: prize.id });
          }
        }

        if (emptySlots.length === 0) {
          throw new ApplicationError({
            code: 'VALIDATION_ERROR',
            message: 'All prize slots are already filled'
          });
        }

        const randomizedCompletions = shuffleArray(eligibleTaskCompletions);

        if (preventDuplicateWinners) {
          const uniqueWinners: typeof eligibleTaskCompletions = [];
          const seenUserIds = new Set<string>();

          for (const completion of randomizedCompletions) {
            if (!seenUserIds.has(completion.userId)) {
              uniqueWinners.push(completion);
              seenUserIds.add(completion.userId);
            }
          }

          if (uniqueWinners.length < emptySlots.length) {
            throw new ApplicationError({
              code: 'VALIDATION_ERROR',
              message: `Not enough unique participants (${uniqueWinners.length}) to fill ${emptySlots.length} empty slots`
            });
          }

          for (let i = 0; i < emptySlots.length; i++) {
            await db.prizeWinners.create({
              data: {
                id: nanoid(),
                prizeId: emptySlots[i].prizeId,
                taskCompletionId: uniqueWinners[i].id
              }
            });
          }
        } else {
          for (let i = 0; i < emptySlots.length; i++) {
            const completionIndex = i % randomizedCompletions.length;
            await db.prizeWinners.create({
              data: {
                id: nanoid(),
                prizeId: emptySlots[i].prizeId,
                taskCompletionId: randomizedCompletions[completionIndex].id
              }
            });
          }
        }
      }

      return { success: true };
    }
  );

export default rollWinners;
