'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { ApplicationError } from '@/lib/errors';
import z from 'zod';
import { PickerStatus } from '@prisma/client';
import { PUBLIC_PICKER_INCLUDE } from '../schemas/public-picker';
import { UNKNOWN_USER_NAME } from '@/lib/settings';

export const completePicker = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      pickerId: z.string().min(1, 'Picker ID is required')
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      pickerId: z.string()
    })
  )
  .handler(async ({ input, db, user }) => {
    const picker = await db.picker.findUnique({
      where: { id: input.pickerId },
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
        message: 'You do not have permission to complete this picker'
      });
    }

    if (picker.status === PickerStatus.COMPLETE) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'Picker is already marked as complete'
      });
    }

    const drawCount = await db.pickerDraw.count({
      where: {
        pickerId: input.pickerId,
        result: 'WINNER'
      }
    });

    if (drawCount === 0) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'Cannot complete picker without drawing winners first'
      });
    }

    await db.$transaction(async (tx) => {
      await tx.picker.update({
        where: { id: input.pickerId },
        data: { status: PickerStatus.COMPLETE }
      });

      await tx.pickerAuditLog.create({
        data: {
          pickerId: input.pickerId,
          type: 'COMPLETED',
          data: {
            completedAt: new Date().toISOString(),
            completedBy: user.name ?? UNKNOWN_USER_NAME,
            totalWinners: drawCount,
            previousStatus: picker.status
          }
        }
      });
    });

    return { success: true, pickerId: input.pickerId };
  });
