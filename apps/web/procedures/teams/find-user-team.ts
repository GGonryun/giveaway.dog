import { ApplicationError } from '@giveaway/util-errors';
import { Prisma, PrismaClient, TeamTier } from '@prisma/client';
import { User } from 'next-auth';
import { RecursiveRequired } from '@giveaway/util-types/recursive-required';
import {
  assertMembershipPermission,
  TeamPermission
} from '@giveaway/team-permissions';
import { assertMinimumTeamTier } from '@giveaway/team-model/team/util';

type TeamQuery =
  | {
      slug: string;
    }
  | {
      id: string;
    };

export const findUserTeamQuery = (
  args: {
    userId: string;
  } & TeamQuery
): Prisma.TeamWhereUniqueInput => {
  const { userId } = args;
  if ('slug' in args) {
    return {
      slug: args.slug,
      members: {
        some: {
          userId
        }
      }
    };
  } else {
    return {
      id: args.id,
      members: {
        some: {
          userId
        }
      }
    };
  }
};

export const findUserTeam = async (
  args: {
    db: PrismaClient;
    user: RecursiveRequired<User>;
    permission: TeamPermission;
    tier: TeamTier;
  } & TeamQuery
) => {
  const { db, user, permission, tier } = args;
  const team = await db.team.findUnique({
    where: findUserTeamQuery({ ...args, userId: args.user.id }),
    include: {
      members: true
    }
  });

  if (!team) {
    throw new ApplicationError({
      code: 'NOT_FOUND',
      message: 'Team not found'
    });
  }

  const membership = team.members.find((m) => m.userId === user.id);

  assertMembershipPermission(membership, permission);
  assertMinimumTeamTier({ tier, team });

  return { team, membership };
};
