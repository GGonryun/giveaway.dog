import 'server-only';

import { ApplicationError } from '@giveaway/util-errors';
import { IntegrationProvider, IntegrationStatus } from '@giveaway/db-model';
import {
  TWITTER_TEAM_APP_CLIENT_ID,
  TWITTER_TEAM_APP_CLIENT_SECRET
} from '@giveaway/integration-model/schemas';
import { Tx } from '@giveaway/db-client/prisma';

const EXPIRY_BUFFER_SECONDS = 300;

export const getLatestTwitterAccessToken = async (
  tx: Tx,
  {
    teamId,
    integrationId
  }: {
    teamId: string;
    integrationId?: string;
  }
) => {
  if (!TWITTER_TEAM_APP_CLIENT_ID || !TWITTER_TEAM_APP_CLIENT_SECRET) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Twitter OAuth not configured'
    });
  }

  const integration = integrationId
    ? await tx.integration.findFirst({
        where: {
          id: integrationId,
          teamId,
          provider: IntegrationProvider.TWITTER
        }
      })
    : await tx.integration.findFirst({
        where: { teamId, provider: IntegrationProvider.TWITTER }
      });

  if (!integration) {
    throw new ApplicationError({
      code: 'NOT_FOUND',
      message: 'Twitter integration not found'
    });
  }

  if (!integration.access_token) {
    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message: 'No access token available'
    });
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const isExpired =
    !integration.expires_at ||
    integration.expires_at <= currentTime + EXPIRY_BUFFER_SECONDS;

  if (!isExpired) {
    const timeUntilExpiry = integration.expires_at! - currentTime;
    console.info('[Twitter Token] Using existing token', {
      teamId,
      integrationId: integration.id,
      expiresIn: `${Math.floor(timeUntilExpiry / 60)} minutes`,
      expiresAt: new Date(integration.expires_at! * 1000).toISOString()
    });
    return {
      access_token: integration.access_token,
      expires_at: integration.expires_at!
    };
  }

  if (!integration.refresh_token) {
    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message: 'Token expired and no refresh token available'
    });
  }

  console.info('[Twitter Token] Token expired, refreshing', {
    teamId,
    integrationId: integration.id,
    expiredAt: integration.expires_at
      ? new Date(integration.expires_at * 1000).toISOString()
      : 'unknown',
    expiryBuffer: `${EXPIRY_BUFFER_SECONDS}s`
  });

  const tokenResponse = await fetch('https://api.x.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${TWITTER_TEAM_APP_CLIENT_ID}:${TWITTER_TEAM_APP_CLIENT_SECRET}`).toString('base64')}`
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: integration.refresh_token
    })
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.json();
    console.error('Twitter token refresh failed:', {
      status: tokenResponse.status,
      error,
      refreshTokenLength: integration.refresh_token.length,
      refreshTokenPreview: `${integration.refresh_token.substring(0, 10)}...`
    });

    await tx.integration.update({
      where: { id: integration.id },
      data: {
        status: IntegrationStatus.ERROR
      }
    });

    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message: 'Failed to refresh access token',
      cause: JSON.stringify(error),
      data: {
        twitterError: error,
        statusCode: tokenResponse.status
      }
    });
  }

  const tokens = await tokenResponse.json();

  const expiresAt = Math.floor(Date.now() / 1000) + tokens.expires_in;

  await tx.integration.update({
    where: { id: integration.id },
    data: {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || integration.refresh_token,
      expires_at: expiresAt,
      scope: tokens.scope,
      token_type: tokens.token_type
    }
  });

  console.info('[Twitter Token] Token refreshed successfully', {
    teamId,
    integrationId: integration.id,
    newExpiresAt: new Date(expiresAt * 1000).toISOString(),
    expiresIn: `${Math.floor(tokens.expires_in / 60)} minutes`
  });

  return {
    access_token: tokens.access_token,
    expires_at: expiresAt
  };
};
