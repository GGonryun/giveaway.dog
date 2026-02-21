'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';

export const deleteTwitterV2PickerFromList = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      pickerId: z.string()
    })
  )
  .handler(async ({ input: { pickerId }, db }) => {
    return await db.twitterPicker.deleteMany({
      where: {
        id: pickerId
      }
    });
  });
