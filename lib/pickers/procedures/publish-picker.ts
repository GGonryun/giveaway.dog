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
      const currentPicker = await tx.picker.findUnique({
        where: {
          id: input.pickerId
        },
        select: {
          status: true
        }
      });

      const wasAlreadyProcessing =
        currentPicker?.status === PickerStatus.PROCESSING;

      await tx.picker.update({
        where: {
          id: input.pickerId
        },
        data: {
          status: PickerStatus.PROCESSING
        }
      });

      await tx.pickerForm.update({
        where: {
          pickerId: input.pickerId
        },
        data: {
          data: input.form
        }
      });

      if (!wasAlreadyProcessing) {
        await tx.pickerJob.create({
          data: publishPickerJobs(input)
        });

        await tx.pickerAuditLog.createMany({
          data: publishPickerAuditLogs(input)
        });
      }
    });

    return {
      success: true
    };
  });
