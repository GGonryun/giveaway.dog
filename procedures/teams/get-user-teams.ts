'use server';

import {
  detailedUserTeamSchema,
  selectUserDetails,
  toDetailedUserTeam
} from '@/schemas/teams';
import { procedure } from '@/lib/mrpc/procedures';
import { TeamRole } from '@prisma/client';

const getUserTeams = procedure
  .authorization({ required: true })
  .output(detailedUserTeamSchema.array())
  .handler(async ({ db, user }) => {
    const query = await db.team.findMany({
      ...selectUserDetails,
      where: {
        members: {
          some: {
            userId: { equals: user.id } // Replace with actual user ID
          }
        }
      }
    });

    return query
      .map((team) => toDetailedUserTeam(user, team))
      .filter((team) => team.role !== TeamRole.BLOCKED);
  });

export default getUserTeams;
