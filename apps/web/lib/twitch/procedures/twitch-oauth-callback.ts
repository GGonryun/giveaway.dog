'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { ApplicationError } from '@giveaway/util-errors';
import z from 'zod';
import { IntegrationProvider } from '@prisma/client';
import {
  TWITCH_CLIENT_ID,
  TWITCH_CLIENT_SECRET,
  TWITCH_REDIRECT_URI
} from '../bot/scopes';
import { getTwitchUser } from '../api/get-user';
import { createEventSubSubscriptionsForFeatures } from '../api/create-eventsub-subscription';
import { TwitchIntegrationSettings } from '@giveaway/twitch-model/integration';
import { twitchStateSchema } from '../schemas';

export type TwitchStateSchema = z.infer<typeof twitchStateSchema>;

export const twitchOAuthCallback = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      code: z.string(),
      state: twitchStateSchema
    })
  )
  .handler(async ({ input, db, user }) => {
    if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET || !TWITCH_REDIRECT_URI) {
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Twitch OAuth not configured'
      });
    }

    const { teamId, features } = input.state;

    const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: TWITCH_CLIENT_ID,
        client_secret: TWITCH_CLIENT_SECRET,
        code: input.code,
        grant_type: 'authorization_code',
        redirect_uri: TWITCH_REDIRECT_URI
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: `Failed to exchange code for tokens: ${tokenResponse.status}`,
        data: errorData
      });
    }

    const tokens = await tokenResponse.json();
    console.log('Twitch tokens received:', tokens);
    const twitchUser = await getTwitchUser(tokens.access_token);

    const settings: TwitchIntegrationSettings = {
      broadcasterId: twitchUser.id,
      broadcasterLogin: twitchUser.login,
      broadcasterDisplayName: twitchUser.display_name,
      channelUrl: `https://twitch.tv/${twitchUser.login}`
    };

    const existingIntegration = await db.integration.findFirst({
      where: {
        teamId,
        provider: IntegrationProvider.TWITCH,
        account_id: twitchUser.id
      }
    });

    let integrationId: string;

    if (existingIntegration) {
      await db.integration.update({
        where: { id: existingIntegration.id },
        data: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
          scope: tokens.scope?.join?.(' ') || tokens.scope,
          token_type: tokens.token_type,
          label: twitchUser.login,
          settings,
          status: 'ACTIVE'
        }
      });
      integrationId = existingIntegration.id;
    } else {
      const newIntegration = await db.integration.create({
        data: {
          teamId,
          ownerId: user.id,
          provider: IntegrationProvider.TWITCH,
          account_id: twitchUser.id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
          scope: tokens.scope?.join?.(' ') || tokens.scope,
          token_type: tokens.token_type,
          label: twitchUser.login,
          settings
        }
      });
      integrationId = newIntegration.id;
    }

    await createEventSubSubscriptionsForFeatures({
      integrationId,
      broadcasterId: twitchUser.id,
      features
    });

    return {
      success: true,
      username: twitchUser.login
    };
  });
