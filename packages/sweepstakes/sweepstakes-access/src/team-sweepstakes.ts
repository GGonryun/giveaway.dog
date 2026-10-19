import 'server-only';

import { PrismaClient } from '@giveaway/db-model';
import {
  assertMembershipPermission,
  TeamPermission
} from '@giveaway/team-permissions';
import { ApplicationError } from '@giveaway/util-errors';

export const findTeamSweepstakes = async ({
  db,
  userId,
  sweepstakesId,
  slug,
  permission = TeamPermission.VIEW_SWEEPSTAKES
}: {
  db: PrismaClient;
  userId: string;
  sweepstakesId: string;
  slug: string;
  permission?: TeamPermission;
}) => {
  const sweepstakes = await db.sweepstakes.findUnique({
    where: {
      id: sweepstakesId,
      team: {
        slug,
        members: {
          some: {
            userId
          }
        }
      }
    },
    select: {
      id: true,
      team: {
        select: {
          members: {
            where: { userId },
            select: { userId: true, role: true }
          }
        }
      }
    }
  });

  if (!sweepstakes?.team) {
    throw new ApplicationError({
      code: 'NOT_FOUND',
      message: `Sweepstakes with ID ${sweepstakesId} not found`
    });
  }

  assertMembershipPermission(sweepstakes.team.members[0], permission);

  return sweepstakes;
};
