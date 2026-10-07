import { describe, it, expect, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RECORDED_CURSOR,
  RECORDINGS,
  missingEnv,
  selectRecordings,
  toFixture,
  type FetchJson,
  type Recording
} from '../recordings.ts';

const ROOT = fileURLToPath(new URL('../../../../../', import.meta.url));

const recording = (name: string): Recording => {
  const found = RECORDINGS.find((entry) => entry.name === name);
  if (!found) throw new Error(`No recording named ${name}`);
  return found;
};

const ENV = {
  SCRAPEBADGER_API_KEY: 'sb-key',
  RECORD_X_TWEET_ID: '1975236458112819456',
  RECORD_X_USERNAME: 'TheGiveawayDog',
  RECORD_BLUESKY_POST_URL:
    'https://bsky.app/profile/giveaway.dog/post/3m2jy7mls222b',
  TWITCH_CLIENT_ID: 'twitch-id',
  TWITCH_CLIENT_SECRET: 'twitch-secret',
  RECORD_TWITCH_LOGIN: 'twitchdev',
  DISCORD_BOT_TOKEN: 'bot-token',
  RECORD_DISCORD_GUILD_ID: '197038439483310086'
};

const requests = async (
  name: string,
  env: Record<string, string> = ENV,
  responses: Record<string, unknown> = {}
) => {
  const fetchJson = vi.fn<FetchJson>(async (url) => {
    const match = Object.keys(responses).find((part) => url.includes(part));
    return match ? responses[match] : {};
  });
  await recording(name).record(env, fetchJson);
  return fetchJson.mock.calls.map(([url, init]) => ({
    url: decodeURIComponent(url),
    method: init?.method ?? 'GET',
    headers: init?.headers
  }));
};

describe('RECORDINGS', () => {
  it.each(RECORDINGS.map((entry) => [entry.name, entry.fixture]))(
    'writes the fixture of %s to a file that exists',
    (_, fixture) => {
      expect(existsSync(join(ROOT, fixture))).toBe(true);
    }
  );

  it('has one recording for each fixture', () => {
    const fixtures = RECORDINGS.map((entry) => entry.fixture);
    expect(new Set(fixtures).size).toBe(fixtures.length);
  });

  it('only reads from the providers', async () => {
    const methods = await Promise.all(
      RECORDINGS.map(async (entry) =>
        (await requests(entry.name)).map(({ url, method }) =>
          method === 'GET' ? 'GET' : `${method} ${new URL(url).pathname}`
        )
      )
    );

    expect([...new Set(methods.flat())].sort()).toEqual([
      'GET',
      'POST /oauth2/token'
    ]);
  });
});

describe('ScrapeBadger recordings', () => {
  it('reads the tweet with the API key', async () => {
    expect(await requests('ScrapeBadger tweets.getById')).toEqual([
      {
        url: 'https://scrapebadger.com/v1/twitter/tweets/tweet/1975236458112819456',
        method: 'GET',
        headers: { Accept: 'application/json', 'X-API-Key': 'sb-key' }
      }
    ]);
  });

  it('reads the user by username', async () => {
    const [request] = await requests('ScrapeBadger users.getByUsername');
    expect(request.url).toBe(
      'https://scrapebadger.com/v1/twitter/users/TheGiveawayDog/by_username'
    );
  });

  it('reads the retweeters of the tweet', async () => {
    const [request] = await requests('ScrapeBadger tweets.getRetweeters');
    expect(request.url).toBe(
      'https://scrapebadger.com/v1/twitter/tweets/tweet/1975236458112819456/retweeters'
    );
  });

  it('keeps three anonymous retweeters and replaces the cursor', () => {
    const user = (id: string) => ({
      id,
      username: `person${id}`,
      name: `Person ${id}`,
      followers_count: 1
    });

    expect(
      recording('ScrapeBadger tweets.getRetweeters').sanitize({
        data: [user('1'), user('2'), user('3'), user('4')],
        next_cursor: 'real-cursor'
      })
    ).toEqual({
      data: [
        {
          id: '1000000000000000001',
          username: 'retweeter_1',
          name: 'Retweeter 1',
          followers_count: 1
        },
        {
          id: '1000000000000000002',
          username: 'retweeter_2',
          name: 'Retweeter 2',
          followers_count: 1
        },
        {
          id: '1000000000000000003',
          username: 'retweeter_3',
          name: 'Retweeter 3',
          followers_count: 1
        }
      ],
      next_cursor: RECORDED_CURSOR
    });
  });

  it('keeps a null cursor', () => {
    expect(
      recording('ScrapeBadger tweets.getRetweeters').sanitize({
        data: [],
        next_cursor: null
      })
    ).toEqual({ data: [], next_cursor: null });
  });
});

describe('X recordings', () => {
  it('reads the oembed of the tweet in the dark theme', async () => {
    const [request] = await requests('X GET /oembed');
    expect(request.url).toBe(
      'https://publish.twitter.com/oembed?url=https://twitter.com/TheGiveawayDog/status/1975236458112819456&theme=dark'
    );
  });
});

describe('Bluesky recordings', () => {
  const PROFILE = { did: 'did:plc:gvdogxk4ui5q2nf3rmbz7ytc' };

  it('reads the profile of the author from the public AppView', async () => {
    const [request] = await requests('Bluesky app.bsky.actor.getProfile');
    expect(request.url).toBe(
      'https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=giveaway.dog'
    );
  });

  it.each([
    [
      'Bluesky app.bsky.feed.getLikes',
      'app.bsky.feed.getLikes?uri=at://did:plc:gvdogxk4ui5q2nf3rmbz7ytc/app.bsky.feed.post/3m2jy7mls222b&limit=3'
    ],
    [
      'Bluesky app.bsky.feed.getRepostedBy',
      'app.bsky.feed.getRepostedBy?uri=at://did:plc:gvdogxk4ui5q2nf3rmbz7ytc/app.bsky.feed.post/3m2jy7mls222b&limit=3'
    ],
    [
      'Bluesky app.bsky.feed.getPostThread',
      'app.bsky.feed.getPostThread?uri=at://did:plc:gvdogxk4ui5q2nf3rmbz7ytc/app.bsky.feed.post/3m2jy7mls222b&depth=0'
    ]
  ])('%s resolves the author and reads the post', async (name, call) => {
    const calls = await requests(name, ENV, {
      'app.bsky.actor.getProfile': PROFILE
    });

    expect(calls.map(({ url }) => url)).toEqual([
      'https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=giveaway.dog',
      `https://public.api.bsky.app/xrpc/${call}`
    ]);
  });

  it('signs in with an app password when one is set and reads through the PDS', async () => {
    const calls = await requests(
      'Bluesky app.bsky.feed.getPostThread',
      {
        ...ENV,
        RECORD_BLUESKY_IDENTIFIER: 'tester.bsky.social',
        RECORD_BLUESKY_APP_PASSWORD: 'app-password'
      },
      {
        createSession: { accessJwt: 'session-jwt' },
        'app.bsky.actor.getProfile': PROFILE
      }
    );

    expect(calls[0]).toMatchObject({
      url: 'https://bsky.social/xrpc/com.atproto.server.createSession',
      method: 'POST'
    });
    expect(calls.slice(1)).toEqual([
      {
        url: 'https://bsky.social/xrpc/app.bsky.actor.getProfile?actor=giveaway.dog',
        method: 'GET',
        headers: { Authorization: 'Bearer session-jwt' }
      },
      {
        url: 'https://bsky.social/xrpc/app.bsky.feed.getPostThread?uri=at://did:plc:gvdogxk4ui5q2nf3rmbz7ytc/app.bsky.feed.post/3m2jy7mls222b&depth=0',
        method: 'GET',
        headers: { Authorization: 'Bearer session-jwt' }
      }
    ]);
  });

  it('reads the oembed of the post', async () => {
    const [request] = await requests('Bluesky GET /oembed');
    expect(request.url).toBe(
      'https://embed.bsky.app/oembed?url=https://bsky.app/profile/giveaway.dog/post/3m2jy7mls222b'
    );
  });

  it('rejects a post url that does not name a post', async () => {
    await expect(
      requests('Bluesky GET /oembed', {
        ...ENV,
        RECORD_BLUESKY_POST_URL: 'https://bsky.app/profile/giveaway.dog'
      })
    ).rejects.toThrow('RECORD_BLUESKY_POST_URL must look like');
  });

  it('anonymizes the likers and replaces the cursor', () => {
    expect(
      recording('Bluesky app.bsky.feed.getLikes').sanitize({
        uri: 'at://post',
        cursor: 'real-cursor',
        likes: [
          {
            createdAt: '2026-01-01T00:00:00.000Z',
            actor: { did: 'did:plc:real', handle: 'real.bsky.social' }
          }
        ]
      })
    ).toEqual({
      uri: 'at://post',
      cursor: RECORDED_CURSOR,
      likes: [
        {
          createdAt: '2026-01-01T00:00:00.000Z',
          actor: {
            did: 'did:plc:likerone2222222222222222',
            handle: 'liker-one.bsky.social'
          }
        }
      ]
    });
  });

  it('anonymizes the reposters and keeps a page without a cursor', () => {
    expect(
      recording('Bluesky app.bsky.feed.getRepostedBy').sanitize({
        uri: 'at://post',
        repostedBy: [{ did: 'did:plc:real', handle: 'real.bsky.social' }]
      })
    ).toEqual({
      uri: 'at://post',
      repostedBy: [
        {
          did: 'did:plc:reposterone2222222222222',
          handle: 'reposter-one.bsky.social'
        }
      ]
    });
  });
});

describe('Twitch recordings', () => {
  it('requests an app token with the client credentials', async () => {
    const [request] = await requests(
      'Twitch POST /oauth2/token client_credentials'
    );
    expect(request).toMatchObject({
      url: 'https://id.twitch.tv/oauth2/token',
      method: 'POST'
    });
  });

  it('reads the user by login with an app token', async () => {
    const calls = await requests('Twitch GET /helix/users', ENV, {
      'oauth2/token': { access_token: 'app-token' }
    });

    expect(calls[1]).toEqual({
      url: 'https://api.twitch.tv/helix/users?login=twitchdev',
      method: 'GET',
      headers: { Authorization: 'Bearer app-token', 'Client-Id': 'twitch-id' }
    });
  });

  it('redacts the token of the app token response', () => {
    expect(
      recording('Twitch POST /oauth2/token client_credentials').sanitize({
        access_token: 'real-token',
        expires_in: 100
      })
    ).toEqual({ access_token: 'redacted-access-token', expires_in: 100 });
  });

  it('keeps two subscriptions with synthetic ids and broadcasters', () => {
    const subscription = (id: string) => ({
      id,
      type: 'channel.chat.message',
      condition: { broadcaster_user_id: `real-${id}`, user_id: 'bot' }
    });

    expect(
      recording('Twitch GET /helix/eventsub/subscriptions').sanitize({
        total: 3,
        data: [subscription('a'), subscription('b'), subscription('c')],
        pagination: { cursor: 'real-cursor' }
      })
    ).toEqual({
      total: 3,
      data: [
        {
          id: '00000000-0000-4000-8000-000000000001',
          type: 'channel.chat.message',
          condition: { broadcaster_user_id: '100000001', user_id: 'bot' }
        },
        {
          id: '00000000-0000-4000-8000-000000000002',
          type: 'channel.chat.message',
          condition: { broadcaster_user_id: '100000002', user_id: 'bot' }
        }
      ],
      pagination: { cursor: RECORDED_CURSOR }
    });
  });

  it('keeps an empty pagination and a condition without a broadcaster', () => {
    expect(
      recording('Twitch GET /helix/eventsub/subscriptions').sanitize({
        data: [{ id: 'a', condition: { user_id: 'bot' } }],
        pagination: {}
      })
    ).toEqual({
      data: [
        {
          id: '00000000-0000-4000-8000-000000000001',
          condition: { user_id: 'bot' }
        }
      ],
      pagination: {}
    });
  });
});

describe('Discord recordings', () => {
  it('reads the guild with the bot token', async () => {
    expect(await requests('Discord GET /guilds/:id')).toEqual([
      {
        url: 'https://discord.com/api/v10/guilds/197038439483310086',
        method: 'GET',
        headers: { Authorization: 'Bot bot-token' }
      }
    ]);
  });

  it('replaces the owner and removes the emojis and stickers of the guild', () => {
    expect(
      recording('Discord GET /guilds/:id').sanitize({
        id: '1',
        owner_id: '73193882359173120',
        emojis: [{ user: { id: '2' } }],
        stickers: [{ user: { id: '3' } }],
        roles: [{ id: '4', name: 'Members' }]
      })
    ).toEqual({
      id: '1',
      owner_id: '100000000000000001',
      emojis: [],
      stickers: [],
      roles: [{ id: '4', name: 'Members' }]
    });
  });
});

describe('missingEnv', () => {
  it('lists the variables a recording needs that are not set', () => {
    expect(
      missingEnv(recording('ScrapeBadger tweets.getById'), {
        SCRAPEBADGER_API_KEY: 'key',
        RECORD_X_TWEET_ID: ''
      })
    ).toEqual(['RECORD_X_TWEET_ID']);
  });
});

describe('selectRecordings', () => {
  it('keeps every recording without a filter', () => {
    expect(selectRecordings([])).toBe(RECORDINGS);
  });

  it('keeps the recordings whose name contains a filter, ignoring case', () => {
    expect(
      selectRecordings(['TWITCH', 'oembed']).map((entry) => entry.name)
    ).toEqual([
      'X GET /oembed',
      'Bluesky GET /oembed',
      'Twitch POST /oauth2/token client_credentials',
      'Twitch GET /helix/users',
      'Twitch GET /helix/eventsub/subscriptions'
    ]);
  });
});

describe('toFixture', () => {
  it('wraps the body with the date of the recording', () => {
    expect(
      toFixture({ id: '1' }, new Date('2026-10-07T23:59:00.000Z'))
    ).toEqual({ recordedAt: '2026-10-07', body: { id: '1' } });
  });
});
