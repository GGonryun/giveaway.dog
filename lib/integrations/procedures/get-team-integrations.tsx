'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import { ApplicationError } from '@/lib/errors';
import {
  DEFAULT_INTEGRATION_LABEL,
  integrationsSchema
} from '@/lib/integrations/schemas';

export const getTeamIntegrations = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      slug: z.string()
    })
  )
  .output(integrationsSchema)
  .handler(async ({ input, db }) => {
    const team = await db.team.findUnique({
      where: { slug: input.slug },
      select: {
        id: true,
        integrations: true
      }
    });

    if (!team) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Team not found'
      });
    }

    return team.integrations.map((i) => ({
      id: i.id,
      provider: i.provider,
      label: i.label ?? DEFAULT_INTEGRATION_LABEL,
      status: i.status
    }));
  });
