'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import {
  toStorableTemplateSchema,
  templateInputSchema
} from '@giveaway/templates-model/schemas/template';
import z from 'zod';
import { ApplicationError } from '@giveaway/util-errors';

export const updateTemplate = procedure('templates-server/updateTemplate')
  .authorization({ required: true })
  .input(templateInputSchema)
  .output(z.object({ id: z.string() }))
  .handler(async ({ db, input, user }) => {
    // Verify ownership
    const template = await db.template.findUnique({
      where: {
        id: input.id,
        team: {
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

    // Update template - convert flattened input to storage format
    const storable = toStorableTemplateSchema(input);

    await db.template.update({
      where: { id: input.id },
      data: {
        teamId: template.teamId,
        createdById: user.id,
        name: storable.name,
        description: storable.description,
        image: storable.image,
        content: storable.content
      }
    });

    return { id: template.id };
  });
