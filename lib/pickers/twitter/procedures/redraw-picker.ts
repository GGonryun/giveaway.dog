'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { ApplicationError } from '@/lib/errors';
import z from 'zod';
import { PickerDrawResult, PickerStatus } from '@prisma/client';
import {
  parseEligiblePickerData,
  PUBLIC_PICKER_INCLUDE
} from '../schemas/public-picker';
import { parsePickerFormSchema } from '../schemas/form';

export const redrawPicker = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      pickerId: z.string().min(1, 'Picker ID is required'),
      drawId: z.string().min(1, 'Draw ID is required'),
      justification: z.string().min(1, 'Justification is required')
    })
  )
  .output(
    z.object({
      newDrawId: z.string(),
      winner: z.object({
        userId: z.string(),
        position: z.number()
      })
    })
  )
  .handler(async ({ input, db, user }) => {
    console.info('[Redraw Winner] Handler called', {
      pickerId: input.pickerId,
      drawId: input.drawId,
      justification: input.justification,
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
        message: 'You do not have permission to redraw this picker'
      });
    }

    if (picker.status === PickerStatus.COMPLETE) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'Cannot redraw winners for a completed picker'
      });
    }

    const existingDraw = await db.pickerDraw.findUnique({
      where: { id: input.drawId }
    });

    if (!existingDraw) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Draw not found'
      });
    }

    if (existingDraw.pickerId !== input.pickerId) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'Draw does not belong to this picker'
      });
    }

    const form = parsePickerFormSchema(picker.form, { validate: true });
    const pickerData = parseEligiblePickerData(picker, form);
    const eligibleUsers = pickerData.users.filter((user) => !user.ineligible);

    console.info('[Redraw Winner] Eligible users found', {
      total: eligibleUsers.length
    });

    if (eligibleUsers.length === 0) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'No eligible users to draw from'
      });
    }

    const alreadyDrawnUserIds = picker.draws
      .filter(
        (d) => d.id !== input.drawId && d.result === PickerDrawResult.WINNER
      )
      .map((d) => d.user);

    const availableUsers = eligibleUsers.filter(
      (u) => !alreadyDrawnUserIds.includes(u.id)
    );

    if (availableUsers.length === 0) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'No more eligible users available for redraw'
      });
    }

    const shuffled = [...availableUsers].sort(() => Math.random() - 0.5);
    const newWinner = shuffled[0];

    console.info('[Redraw Winner] Starting redraw process', {
      pickerId: input.pickerId,
      drawId: input.drawId,
      oldWinner: existingDraw.user,
      newWinner: newWinner.id,
      justification: input.justification
    });

    try {
      const result = await db.$transaction(async (tx) => {
        await tx.pickerDraw.update({
          where: { id: input.drawId },
          data: {
            result: PickerDrawResult.DISQUALIFIED,
            disqualificationReason: input.justification
          }
        });

        console.info('[Redraw Winner] Disqualified previous draw', {
          drawId: input.drawId
        });

        const newDraw = await tx.pickerDraw.create({
          data: {
            picker: {
              connect: {
                id: input.pickerId
              }
            },
            order: existingDraw.order,
            eligibleEntries: eligibleUsers.length,
            user: newWinner.id,
            position: existingDraw.position,
            result: PickerDrawResult.WINNER,
            previousDraw: {
              connect: {
                id: input.drawId
              }
            }
          }
        });

        console.info('[Redraw Winner] New draw created', {
          newDrawId: newDraw.id,
          position: newDraw.position
        });

        await tx.pickerAuditLog.create({
          data: {
            pickerId: input.pickerId,
            type: 'WINNER_DRAWN',
            data: {
              action: 'redraw',
              position: newDraw.position,
              drawId: newDraw.id,
              previousDrawId: input.drawId,
              winnerId: newWinner.id,
              winnerUsername: newWinner.username,
              winnerName: newWinner.name,
              justification: input.justification,
              eligibleEntries: eligibleUsers.length
            }
          }
        });

        console.info('[Redraw Winner] Audit log created');

        return {
          newDrawId: newDraw.id,
          winner: {
            userId: newWinner.id,
            position: newDraw.position
          }
        };
      });

      console.info('[Redraw Winner] Redraw completed successfully', result);

      return result;
    } catch (error) {
      console.error('[Redraw Winner] Transaction failed', error);
      throw error;
    }
  });
