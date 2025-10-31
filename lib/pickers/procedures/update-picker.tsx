'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { pickerUnvalidatedFormSchema } from '../schemas/form';
import z from 'zod';
import { pickerStatusSchema } from '../schemas/status';

export const updatePicker = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      pickerId: z.string(),
      form: pickerUnvalidatedFormSchema,
      status: pickerStatusSchema.optional()
    })
  )
  .handler(async ({ input, db }) => {
    await db.picker.update({
      where: {
        id: input.pickerId
      },
      data: {
        config: input.form,
        ...(input.status ? { status: input.status } : {})
      }
    });

    return {
      success: true
    };
  });
