import { Prisma } from '@giveaway/db-model';

export const SWEEPSTAKES_DISCORD_POST_SELECT_QUERY = {
  id: true,
  tasks: true,
  visibility: true,
  teamId: true,
  details: true,
  timing: true,
  status: true,
  posts: true,
  team: {
    select: {
      name: true,
      logo: true
    }
  },
  prizes: {
    select: {
      name: true,
      quota: true,
      draws: {
        select: {
          result: true,
          taskCompletion: {
            select: {
              participant: {
                select: {
                  user: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
} satisfies Prisma.SweepstakesSelect;
