import { ApplicationError } from '@/lib/errors';
import { IntegrationProvider } from '@prisma/client';
import { TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET } from '../schemas';
import { Tx } from '@/lib/prisma';

const EXPIRY_BUFFER_SECONDS = 300;

export const getLatestTwitterAccessToken = async (
  tx: Tx,
  {
    teamId
  }: {
    teamId: string;
  }
) => {
  if (!TWITTER_CLIENT_ID || !TWITTER_CLIENT_SECRET) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Twitter OAuth not configured'
    });
  }

  const integration = await tx.integration.findFirst({
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

  const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64')}`
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

  return {
    access_token: tokens.access_token,
    expires_at: expiresAt
  };
};
