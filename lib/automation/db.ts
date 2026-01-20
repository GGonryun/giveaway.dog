import { Prisma } from '@prisma/client';

export const SWEEPSTAKES_DISCORD_POST_SELECT_QUERY = {
  id: true,
  tasks: true,
  visibility: true,
  teamId: true,
  details: true,
  timing: true,
  prizes: true,
  status: true,
  posts: true,
  team: {
    select: {
      name: true,
      logo: true
    }
  }
} satisfies Prisma.SweepstakesSelect;
