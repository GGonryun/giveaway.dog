'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import z from 'zod';
import { ApplicationError } from '@giveaway/util-errors';
import {
  assertMembershipPermission,
  TeamPermission
} from '@giveaway/team-permissions';

export const deleteTemplate = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      templateId: z.string(),
      slug: z.string()
    })
  )
  .output(z.object({ success: z.boolean() }))
  .handler(async ({ db, input, user }) => {
    // Verify ownership
    const template = await db.template.findUnique({
      where: {
        id: input.templateId,
        team: {
          slug: input.slug,
          members: {
            some: { userId: user.id }
          }
        }
      },
      include: {
        team: {
          select: {
            members: {
              where: { userId: user.id },
              select: { userId: true, role: true }
            }
          }
        }
      }
    });

    if (!template) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Template not found or you do not have access.'
      });
    }

    assertMembershipPermission(
      template.team.members[0],
      TeamPermission.UPDATE_SWEEPSTAKES
    );

    await db.template.delete({
      where: { id: input.templateId }
    });

    return { success: true };
  });
