'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';

export const deletePicker = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      pickerId: z.string(),
      isV2: z.boolean().optional()
    })
  )
  .handler(async ({ input: { pickerId, isV2 }, db }) => {
    if (isV2) {
      return await db.twitterPicker.deleteMany({
        where: {
          id: pickerId
        }
      });
    }
    return await db.picker.deleteMany({
      where: {
        id: pickerId
      }
    });
  });
