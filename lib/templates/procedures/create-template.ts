'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import { ApplicationError } from '@/lib/errors';
import { nanoid } from 'nanoid';
import { toStorableTemplateSchema } from '../schemas/template';
import { DEFAULT_TEMPLATE_CONTENT } from '../defaults';

export const createTemplate = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      slug: z.string()
    })
  )
  .output(z.object({ id: z.string() }))
  .handler(async ({ db, input, user }) => {
    // Verify team access
    const team = await db.team.findUnique({
      where: {
        slug: input.slug,
        members: {
          some: { userId: user.id }
        }
      }
    });

    if (!team) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Team not found or you do not have access.'
      });
    }

    const defaults = DEFAULT_TEMPLATE_CONTENT({
      sponsorName: team.name
    });
    const storable = toStorableTemplateSchema(defaults);

    const created = await db.template.create({
      data: {
        name: storable.name,
        description: storable.description,
        image: storable.image,
        content: storable.content,
        id: nanoid(6),
        teamId: team.id,
        createdById: user.id
      }
    });

    return created;
  });
