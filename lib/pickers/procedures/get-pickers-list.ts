'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import { pickersListSchema, listPickersFilterSchema } from '../schemas/list';
import { parseUnvalidatedFormSchema } from '../schemas/form';
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
      }
    });

    return {
      pickers: data.map((picker) => {
        const config = parseUnvalidatedFormSchema(picker.config);
        return {
          pickerId: picker.id,
          status: picker.status,
          type: picker.type,
          updatedAt: picker.updatedAt,
          name: config.setup?.name || DEFAULT_PICKER_NAME
        };
      })
    };
  });
