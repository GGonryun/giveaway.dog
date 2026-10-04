'use server';

import { createTeamInputSchema } from '@/schemas/teams';
import { procedure } from '@/lib/mrpc/procedures';
import { ApplicationError } from '@giveaway/util-errors';
import z from 'zod';

import { MAX_USER_TEAMS } from '@giveaway/app-config/settings';
import { DEFAULT_TEAM_LOGO } from '@/lib/team/data';

const createTeam = procedure()
  .authorization({ required: true })
  .input(createTeamInputSchema)
  .output(
    z.object({
      slug: z.string()
    })
  )
  .handler(async ({ db, user, input }) => {
    const userTeamCount = await db.membership.count({
      where: {
        userId: user.id
      }
    });

    if (userTeamCount >= MAX_USER_TEAMS) {
      throw new ApplicationError({
        code: 'FORBIDDEN',
        message: `You cannot be a member of more than ${MAX_USER_TEAMS} teams`
      });
    }

    const findExisting = await db.team.findFirst({
      where: {
        slug: input.slug
      }
    });

    if (findExisting) {
      throw new ApplicationError({
        code: 'CONFLICT',
        message: 'This team slug is already taken'
      });
    }

    return await db.team.create({
      data: {
        name: input.name,
        slug: input.slug,
        logo: input.logo ?? DEFAULT_TEAM_LOGO,
        members: {
          create: {
            userId: user.id,
            role: 'OWNER'
          }
        }
      }
    });
  });

export default createTeam;
