import { ApplicationError } from '@/lib/errors';
import { PrismaClient } from '@prisma/client';

const EXPIRY_BUFFER_SECONDS = 300;

export const refreshDiscordToken = async (
  db: PrismaClient,
  {
    userId
  }: {
    userId: string;
  }
): Promise<{
  access_token: string;
  expires_at: number;
}> => {
  const discordClientId = process.env.DISCORD_ID;
  const discordClientSecret = process.env.DISCORD_SECRET;

  if (!discordClientId || !discordClientSecret) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Discord OAuth not configured'
    });
  }

  const account = await db.account.findFirst({
    where: {
      userId,
      provider: 'discord'
    }
  });

  if (!account) {
    throw new ApplicationError({
      code: 'NOT_FOUND',
      message: 'Discord account not found'
    });
  }

  if (!account.access_token) {
    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message: 'No access token available'
    });
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const isExpired =
    !account.expires_at ||
    account.expires_at <= currentTime + EXPIRY_BUFFER_SECONDS;

  if (!isExpired) {
    const timeUntilExpiry = account.expires_at! - currentTime;
    console.info('[Discord Token] Using existing token', {
      userId,
      accountProvider: account.provider,
      expiresIn: `${Math.floor(timeUntilExpiry / 60)} minutes`,
      expiresAt: new Date(account.expires_at! * 1000).toISOString()
    });
    return {
      access_token: account.access_token,
      expires_at: account.expires_at!
    };
  }

  if (!account.refresh_token) {
    await db.account.update({
      where: {
        provider_providerAccountId: {
          provider: 'discord',
          providerAccountId: account.providerAccountId
        }
      },
      data: {
        status: 'ERROR'
      }
    });

    throw new ApplicationError({
      code: 'UNAUTHORIZED',
      message: 'Token expired and no refresh token available'
    });
  }

  console.info('[Discord Token] Token expired, refreshing', {
    userId,
    accountProvider: account.provider,
    expiredAt: account.expires_at
      ? new Date(account.expires_at * 1000).toISOString()
      : 'unknown',
    expiryBuffer: `${EXPIRY_BUFFER_SECONDS}s`
  });

  const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: account.refresh_token,
      client_id: discordClientId,
      client_secret: discordClientSecret
    })
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.json();
    console.error('Discord token refresh failed:', {
      status: tokenResponse.status,
      error,
      refreshTokenLength: account.refresh_token.length,
      refreshTokenPreview: `${account.refresh_token.substring(0, 10)}...`
    });

    // Only set ERROR for auth failures (401, 403), not network issues
    if (tokenResponse.status === 401 || tokenResponse.status === 403) {
      await db.account.update({
        where: {
          provider_providerAccountId: {
            provider: 'discord',
            providerAccountId: account.providerAccountId
          }
        },
        data: {
          status: 'ERROR'
        }
      });
    }

    throw new ApplicationError({
      code: 'UNAUTHORIZED',
      message: 'Failed to refresh Discord access token',
      cause: JSON.stringify(error),
      data: {
        discordError: error,
        statusCode: tokenResponse.status
      }
    });
  }

  const tokens = await tokenResponse.json();

  const expiresAt = Math.floor(Date.now() / 1000) + tokens.expires_in;

  await db.account.update({
    where: {
      provider_providerAccountId: {
        provider: 'discord',
        providerAccountId: account.providerAccountId
      }
    },
    data: {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || account.refresh_token,
      expires_at: expiresAt,
      scope: tokens.scope,
      token_type: tokens.token_type,
      status: 'ACTIVE'
    }
  });

  console.info('[Discord Token] Token refreshed successfully', {
    userId,
    accountProvider: account.provider,
    newExpiresAt: new Date(expiresAt * 1000).toISOString(),
    expiresIn: `${Math.floor(tokens.expires_in / 60)} minutes`
  });

  return {
    access_token: tokens.access_token,
    expires_at: expiresAt
  };
};
