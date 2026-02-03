'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import { pickersListSchema, listPickersFilterSchema } from '../schemas/list';
import { parsePickerFormSchema } from '../schemas/form';
import { DEFAULT_PICKER_NAME } from '../data/defaults';
import { PickerType } from '@prisma/client';

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
    const [oldPickers, twitterPickers] = await Promise.all([
      db.picker.findMany({
        where: {
          team: {
            slug: input.slug
          },
          status: input.status !== 'ALL' ? input.status : undefined
        },
        include: {
          form: {
            select: {
              data: true
            }
          }
        }
      }),
      db.twitterPicker.findMany({
        where: {
          team: {
            slug: input.slug
          },
          status: input.status !== 'ALL' ? input.status : undefined
        }
      })
    ]);

    const oldPickersFormatted = oldPickers.map((picker) => {
      const form = parsePickerFormSchema(picker.form, {
        validate: false
      });
      return {
        pickerId: picker.id,
        status: picker.status,
        type: picker.type,
        updatedAt: picker.updatedAt,
        createdAt: picker.createdAt,
        name: form.setup?.name || DEFAULT_PICKER_NAME,
        isV2: false
      };
    });

    const twitterPickersFormatted = twitterPickers.map((picker) => {
      return {
        pickerId: picker.id,
        status: picker.status,
        type: PickerType.TWITTER,
        updatedAt: picker.updatedAt,
        createdAt: picker.createdAt,
        name: picker.id,
        isV2: true
      };
    });

    const allPickers = [
      ...oldPickersFormatted,
      ...twitterPickersFormatted
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      pickers: allPickers.map(({ createdAt, ...picker }) => picker)
    };
  });
