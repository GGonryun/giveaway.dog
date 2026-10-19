import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeNetwork } from '@giveaway/testing-server/faults';
import { getAppAccessToken } from '../get-app-access-token';
import { getTwitchUser } from '../get-user';
import { twitchAppAccessTokenSchema, twitchUsersSchema } from '../schemas';
import { twitchAppAccessTokenFixture } from '../testing/fixtures-twitch-app-access-token';
import { twitchUsersFixture } from '../testing/fixtures-twitch-users';

vi.hoisted(() => {
  vi.stubEnv('TWITCH_CLIENT_ID', 'client-id');
  vi.stubEnv('TWITCH_CLIENT_SECRET', 'client-secret');
});

describe('Twitch app access token and users contract', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses the recorded token and users with the schemas of the app', () => {
    expect(
      twitchAppAccessTokenSchema.safeParse(twitchAppAccessTokenFixture)
    ).toEqual(expect.objectContaining({ success: true }));
    expect(twitchUsersSchema.safeParse(twitchUsersFixture)).toEqual(
      expect.objectContaining({ success: true })
    );
  });

  it('reads the access token of the recorded token response', async () => {
    const network = fakeNetwork();
    network.json(
      'POST https://id.twitch.tv/oauth2/token',
      twitchAppAccessTokenFixture
    );

    await expect(getAppAccessToken()).resolves.toBe(
      'twitch-fixture-app-access-token'
    );
  });

  it('turns the recorded users into the Twitch user of the app', async () => {
    const network = fakeNetwork();
    network.json('https://api.twitch.tv/helix/users', twitchUsersFixture);

    await expect(getTwitchUser('user-token')).resolves.toEqual({
      id: '141981764',
      login: 'acmegiveaways',
      display_name: 'AcmeGiveaways',
      profile_image_url:
        'https://static-cdn.jtvnw.net/jtv_user_pictures/acmegiveaways-profile_image-300x300.png'
    });
  });
});
