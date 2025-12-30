'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import { ApplicationError } from '@/lib/errors';

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
      }
    });

    if (!template) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Template not found or you do not have access.'
      });
    }

    await db.template.delete({
      where: { id: input.templateId }
    });

    return { success: true };
  });
