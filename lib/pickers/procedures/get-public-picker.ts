import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import { ApplicationError } from '@/lib/errors';
import {
  PUBLIC_PICKER_INCLUDE,
  publicPickerSchema,
  toPublicPicker
} from '../schemas/public-picker';

export const getPublicPicker = procedure()
  .authorization({
    required: false
  })
  .input(z.object({ pickerId: z.string() }))
  .output(publicPickerSchema)
  .handler(async ({ db, input }) => {
    const picker = await db.picker.findUnique({
      where: { id: input.pickerId },
      include: PUBLIC_PICKER_INCLUDE
    });

    if (!picker) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Picker not found'
      });
    }

    return toPublicPicker(picker);
  });
