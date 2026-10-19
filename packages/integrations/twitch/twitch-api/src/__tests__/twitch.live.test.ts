import { expect, it } from 'vitest';
import {
  describeLive,
  expectLiveResponse,
  liveVariable,
  recordResponses
} from '@giveaway/testing-server/live';
import { getAppAccessToken } from '../get-app-access-token';
import { twitchAppAccessTokenSchema, twitchUsersSchema } from '../schemas';

describeLive(
  'Twitch',
  ['TWITCH_CLIENT_ID', 'TWITCH_CLIENT_SECRET', 'LIVE_TWITCH_LOGIN'],
  () => {
    it('gets an app access token and looks up a known user', async () => {
      const tokenCall = { provider: 'Twitch', call: 'app access token' };
      const usersCall = { provider: 'Twitch', call: 'get users by login' };
      const login = liveVariable('LIVE_TWITCH_LOGIN');
      const recorder = recordResponses();

      const accessToken = await getAppAccessToken();

      expectLiveResponse(
        twitchAppAccessTokenSchema,
        recorder.body('POST https://id.twitch.tv/oauth2/token', tokenCall),
        tokenCall
      );

      await fetch(
        `https://api.twitch.tv/helix/users?login=${encodeURIComponent(login)}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Client-Id': liveVariable('TWITCH_CLIENT_ID')
          }
        }
      );

      const users = expectLiveResponse(
        twitchUsersSchema,
        recorder.body('https://api.twitch.tv/helix/users', usersCall),
        usersCall
      );
      expect(users.data.map((user) => user.login)).toEqual([
        login.toLowerCase()
      ]);
    });
  }
);
