import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import {
  parseUnvalidatedFormSchema,
  pickerUnvalidatedFormSchema
} from '../schemas/form';
import { ApplicationError } from '@/lib/errors';

export const getUnvalidatedPickerForm = procedure()
  .authorization({
    required: true
  })
  .input(z.object({ pickerId: z.string() }))
  .output(pickerUnvalidatedFormSchema)
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

    return parseUnvalidatedFormSchema(picker.config);
  });
