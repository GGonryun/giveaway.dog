'use server';

import { z } from 'zod';
import { procedure } from '@/lib/mrpc/procedures';
import { ApplicationError } from '@/lib/errors';
import { requireMembershipPermission, TeamPermission } from '@/lib/permissions';
import { socialLinksSchema } from '@/schemas/social-links';

const updateTeamLinks = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      slug: z.string(),
      links: socialLinksSchema
    })
  )
  .output(z.object({ success: z.boolean() }))
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
          where: {
            userId: user.id
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

    const membership = team.members[0];
    requireMembershipPermission(membership, TeamPermission.MANAGE_SOCIAL_LINKS);

    await db.team.update({
      where: { id: team.id },
      data: { links: input.links }
    });

    return { success: true };
  });

export default updateTeamLinks;
