'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import { ApplicationError } from '@/lib/errors';
import { nanoid } from 'nanoid';
import {
  toStorableTemplateSchema,
  TemplateInputSchema,
  toTemplateInputSchema
} from '../schemas/template';
import { DEFAULT_TEMPLATE_CONTENT } from '../defaults';
import { replaceIdsDeep } from '@/lib/object';
import { getTemplateById } from '../data/static-templates';
import { PrismaClient } from '@prisma/client';

const toTemplate = async ({
  templateId,
  db,
  teamId
}: {
  db: PrismaClient;
  templateId: string;
  teamId: string;
}): Promise<TemplateInputSchema> => {
  const staticTemplate = getTemplateById(templateId);

  if (staticTemplate) {
    return staticTemplate;
  }

  const dbTemplate = await db.template.findFirst({
    where: {
      id: templateId,
      teamId
    }
  });

  if (!dbTemplate) {
    throw new ApplicationError({
      code: 'NOT_FOUND',
      message: 'Template not found or you do not have access.'
    });
  }

  return toTemplateInputSchema(dbTemplate);
};

export const createTemplate = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      slug: z.string(),
      sourceTemplateId: z.string().optional()
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

    // If customizing from an existing template
    if (input.sourceTemplateId) {
      const sourceTemplate = await toTemplate({
        db,
        templateId: input.sourceTemplateId,
        teamId: team.id
      });

      // Generate new IDs for all nested objects (tasks, prizes, formFields, etc.)
      const templateWithNewIds = replaceIdsDeep(sourceTemplate, () => nanoid());

      // Extract content, omit the id field
      const { id, template: templateSettings, ...contentFields } =
        templateWithNewIds;

      // Append "(Copy)" to the name to indicate it's customized
      const storable = toStorableTemplateSchema({
        ...contentFields,
        template: {
          name: `${templateSettings.name} (Copy)`,
          description: templateSettings.description,
          image: templateSettings.image
        }
      });

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
    }

    // Create blank template with defaults
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
