'use server';

import {
  detailedUserTeamSchema,
  GET_TEAM_SELECT,
  toDetailedUserTeam
} from '@giveaway/team-model/teams';
import { procedure } from '@giveaway/rpc-server/procedures';
import { TeamRole } from '@giveaway/db-model';

const getUserTeams = procedure('team-server/getUserTeams')
  .authorization({ required: true })
  .output(detailedUserTeamSchema.array())
  .handler(async ({ db, user }) => {
    const query = await db.team.findMany({
      ...GET_TEAM_SELECT,
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
