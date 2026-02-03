'use server';
import { getWorld } from 'workflow/runtime';
import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';

export const deleteTwitterV2Picker = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      pickerId: z.string()
    })
  )
  .handler(async ({ input: { pickerId }, db }) => {
    const data = await db.twitterPicker.delete({
      where: {
        id: pickerId
      }
    });

    if (data.runId) {
      const world = getWorld();
      await world.runs.cancel(data.runId);
    }

    return data;
  });
