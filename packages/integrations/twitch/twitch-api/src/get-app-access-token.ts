import 'server-only';

import { ApplicationError } from '@giveaway/util-errors';
import { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET } from './scopes';
import { twitchAppAccessTokenSchema } from './schemas';

export const getAppAccessToken = async () => {
  const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: TWITCH_CLIENT_ID,
      client_secret: TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials'
    })
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.text();
    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message: `Failed to create client_credentials token: ${tokenResponse.status}`,
      data: errorData
    });
  }

  const tokens = twitchAppAccessTokenSchema.safeParse(
    await tokenResponse.json()
  );

  if (!tokens.success) {
    throw new ApplicationError({
      code: 'BAD_GATEWAY',
      message: 'Invalid app access token response from Twitch',
      cause: tokens.error
    });
  }

  return tokens.data.access_token;
};
