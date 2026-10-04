'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import z from 'zod';
import {
  templateFiltersSchema,
  TemplateListItemSchema,
  templateListItemSchema,
  toTemplateInputSchema
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
      },
      include: {
        templates: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        }
      }
    });

    if (!team) {
      return [];
    }

    // Get database templates - parse from storage format to flattened schema
    const dbTemplates: TemplateListItemSchema[] = team.templates.map((t) => {
      const template = toTemplateInputSchema(t);
      return {
        teamId: team.id,
        team: {
          name: team.name,
          slug: team.slug,
          logo: team.logo
        },
        createdBy: {
          id: t.createdBy.id,
          name: t.createdBy.name,
          image: t.createdBy.image
        },
        isCustom: true,
        template
      };
    });

    // Get static templates - already in flattened format
    const staticTemplates: TemplateListItemSchema[] = STATIC_TEMPLATES.map(
      (template) => ({
        template,
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
      })
    );

    // Merge both
    let allTemplates = [...dbTemplates, ...staticTemplates];

    if (input.search) {
      const searchLower = input.search.toLowerCase();
      allTemplates = allTemplates.filter((template) => {
        const matchesName = template.template.template.name
          .toLowerCase()
          .includes(searchLower);
        const matchesDescription = template.template.template.description
          .toLowerCase()
          .includes(searchLower);

        return matchesName || matchesDescription;
      });
    }

    return allTemplates;
  });
