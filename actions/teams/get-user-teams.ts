'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { detailedUserTeamSchema } from '@/schemas/teams';
import { mRPC } from '@/lib/mrpc/procedures';
import { ApplicationError } from '@/lib/errors';

const getUserTeams = mRPC
  .secure()
  .output(detailedUserTeamSchema.array())
  .action(async ({ user }) => {
    'use cache';
    cacheTag('user-teams');

    const query = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        members: {
          select: { id: true, role: true, userId: true }
        }
      },
      where: {
        members: {
          some: {
            userId: { equals: user.id } // Replace with actual user ID
          }
        }
      }
    });
    const teams = query.map((t) => {
      const role = t.members.find((m) => m.userId === user.id)?.role;

      if (!role) {
        // this should never happen because we queried for teams that this user
        // belongs to supposedly.
        throw new ApplicationError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `User ${user.id} is not a member of team ${t.id}`
        });
      }

      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        logo: t.logo,
        memberCount: t.members.length,
        role
      };
    });

    return teams;
  });

export default getUserTeams;
