'use server';

import { IdentityProvider, PrismaClient } from '@prisma/client';
import { VeloraConnectTaskSchema, VeloraFollowTaskSchema } from '../schemas';
import { ValidateTaskInput } from './integrations';
import { IDENTITY_PROVIDER_TO_AUTH_PROVIDER } from '@/lib/integrations/schemas/providers';
import { ApplicationError } from '@/lib/errors';
import { refreshVeloraToken } from '@/lib/integrations/utils/refresh-velora-token';

export const checkVeloraConnect = async (
  db: PrismaClient,
  input: ValidateTaskInput<VeloraConnectTaskSchema>
) => {
  const user = await db.user.findUnique({
    where: { id: input.userId },
    include: { accounts: true }
  });

  if (
    !user?.accounts?.some(
      (account) =>
        account.provider ===
        IDENTITY_PROVIDER_TO_AUTH_PROVIDER[IdentityProvider.VELORA]
    )
  ) {
    throw new ApplicationError({
      code: 'FORBIDDEN',
      message: 'User does not have a Velora account connected'
    });
  }
};

const extractVeloraUsername = (profileUrl: string): string | null => {
  const match = profileUrl.match(/velora\.tv\/([A-Za-z0-9_.\-]+)\/?$/);
  return match ? match[1] : null;
};

export const checkVeloraFollow = async (
  db: PrismaClient,
  args: {
    task: VeloraFollowTaskSchema;
    userId: string;
  }
): Promise<void> => {
  const { access_token } = await refreshVeloraToken(db, {
    userId: args.userId
  });

  const targetUsername = extractVeloraUsername(args.task.profileUrl);

  if (!targetUsername) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to extract username from Velora profile URL.'
    });
  }

  const userLookupResponse = await fetch(
    `https://api.velora.tv/api/users/${targetUsername}`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/json'
      }
    }
  );

  console.info('[Velora Follow] Fetched target user info', {
    userId: args.userId,
    targetUsername,
    status: userLookupResponse.status
  });

  if (!userLookupResponse.ok) {
    if (userLookupResponse.status === 401) {
      throw new ApplicationError({
        code: 'UNAUTHORIZED',
        message:
          'Velora authorization is invalid. Please reconnect your Velora account.',
        cause: await userLookupResponse.text()
      });
    }

    if (userLookupResponse.status === 404) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: `User ${targetUsername} not found on Velora.`
      });
    }

    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch user information from Velora.',
      cause: await userLookupResponse.text()
    });
  }

  const targetUserData = await userLookupResponse.json();
  const targetUserId = targetUserData.id;

  const followResponse = await fetch(
    `https://api.velora.tv/api/users/follow-status/${targetUserId}`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/json'
      }
    }
  );

  if (!followResponse.ok) {
    if (followResponse.status === 401) {
      throw new ApplicationError({
        code: 'UNAUTHORIZED',
        message:
          'Velora authorization is invalid. Please reconnect your Velora account.',
        cause: await followResponse.text()
      });
    }

    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to verify Velora follow status.',
      cause: await followResponse.text()
    });
  }

  const followData = await followResponse.json();

  if (!followData.isFollowing) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      silent: true,
      message: `You must be following ${targetUsername} on Velora to complete this task.`
    });
  }
};
