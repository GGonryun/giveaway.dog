'use server';

import { nanoid } from 'nanoid';
import { SweepstakesStatus } from '@prisma/client';
import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';

export const createSweepstakes = procedure
  .authorization({ required: true })
  .input(
    z.object({
      id: z.string(),
      slug: z.string()
    })
  )
  .output(
    z.object({
      id: z.string()
    })
  )
  .invalidate(async ({ input }) => [`sweepstakes-list-${input.slug}`])
  .handler(async ({ db, input }) => {
    const created = await db.sweepstakes.create({
      data: {
        id: nanoid(6),
        status: SweepstakesStatus.DRAFT,
        teamId: input.id,
        name: 'My Sweepstakes',
        description: 'Enter to win a prize!',
        requireEmail: true
      }
    });
    return created;
  });
