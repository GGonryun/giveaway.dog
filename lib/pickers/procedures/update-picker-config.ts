'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { pickerUnvalidatedFormSchema } from '../schemas/form';
import z from 'zod';
import { PickerAuditLogType } from '@prisma/client';

export const updatePicker = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      pickerId: z.string(),
      form: pickerUnvalidatedFormSchema
    })
  )
  .handler(async ({ input, db }) => {
    await db.$transaction(async (tx) => {
      await tx.pickerForm.update({
        where: {
          pickerId: input.pickerId
        },
        data: {
          data: input.form
        }
      });
      await tx.pickerAuditLog.create({
        data: {
          pickerId: input.pickerId,
          type: PickerAuditLogType.UPDATED,
          data: input.form
        }
      });
    });

    return {
      success: true
    };
  });
