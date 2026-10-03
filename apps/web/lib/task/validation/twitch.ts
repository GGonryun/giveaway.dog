import { ApplicationError } from '@giveaway/util-errors';
import { PrismaClient } from '@prisma/client';
import { TwitchFollowTaskSchema } from '../schemas';
import { refreshTwitchToken } from '@/lib/integrations/utils/refresh-twitch-token';

export const checkTwitchFollow = async (
  db: PrismaClient,
  args: {
    task: TwitchFollowTaskSchema;
    userId: string;
  }
): Promise<void> => {
  const { access_token } = await refreshTwitchToken(db, {
    userId: args.userId
  });

  const twitchClientId = process.env.TWITCH_CLIENT_ID;

  if (!twitchClientId) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Twitch OAuth not configured'
    });
  }

  const channelUrl = args.task.channel;
  const channelUsername = channelUrl.match(
    /twitch\.tv\/([A-Za-z0-9_]{4,25})/
  )?.[1];

  if (!channelUsername) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to extract channel username from the URL.'
    });
  }

  const broadcasterResponse = await fetch(
    `https://api.twitch.tv/helix/users?login=${channelUsername}`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Client-Id': twitchClientId
      }
    }
  );

  console.info('[Twitch Follow] Fetched broadcaster info', {
    userId: args.userId,
    channelUsername,
    status: broadcasterResponse.status
  });

  if (!broadcasterResponse.ok) {
    if (broadcasterResponse.status === 401) {
      throw new ApplicationError({
        code: 'UNAUTHORIZED',
        message:
          'Twitch authorization is invalid. Please reconnect your Twitch account.',
        cause: await broadcasterResponse.text()
      });
    }

    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch broadcaster information from Twitch.',
      cause: await broadcasterResponse.text()
    });
  }

  const broadcasterData = await broadcasterResponse.json();

  if (!broadcasterData.data || broadcasterData.data.length === 0) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Broadcaster not found on Twitch.'
    });
  }

  const broadcasterId = broadcasterData.data[0].id;

  const userResponse = await fetch('https://api.twitch.tv/helix/users', {
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Client-Id': twitchClientId
    }
  });

  if (!userResponse.ok) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch user information from Twitch.',
      cause: await userResponse.text()
    });
  }

  const userData = await userResponse.json();

  if (!userData.data || userData.data.length === 0) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'User not found on Twitch.'
    });
  }

  const userId = userData.data[0].id;

  const followResponse = await fetch(
    `https://api.twitch.tv/helix/channels/followed?user_id=${userId}&broadcaster_id=${broadcasterId}`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Client-Id': twitchClientId
      }
    }
  );

  if (!followResponse.ok) {
    if (followResponse.status === 401) {
      throw new ApplicationError({
        code: 'UNAUTHORIZED',
        message:
          'Twitch authorization is invalid. Please reconnect your Twitch account.',
        cause: await followResponse.text()
      });
    }

    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to verify Twitch follow status.',
      cause: await followResponse.text()
    });
  }

  const followData = await followResponse.json();

  if (!followData.data || followData.data.length === 0) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      silent: true,
      message: `You must be following ${channelUsername} on Twitch to complete this task.`
    });
  }
};
