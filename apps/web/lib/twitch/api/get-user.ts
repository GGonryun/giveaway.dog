import { ApplicationError } from '@giveaway/util-errors';
import { TWITCH_CLIENT_ID } from '../bot/scopes';

interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
}

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

  const data = await response.json();
  return data.data[0];
};
