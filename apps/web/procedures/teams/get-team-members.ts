'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { ApplicationError } from '@giveaway/util-errors';
import { TeamPermission, requireMembershipPermission } from '@/lib/permissions';
import { TeamRole } from '@prisma/client';
import z from 'zod';

const getTeamMembers = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      slug: z.string()
    })
  )
  .output(
    z.array(
      z.object({
        id: z.string(),
        userId: z.string(),
        role: z.nativeEnum(TeamRole),
        createdAt: z.coerce.date(),
        user: z.object({
          id: z.string(),
          name: z.string().nullable(),
          email: z.string().nullable(),
          image: z.string().nullable(),
          emoji: z.string().nullable()
        })
      })
    )
  )
  .handler(async ({ db, user, input }) => {
    const team = await db.team.findFirst({
      where: {
        slug: input.slug,
        members: {
          some: {
            userId: user.id
          }
        }
      },
      select: {
        id: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                emoji: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!team) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Team not found'
      });
    }

    const membership = team.members.find((m) => m.userId === user.id);
    requireMembershipPermission(membership, TeamPermission.VIEW_MEMBERS);

    return team.members.map((member) => ({
      id: member.id,
      userId: member.userId,
      role: member.role,
      createdAt: member.createdAt,
      user: member.user
    }));
  });

export default getTeamMembers;
