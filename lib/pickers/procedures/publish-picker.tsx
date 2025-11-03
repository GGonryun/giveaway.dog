'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { publishPickerInputSchema } from '../schemas/form';
import { PickerStatus } from '@prisma/client';
import { publishPickerAuditLogs, publishPickerJobs } from '../data/publish';

export const publishPicker = procedure()
  .authorization({
    required: true
  })
  .input(publishPickerInputSchema)
  .handler(async ({ input, db }) => {
    await db.$transaction(async (tx) => {
      await db.picker.update({
        where: {
          id: input.pickerId
        },
        data: {
          status: PickerStatus.PROCESSING
        }
      });

      await db.pickerForm.update({
        where: {
          pickerId: input.pickerId
        },
        data: {
          data: input.form
        }
      });

      await db.pickerJob.create({
        data: publishPickerJobs(input)
      });

      await db.pickerAuditLog.createMany({
        data: publishPickerAuditLogs(input)
      });
    });

    return {
      success: true
    };
  });
