import { ApplicationError } from '@/lib/errors';
import { Prisma, PrismaClient } from '@prisma/client';

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

export interface TeamWithUserMembership {
  id: string;
  slug: string;
  members: Array<{
    role: import('@prisma/client').TeamRole;
    userId: string;
  }>;
}

export const getTeamWithUserMembership = async ({
  db,
  slug,
  userId,
  select
}: {
  db: PrismaClient;
  slug: string;
  userId: string;
  select?: Prisma.TeamSelect;
}): Promise<any> => {
  const team = await db.team.findFirst({
    where: {
      slug,
      members: {
        some: {
          userId
        }
      }
    },
    select: select || {
      id: true,
      slug: true,
      members: {
        where: { userId },
        select: { role: true, userId: true }
      }
    }
  });

  if (!team) {
    throw new ApplicationError({
      code: 'NOT_FOUND',
      message: 'Team not found'
    });
  }

  return team;
};
