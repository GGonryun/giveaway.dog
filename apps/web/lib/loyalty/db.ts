import { PrismaClient } from '@prisma/client';

export const getLoyalty = async (
  db: PrismaClient,
  { userId, teamId }: { userId: string; teamId: string }
): Promise<number> => {
  // we need to figure out who the team is, and then find every task completion
  // owned by the user for sweepstakes owned by that team
  const loyalty = await db.sweepstakesParticipant.count({
    where: {
      userId: userId,
      sweepstakes: {
        teamId: teamId
      },
      taskCompletions: {
        some: {
          status: {
            in: ['COMPLETED', 'PENDING']
          }
        }
      }
    }
  });

  return loyalty;
};
