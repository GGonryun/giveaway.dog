'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import {
  pickersV2ListSchema,
  listPickersV2FilterSchema
} from '@giveaway/x-picker-model/schemas/list';

export const getPickersV2List = procedure()
  .authorization({
    required: true
  })
  .input(
    listPickersV2FilterSchema.extend({
      slug: z.string()
    })
  )
  .output(pickersV2ListSchema)
  .handler(async ({ input, db }) => {
    const twitterPickers = await db.twitterPicker.findMany({
      where: {
        team: {
          slug: input.slug
        },
        status: input.status !== 'ALL' ? input.status : undefined
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const pickersFormatted = twitterPickers.map((picker) => {
      return {
        pickerId: picker.id,
        status: picker.status,
        type: 'TWITTER' as const,
        updatedAt: picker.updatedAt,
        name: picker.id
      };
    });

    return {
      pickers: pickersFormatted
    };
  });
