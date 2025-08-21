'use server';

import { nanoid } from 'nanoid';
import prisma, { SweepstakesStatus } from '@/lib/prisma';
import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import getUserTeam from '../teams/get-user-team';

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
  .handler(async ({ user, input }) => {
    const created = await prisma.sweepstakes.create({
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
