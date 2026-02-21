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

export const drawExtraWinner = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      pickerId: z.string().min(1, 'Picker ID is required')
    })
  )
  .output(
    z.object({
      drawId: z.string(),
      winner: z.object({
        userId: z.string(),
        position: z.number()
      })
    })
  )
  .handler(async ({ input, db, user }) => {
    console.info('[Draw Extra Winner] Handler called', {
      pickerId: input.pickerId,
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

    if (picker.status === PickerStatus.COMPLETE) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'Cannot draw extra winners for a completed picker'
      });
    }

    if (picker.status !== PickerStatus.PROCESSED) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'Picker must be in PROCESSED status to draw winners',
        data: { currentStatus: picker.status }
      });
    }

    const existingDraws = await db.pickerDraw.count({
      where: { pickerId: input.pickerId }
    });

    if (existingDraws === 0) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message:
          'Cannot draw extra winner before initial winners have been drawn'
      });
    }

    const form = parsePickerFormSchema(picker.form, { validate: true });
    const pickerData = parseEligiblePickerData(picker, form);
    const eligibleUsers = pickerData.users.filter((user) => !user.ineligible);

    console.info('[Draw Extra Winner] Eligible users found', {
      total: eligibleUsers.length
    });

    if (eligibleUsers.length === 0) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'No eligible users to draw from'
      });
    }

    const alreadyDrawnUserIds = picker.draws
      .filter((d) => d.result === PickerDrawResult.WINNER)
      .map((d) => d.user);

    const availableUsers = eligibleUsers.filter(
      (u) => !alreadyDrawnUserIds.includes(u.id)
    );

    if (availableUsers.length === 0) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'No more eligible users available for extra draw'
      });
    }

    const maxOrder = Math.max(...picker.draws.map((d) => d.order), 0);
    const nextPosition = alreadyDrawnUserIds.length + 1;

    const shuffled = [...availableUsers].sort(() => Math.random() - 0.5);
    const newWinner = shuffled[0];

    console.info('[Draw Extra Winner] Starting extra draw process', {
      pickerId: input.pickerId,
      newWinner: newWinner.id,
      nextPosition
    });

    try {
      const result = await db.$transaction(async (tx) => {
        const drawData: Prisma.PickerDrawCreateInput = {
          picker: {
            connect: {
              id: input.pickerId
            }
          },
          order: maxOrder + 1,
          eligibleEntries: eligibleUsers.length,
          user: newWinner.id,
          position: nextPosition,
          result: PickerDrawResult.WINNER
        };

        console.info('[Draw Extra Winner] Creating draw with data:', {
          position: nextPosition,
          winnerId: newWinner.id,
          winnerUsername: newWinner.username,
          drawData
        });

        const draw = await tx.pickerDraw.create({
          data: drawData
        });

        console.info('[Draw Extra Winner] Draw created', {
          drawId: draw.id,
          position: nextPosition
        });

        await tx.pickerAuditLog.create({
          data: {
            pickerId: input.pickerId,
            type: 'WINNER_DRAWN',
            data: {
              action: 'extra_draw',
              position: nextPosition,
              drawId: draw.id,
              winnerId: newWinner.id,
              winnerUsername: newWinner.username,
              winnerName: newWinner.name,
              eligibleEntries: eligibleUsers.length
            }
          }
        });

        console.info('[Draw Extra Winner] Extra draw completed successfully');

        return {
          drawId: draw.id,
          winner: {
            userId: newWinner.id,
            position: nextPosition
          }
        };
      });

      return result;
    } catch (error) {
      console.error('[Draw Extra Winner] Transaction failed', error);
      throw error;
    }
  });
