import 'server-only';

import { ApplicationError } from '@giveaway/util-errors';
import { parseProviderResponse } from '@giveaway/integration-server/provider-response';
import { TWITCH_CLIENT_ID } from './scopes';
import { twitchUsersResponseSchema } from './schemas';

export const getTwitchUser = async (accessToken: string) => {
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

  const { data } = parseProviderResponse({
    provider: 'twitch',
    call: 'GET /helix/users',
    schema: twitchUsersResponseSchema,
    data: await response.json()
  });
  return data[0];
};
