'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import { pickersListSchema, listPickersFilterSchema } from '../schemas/list';
import { parsePickerFormSchema } from '../schemas/form';
import { DEFAULT_PICKER_NAME } from '../data/defaults';

export const getPickersList = procedure()
  .authorization({
    required: true
  })
  .input(
    listPickersFilterSchema.extend({
      slug: z.string()
    })
  )
  .output(pickersListSchema)
  .handler(async ({ input, db }) => {
    const data = await db.picker.findMany({
      where: {
        team: {
          slug: input.slug
        },
        status: input.status !== 'ALL' ? input.status : undefined
      },
      orderBy: {
        updatedAt: 'desc'
      },
      include: {
        form: {
          select: {
            data: true
          }
        }
      }
    });

    return {
      pickers: data.map((picker) => {
        const form = parsePickerFormSchema(picker.form, {
          validate: false
        });
        return {
          pickerId: picker.id,
          status: picker.status,
          type: picker.type,
          updatedAt: picker.updatedAt,
          name: form.setup?.name || DEFAULT_PICKER_NAME
        };
      })
    };
  });
