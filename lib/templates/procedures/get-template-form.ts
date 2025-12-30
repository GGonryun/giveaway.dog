'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import {
  templateInputSchema,
  toTemplateInputSchema
} from '../schemas/template';
import { ApplicationError } from '@/lib/errors';
import { STATIC_TEMPLATES } from '../data/static-templates';

export const getTemplateForm = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      templateId: z.string(),
      slug: z.string()
    })
  )
  .output(templateInputSchema)
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

    // Check database first
    const dbTemplate = await db.template.findUnique({
      where: {
        id: input.templateId,
        teamId: team.id
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    if (dbTemplate) {
      const data = toTemplateInputSchema(dbTemplate);

      return {
        ...data,
        id: dbTemplate.id,
        teamId: team.id,
        team: {
          name: team.name,
          slug: team.slug,
          logo: team.logo
        },
        createdBy: {
          id: dbTemplate.createdBy.id,
          name: dbTemplate.createdBy.name,
          image: dbTemplate.createdBy.image
        },
        isCustom: true
      };
    }

    // Fallback to static templates
    const staticTemplate = STATIC_TEMPLATES.find(
      (t) => t.id === input.templateId
    );

    if (!staticTemplate) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Template not found or you do not have access to it.'
      });
    }

    return {
      ...staticTemplate,
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
      },
      isCustom: false
    };
  });
