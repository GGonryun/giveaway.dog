'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { ApplicationError } from '@/lib/errors';
import z from 'zod';
import { IntegrationProvider } from '@prisma/client';
import {
  TWITTER_TEAM_APP_CLIENT_ID,
  TWITTER_TEAM_APP_CLIENT_SECRET,
  TWITTER_REDIRECT_URI,
  twitterStateSchema
} from '../schemas';

export const twitterOAuthCallback = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      code: z.string(),
      state: twitterStateSchema
    })
  )
  .handler(async ({ input, db, user }) => {
    if (
      !TWITTER_TEAM_APP_CLIENT_ID ||
      !TWITTER_TEAM_APP_CLIENT_SECRET ||
      !TWITTER_REDIRECT_URI
    ) {
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Twitter OAuth not configured'
      });
    }

    const { teamId, codeVerifier } = input.state;

    const tokenResponse = await fetch('https://api.x.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${TWITTER_TEAM_APP_CLIENT_ID}:${TWITTER_TEAM_APP_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        code: input.code,
        grant_type: 'authorization_code',
        redirect_uri: TWITTER_REDIRECT_URI,
        code_verifier: codeVerifier
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Twitter token exchange failed:', errorData);
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: `Failed to exchange code for tokens: ${tokenResponse.status} ${tokenResponse.statusText}`,
        data: errorData
      });
    }

    const tokens = await tokenResponse.json();

    const userResponse = await fetch('https://api.x.com/2/users/me', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.text();
      console.error('Twitter user fetch failed:', errorData);
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: `Failed to fetch Twitter user info: ${userResponse.status} ${userResponse.statusText}`,
        data: errorData
      });
    }

    const userData = await userResponse.json();

    const existingIntegration = await db.integration.findFirst({
      where: {
        teamId,
        provider: IntegrationProvider.TWITTER,
        account_id: userData.data.id
      }
    });

    if (existingIntegration) {
      await db.integration.update({
        where: { id: existingIntegration.id },
        data: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
          scope: tokens.scope,
          token_type: tokens.token_type,
          label: userData.data.username
        }
      });
    } else {
      await db.integration.create({
        data: {
          teamId,
          ownerId: user.id,
          provider: IntegrationProvider.TWITTER,
          account_id: userData.data.id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
          scope: tokens.scope,
          token_type: tokens.token_type,
          label: userData.data.username
        }
      });
    }

    return {
      success: true,
      username: userData.data.username
    };
  });
