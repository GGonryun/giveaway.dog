'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import { ApplicationError } from '@giveaway/util-errors';
import {
  DEFAULT_INTEGRATION_LABEL,
  integrationsSchema
} from '@giveaway/integration-model/schemas';
import { toProviderUrl } from '@giveaway/integration-model/to-provider-url';

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
        integrations: {
          include: {
            state: true,
            subscriptions: true
          }
        }
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
      url: toProviderUrl(i),
      account_id: i.account_id,
      label: i.label ?? DEFAULT_INTEGRATION_LABEL,
      status: i.status,
      scopes: i.scope ? i.scope.split(' ') : [],
      settings: i.settings,
      state: i.state,
      subscriptions: i.subscriptions
    }));
  });
