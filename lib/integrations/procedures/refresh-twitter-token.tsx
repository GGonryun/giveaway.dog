'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { ApplicationError } from '@/lib/errors';
import z from 'zod';
import { IntegrationProvider } from '@prisma/client';
import {
  TWITTER_TEAM_APP_CLIENT_ID,
  TWITTER_TEAM_APP_CLIENT_SECRET
} from '../schemas';

export const refreshTwitterToken = procedure()
  .authorization({
    required: false
  })
  .input(
    z.object({
      teamId: z.string()
    })
  )
  .output(
    z.object({
      access_token: z.string(),
      expires_at: z.number()
    })
  )
  .handler(async ({ input, db }) => {
    if (!TWITTER_TEAM_APP_CLIENT_ID || !TWITTER_TEAM_APP_CLIENT_SECRET) {
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Twitter OAuth not configured'
      });
    }

    const integration = await db.integration.findFirst({
      where: {
        teamId: input.teamId,
        provider: IntegrationProvider.TWITTER
      }
    });

    if (!integration) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Twitter integration not found'
      });
    }

    if (!integration.refresh_token) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'No refresh token available'
      });
    }

    const tokenResponse = await fetch(
      'https://api.twitter.com/2/oauth2/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${TWITTER_TEAM_APP_CLIENT_ID}:${TWITTER_TEAM_APP_CLIENT_SECRET}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: integration.refresh_token,
          client_id: TWITTER_TEAM_APP_CLIENT_ID
        })
      }
    );

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'Failed to refresh access token',
        cause: error
      });
    }

    const tokens = await tokenResponse.json();

    const expiresAt = Math.floor(Date.now() / 1000) + tokens.expires_in;

    await db.integration.update({
      where: { id: integration.id },
      data: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || integration.refresh_token,
        expires_at: expiresAt,
        scope: tokens.scope,
        token_type: tokens.token_type
      }
    });

    return {
      access_token: tokens.access_token,
      expires_at: expiresAt
    };
  });
