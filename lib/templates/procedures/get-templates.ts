'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import {
  templateFiltersSchema,
  templateListItemSchema
} from '../schemas/template';
import { STATIC_TEMPLATES } from '../data/static-templates';

export const getTemplates = procedure()
  .authorization({
    required: true
  })
  .input(
    templateFiltersSchema.extend({
      slug: z.string()
    })
  )
  .output(z.array(templateListItemSchema))
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
      return [];
    }

    let templates = STATIC_TEMPLATES.filter((template) => {
      if (input.tags && input.tags.length > 0) {
        const hasTag = input.tags.some((tag) => template.tags.includes(tag));
        if (!hasTag) return false;
      }

      if (input.search) {
        const searchLower = input.search.toLowerCase();
        const matchesName = template.name.toLowerCase().includes(searchLower);
        const matchesDescription = template.description
          .toLowerCase()
          .includes(searchLower);
        const matchesTag = template.tags.some((tag) =>
          tag.toLowerCase().includes(searchLower)
        );
        if (!matchesName && !matchesDescription && !matchesTag) {
          return false;
        }
      }

      return true;
    });

    return templates.map((template) => ({
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
    }));
  });
