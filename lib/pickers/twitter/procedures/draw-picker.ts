'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { ApplicationError } from '@/lib/errors';
import z from 'zod';
import { PickerDrawResult, PickerStatus, Prisma } from '@prisma/client';
import {
  parseEligiblePickerData,
  PUBLIC_PICKER_INCLUDE
} from '../schemas/public-picker';
import { parsePickerFormSchema } from '../schemas/form';

export const drawPicker = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      pickerId: z.string().min(1, 'Picker ID is required'),
      numberOfWinners: z
        .number()
        .int('Number of winners must be a whole number')
        .positive('Number of winners must be positive')
        .default(1)
    })
  )
  .output(
    z.object({
      drawIds: z.array(z.string()),
      winners: z.array(
        z.object({
          userId: z.string(),
          position: z.number()
        })
      )
    })
  )
  .handler(async ({ input, db, user }) => {
    console.info('[Draw Winners] Handler called', {
      pickerId: input.pickerId,
      numberOfWinners: input.numberOfWinners,
      userId: user.id
    });
    const picker = await db.picker.findUnique({
      where: { id: input.pickerId },
      include: {
        team: {
          include: {
            members: {
              where: { userId: user.id }
            }
          }
        },
        ...PUBLIC_PICKER_INCLUDE
      }
    });

    if (!picker) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Picker not found'
      });
    }

    if (picker.team.members.length === 0) {
      throw new ApplicationError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to draw this picker'
      });
    }

    if (picker.status !== PickerStatus.PROCESSED) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'Picker must be in PROCESSED status to draw winners',
        data: { currentStatus: picker.status }
      });
    }

    // Check if winners have already been drawn
    const existingDraws = await db.pickerDraw.count({
      where: { pickerId: input.pickerId }
    });

    if (existingDraws > 0) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'Winners have already been drawn for this picker',
        data: { existingDraws }
      });
    }

    const form = parsePickerFormSchema(picker.form, { validate: true });
    const pickerData = parseEligiblePickerData(picker, form);
    const eligibleUsers = pickerData.users.filter((user) => !user.ineligible);

    console.info('[Draw Winners] Eligible users found', {
      total: eligibleUsers.length,
      sample: eligibleUsers.slice(0, 3).map((u) => ({
        id: u.id,
        username: u.username
      }))
    });

    if (eligibleUsers.length === 0) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'No eligible users to draw from'
      });
    }

    if (input.numberOfWinners > eligibleUsers.length) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: `Cannot draw ${input.numberOfWinners} winners from ${eligibleUsers.length} eligible users`
      });
    }

    const draws: Array<{
      userId: string;
      position: number;
      drawId: string;
    }> = [];
    const shuffled = [...eligibleUsers].sort(() => Math.random() - 0.5);

    console.info('[Draw Winners] Starting draw process', {
      pickerId: input.pickerId,
      numberOfWinners: input.numberOfWinners,
      eligibleUsers: eligibleUsers.length
    });

    try {
      await db.$transaction(async (tx) => {
        for (let i = 0; i < input.numberOfWinners; i++) {
          const winner = shuffled[i];
          const drawData: Prisma.PickerDrawCreateInput = {
            picker: {
              connect: {
                id: input.pickerId
              }
            },
            order: i + 1,
            eligibleEntries: eligibleUsers.length,
            user: winner.id,
            position: i + 1,
            result: PickerDrawResult.WINNER
          };

          console.info('[Draw Winners] Creating draw with data:', {
            position: i + 1,
            winnerId: winner.id,
            winnerUsername: winner.username,
            drawData
          });

          const draw = await tx.pickerDraw.create({
            data: drawData
          });

          console.info('[Draw Winners] Draw created', {
            drawId: draw.id,
            position: i + 1
          });

          // Create individual audit log for this winner
          await tx.pickerAuditLog.create({
            data: {
              pickerId: input.pickerId,
              type: 'WINNER_DRAWN',
              data: {
                position: i + 1,
                drawId: draw.id,
                winnerId: winner.id,
                winnerUsername: winner.username,
                winnerName: winner.name,
                eligibleEntries: eligibleUsers.length
              }
            }
          });

          draws.push({
            userId: winner.id,
            position: i + 1,
            drawId: draw.id
          });
        }

        console.info('[Draw Winners] Draw process completed successfully', {
          totalWinners: draws.length,
          drawIds: draws.map((d) => d.drawId)
        });
      });
    } catch (error) {
      console.error('[Draw Winners] Transaction failed with error:', error);
      console.error('[Draw Winners] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error
      });
      throw error;
    }

    return {
      drawIds: draws.map((d) => d.drawId),
      winners: draws.map((d) => ({ userId: d.userId, position: d.position }))
    };
  });
