'use server';

import { nanoid } from 'nanoid';
import prisma, { GiveawayStatus } from '@/lib/prisma';
import { protect } from '../procedures/protect';

export const createSweepstakes = protect(async (user) => {
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
