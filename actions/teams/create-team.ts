'use server';

import { createTeamInputSchema } from '@/schemas/teams';
import { procedure } from '@/lib/mrpc/procedures';
import { ApplicationError } from '@/lib/errors';
import prisma from '@/lib/prisma';
import z from 'zod';

import { DEFAULT_TEAM_LOGO, MAX_USER_TEAMS } from '@/lib/settings';

const createTeam = procedure
  .authorized()
  .input(createTeamInputSchema)
  .output(
    z.object({
      slug: z.string()
    })
  )
  .handler(async ({ user, input }) => {
    const userTeamCount = await prisma.membership.count({
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

    const findExisting = await prisma.team.findFirst({
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

    return await prisma.team.create({
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
