'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { parsePickerFormSchema } from '../schemas/form';
import z from 'zod';
import { ApplicationError } from '@/lib/errors';

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
    const picker = await db.picker.findUnique({
      where: {
        id: input.pickerId
      }
    });

    if (!picker) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Picker not found'
      });
    }

    const config = parsePickerFormSchema(picker.config);

    const updatedConfig = {
      ...config,
      setup: {
        ...config.setup,
        name: input.name
      }
    };

    await db.picker.update({
      where: {
        id: input.pickerId
      },
      data: {
        config: updatedConfig
      }
    });

    return {
      success: true,
      name: input.name
    };
  });
