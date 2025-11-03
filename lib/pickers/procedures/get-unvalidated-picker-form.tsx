import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import {
  parsePickerFormSchema,
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
      where: { id: input.pickerId },
      select: {
        form: true
      }
    });

    if (!picker) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Picker not found'
      });
    }

    return parsePickerFormSchema(picker.form, { validate: false });
  });
