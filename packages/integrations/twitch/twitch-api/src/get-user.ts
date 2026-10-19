import 'server-only';

import { ApplicationError } from '@giveaway/util-errors';
import type { z } from 'zod';
import { TWITCH_CLIENT_ID } from './scopes';
import { twitchUserSchema, twitchUsersSchema } from './schemas';

type TwitchUser = z.infer<typeof twitchUserSchema>;

export const getTwitchUser = async (
  accessToken: string
): Promise<TwitchUser> => {
  const response = await fetch('https://api.twitch.tv/helix/users', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Client-Id': TWITCH_CLIENT_ID!
    }
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message: `Failed to fetch Twitch user: ${response.status}`,
      data: errorData
    });
  }

  const users = twitchUsersSchema.safeParse(await response.json());

  if (!users.success) {
    throw new ApplicationError({
      code: 'BAD_GATEWAY',
      message: 'Invalid user response from Twitch',
      cause: users.error
    });
  }

  return users.data.data[0];
};
