import { Prisma, PrismaClient } from '@prisma/client';

export const findUserSweepstakesQuery = ({
  userId,
  id
}: {
  userId: string;
  id: string;
}): Prisma.SweepstakesWhereUniqueInput => ({
  id,
  team: {
    members: {
      some: {
        userId
      }
    }
  }
});

export const findUserTeamQuery = ({
  slug,
  userId
}: {
  slug: string;
  userId: string;
}): Prisma.TeamWhereUniqueInput => ({
  slug,
  members: {
    some: {
      userId
    }
  }
});
