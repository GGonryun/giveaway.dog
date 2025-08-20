'use server';

import { nanoid } from 'nanoid';
import prisma, { GiveawayStatus } from '@/lib/prisma';
import { mRPC } from '@/lib/mrpc/procedures';
import z from 'zod';

export const createSweepstakes = mRPC
  .secure()
  .output(
    z.object({
      id: z.string()
    })
  )
  .action(async ({ user }) => {
    const created = await prisma.giveaway.create({
      data: {
        id: nanoid(6),
        status: GiveawayStatus.DRAFT,
        creatorId: user.id,
        name: 'New Sweepstakes',
        description: 'Enter to win a prize!',
        requireEmail: true
      }
    });
    return created;
  });
