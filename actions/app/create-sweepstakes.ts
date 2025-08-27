'use server';

import { nanoid } from 'nanoid';
import { SweepstakesStatus } from '@prisma/client';
import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';

export const createSweepstakes = procedure
  .authorized()
  .input(
    z.object({
      id: z.string()
    })
  )
  .output(
    z.object({
      id: z.string()
    })
  )
  .handler(async ({ db, input }) => {
    const created = await db.sweepstakes.create({
      data: {
        id: nanoid(6),
        status: SweepstakesStatus.DRAFT,
        teamId: input.id,
        name: 'New Sweepstakes',
        description: 'Enter to win a prize!',
        requireEmail: true
      }
    });
    return created;
  });
