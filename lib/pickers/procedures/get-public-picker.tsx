import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import { ApplicationError } from '@/lib/errors';
import { publicPickerSchema, toPublicPicker } from '../schemas/public-picker';

export const getPublicPicker = procedure()
  .authorization({
    required: true
  })
  .input(z.object({ pickerId: z.string() }))
  .output(publicPickerSchema)
  .handler(async ({ db, input }) => {
    const picker = await db.picker.findUnique({
      where: { id: input.pickerId }
    });

    if (!picker) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Picker not found'
      });
    }

    return toPublicPicker(picker);
  });
