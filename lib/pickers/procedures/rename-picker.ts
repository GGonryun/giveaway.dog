'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { parsePickerFormSchema } from '../schemas/form';
import z from 'zod';
import { ApplicationError } from '@/lib/errors';
import { PickerAuditLogType } from '@prisma/client';

export const renamePicker = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      pickerId: z.string(),
      name: z.string().min(1, 'Picker name is required')
    })
  )
  .handler(async ({ input, db }) => {
    const form = await db.pickerForm.findUnique({
      where: {
        pickerId: input.pickerId
      }
    });

    if (!form) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Picker not found'
      });
    }

    const config = parsePickerFormSchema(form, { validate: false });

    await db.$transaction(async (tx) => {
      await tx.pickerForm.update({
        where: {
          pickerId: input.pickerId
        },
        data: {
          data: {
            ...config,
            setup: {
              ...config.setup,
              name: input.name
            }
          }
        }
      });
      await tx.pickerAuditLog.create({
        data: {
          pickerId: input.pickerId,
          type: PickerAuditLogType.UPDATED,
          data: {
            name: input.name
          }
        }
      });
    });

    return {
      success: true,
      name: input.name
    };
  });
