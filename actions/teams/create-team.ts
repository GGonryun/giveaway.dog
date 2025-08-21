'use server';

import { createTeamInputSchema } from '@/schemas/teams';
import { procedure } from '@/lib/mrpc/procedures';
import { ApplicationError } from '@/lib/errors';
import prisma from '@/lib/prisma';
import z from 'zod';

const createTeam = procedure
  .authorized()
  .input(createTeamInputSchema)
  .output(
    z.object({
      slug: z.string()
    })
  )
  .action(async ({ user, input }) => {
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

    const team = await prisma.team.create({
      data: {
        name: input.name,
        slug: input.slug,
        logo: input.logo,
        members: {
          create: {
            userId: user.id,
            role: 'OWNER'
          }
        }
      }
    });
    return team;
  });

export default createTeam;
