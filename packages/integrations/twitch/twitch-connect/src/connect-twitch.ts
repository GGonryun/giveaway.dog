'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { ApplicationError } from '@giveaway/util-errors';
import z from 'zod';
import { TeamTier } from '@giveaway/db-model';
import { findUserTeam } from '@giveaway/team-server/find-user-team';
import { TeamPermission } from '@giveaway/team-permissions';
import { datetime } from '@giveaway/util-time/date';
import {
  TWITCH_CLIENT_ID,
  TWITCH_INTEGRATION_SCOPES,
  TWITCH_REDIRECT_URI
} from '@giveaway/twitch-api/scopes';
import { twitchFeatureSchema } from '@giveaway/integration-model/scopes';

export const connectTwitch = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      slug: z.string(),
      features: z.array(twitchFeatureSchema).default(['CHAT_COMMANDS'])
    })
  )
  .output(
    z.object({
      authUrl: z.string().url()
    })
  )
  .handler(async ({ input, user, db }) => {
    const { team } = await findUserTeam({
      db,
      user,
      slug: input.slug,
      permission: TeamPermission.UPDATE_INTEGRATIONS,
      tier: TeamTier.FREE
    });

    if (!TWITCH_CLIENT_ID || !TWITCH_REDIRECT_URI) {
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Twitch OAuth not configured'
      });
    }

    const state = await db.state.create({
      data: {
        value: {
          teamId: team.id,
          teamSlug: team.slug,
          features: input.features
        },
        expiresAt: datetime.minutesFromNow(10)
      },
      select: { id: true }
    });

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: TWITCH_CLIENT_ID,
      redirect_uri: TWITCH_REDIRECT_URI,
      scope: TWITCH_INTEGRATION_SCOPES.join(' '),
      state: `${team.slug}:${state.id}`
    });

    const authUrl = `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;

    return { authUrl };
  });
