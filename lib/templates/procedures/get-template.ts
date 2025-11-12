'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import { templateDetailSchema } from '../schemas/template';
import { ApplicationError } from '@/lib/errors';
import { STATIC_TEMPLATES } from '../data/static-templates';

export const getTemplate = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      id: z.string(),
      slug: z.string()
    })
  )
  .output(templateDetailSchema)
  .handler(async ({ input, db, user }) => {
    const team = await db.team.findUnique({
      where: {
        slug: input.slug,
        members: {
          some: {
            userId: user.id
          }
        }
      }
    });

    if (!team) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Team not found or you do not have access to it.'
      });
    }

    const template = STATIC_TEMPLATES.find((t) => t.id === input.id);

    if (!template) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Template not found or you do not have access to it.'
      });
    }

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      image: template.image,
      tags: template.tags,
      content: template.content,
      teamId: team.id,
      team: {
        name: team.name,
        slug: team.slug,
        logo: team.logo
      },
      createdBy: {
        id: user.id,
        name: user.name,
        image: user.image
      }
    };
  });
