'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';

export const deletePicker = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      pickerId: z.string()
    })
  )
  .handler(async ({ input: { pickerId }, db }) => {
    return await db.picker.deleteMany({
      where: {
        id: pickerId
      }
    });
  });
