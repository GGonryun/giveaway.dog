import { describe, it, expect, vi } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VIEWER_DID } from '../sanitize.ts';
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

  it.each(RECORDINGS.map((entry) => [entry.name, entry]))(
    'keeps the fixture of %s in the form that the recorder writes',
    (_, entry) => {
      const { body } = JSON.parse(
        readFileSync(join(ROOT, entry.fixture), 'utf8')
      );

      expect(entry.sanitize(body)).toEqual(body);
    }
  );

  it('has one recording for each fixture', () => {
    const fixtures = RECORDINGS.map((entry) => entry.fixture);
    expect(new Set(fixtures).size).toBe(fixtures.length);
  });

  it('only reads from the providers, after it gets a token or a session', async () => {
    const env = {
      ...ENV,
      RECORD_BLUESKY_IDENTIFIER: 'tester.bsky.social',
      RECORD_BLUESKY_APP_PASSWORD: 'app-password'
    };
    const methods = await Promise.all(
      RECORDINGS.map(async (entry) =>
        (await requests(entry.name, env)).map(({ url, method }) =>
          method === 'GET' ? 'GET' : `${method} ${new URL(url).pathname}`
        )
      )
    );

    expect([...new Set(methods.flat())].sort()).toEqual([
      'GET',
      'POST /oauth2/token',
      'POST /xrpc/com.atproto.server.createSession'
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

  it('keeps the tweet fields that the app reads and drops the people it mentions', () => {
    expect(
      recording('ScrapeBadger tweets.getById').sanitize({
        id: '1975236458112819456',
        text: 'Giveaway time!',
        username: 'TheGiveawayDog',
        favorite_count: 48,
        user_mentions: [{ id: '44196397', username: 'real_person' }],
        in_reply_to_screen_name: 'real_person',
        quoted_status: { id: '1', username: 'real_person' },
        media: [
          {
            type: 'photo',
            url: 'https://pbs.twimg.com/media/a.jpg',
            width: 1200,
            height: 675,
            alt_text: null,
            tagged_users: [{ username: 'real_person' }]
          }
        ],
        api_key: 'sb-key'
      })
    ).toEqual({
      id: '1975236458112819456',
      text: 'Giveaway time!',
      username: 'TheGiveawayDog',
      favorite_count: 48,
      media: [
        {
          type: 'photo',
          url: 'https://pbs.twimg.com/media/a.jpg',
          width: 1200,
          height: 675,
          alt_text: null
        }
      ]
    });
  });

  it('keeps the user fields that the app reads', () => {
    expect(
      recording('ScrapeBadger users.getByUsername').sanitize({
        id: '1701234567890123456',
        username: 'TheGiveawayDog',
        followers_count: 1204,
        pinned_tweet_ids: ['1'],
        email: 'owner@example.com'
      })
    ).toEqual({
      id: '1701234567890123456',
      username: 'TheGiveawayDog',
      followers_count: 1204
    });
  });

  it('keeps three anonymous retweeters and replaces the cursor', () => {
    const user = (id: string) => ({
      id,
      username: `person${id}`,
      name: `Person ${id}`,
      followers_count: 1,
      created_at: '2019-04-02T08:15:00Z'
    });

    expect(
      recording('ScrapeBadger tweets.getRetweeters').sanitize({
        data: [user('1'), user('2'), user('3'), user('4')],
        next_cursor: 'real-cursor',
        requested_by: 'real_person'
      })
    ).toEqual({
      data: [
        {
          id: '1000000000000000001',
          username: 'retweeter_1',
          name: 'Retweeter 1',
          followers_count: 100,
          created_at: '2020-01-01T12:00:00Z'
        },
        {
          id: '1000000000000000002',
          username: 'retweeter_2',
          name: 'Retweeter 2',
          followers_count: 200,
          created_at: '2020-01-02T12:00:00Z'
        },
        {
          id: '1000000000000000003',
          username: 'retweeter_3',
          name: 'Retweeter 3',
          followers_count: 300,
          created_at: '2020-01-03T12:00:00Z'
        }
      ],
      next_cursor: RECORDED_CURSOR
    });
  });

  it('fails instead of writing a retweeter that it cannot anonymize', () => {
    expect(() =>
      recording('ScrapeBadger tweets.getRetweeters').sanitize({
        data: [{ id: '1', name: { first: 'Real' } }]
      })
    ).toThrow('The recorder cannot anonymize the value of name');
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
      'app.bsky.feed.getPostThread?uri=at://did:plc:gvdogxk4ui5q2nf3rmbz7ytc/app.bsky.feed.post/3m2jy7mls222b&depth=0&parentHeight=0'
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
        url: 'https://bsky.social/xrpc/app.bsky.feed.getPostThread?uri=at://did:plc:gvdogxk4ui5q2nf3rmbz7ytc/app.bsky.feed.post/3m2jy7mls222b&depth=0&parentHeight=0',
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

  it('anonymizes the likers and the times of their likes and replaces the cursor', () => {
    expect(
      recording('Bluesky app.bsky.feed.getLikes').sanitize({
        uri: 'at://post',
        cursor: 'real-cursor',
        likes: [
          {
            indexedAt: '2026-01-01T00:00:01.000Z',
            createdAt: '2026-01-01T00:00:00.482Z',
            actor: { did: 'did:plc:real', handle: 'real.bsky.social' },
            via: { uri: 'at://did:plc:other/app.bsky.feed.repost/1' }
          }
        ]
      })
    ).toEqual({
      uri: 'at://post',
      cursor: RECORDED_CURSOR,
      likes: [
        {
          indexedAt: '2020-01-01T12:00:00.000Z',
          createdAt: '2020-01-01T12:00:00.000Z',
          actor: {
            did: 'did:plc:likerone2222222222222222',
            handle: 'liker-one.bsky.social'
          }
        }
      ]
    });
  });

  it('keeps the profile of the author without the people the viewer knows', () => {
    const did = 'did:plc:gvdogxk4ui5q2nf3rmbz7ytc';

    expect(
      recording('Bluesky app.bsky.actor.getProfile').sanitize({
        did,
        handle: 'giveaway.dog',
        followersCount: 1204,
        joinedViaStarterPack: { creator: { did: 'did:plc:real' } },
        pinnedPost: { uri: `at://${did}/app.bsky.feed.post/1` },
        viewer: {
          muted: false,
          following:
            'at://did:plc:realviewer/app.bsky.graph.follow/3m2jy7phdqd2b',
          knownFollowers: {
            count: 1,
            followers: [{ did: 'did:plc:real', handle: 'real.bsky.social' }]
          }
        },
        labels: [{ src: did, val: 'x' }]
      })
    ).toEqual({
      did,
      handle: 'giveaway.dog',
      followersCount: 1204,
      viewer: {
        muted: false,
        following: `at://${VIEWER_DID}/app.bsky.graph.follow/3m2jy7phdqd2b`
      },
      labels: []
    });
  });

  it('keeps the post of the thread without its parents, replies, embeds and facets', () => {
    const did = 'did:plc:gvdogxk4ui5q2nf3rmbz7ytc';

    expect(
      recording('Bluesky app.bsky.feed.getPostThread').sanitize({
        thread: {
          $type: 'app.bsky.feed.defs#threadViewPost',
          post: {
            uri: `at://${did}/app.bsky.feed.post/3m2jy7mls222b`,
            cid: 'bafyreibqoz2qrjwd6t6zbwzhbte5g2r32zac7flxdhvmeonfgo6zlkxppi',
            author: {
              did,
              handle: 'giveaway.dog',
              viewer: {
                following:
                  'at://did:plc:realviewer/app.bsky.graph.follow/3m2jy7phdqd2b'
              }
            },
            record: {
              $type: 'app.bsky.feed.post',
              text: 'Giveaway time!',
              createdAt: '2026-10-06T16:00:00.000Z',
              facets: [{ features: [{ did: 'did:plc:real' }] }],
              reply: { parent: { uri: 'at://did:plc:real/post/1' } },
              embed: { record: { uri: 'at://did:plc:real/post/2' } }
            },
            embed: { record: { author: { did: 'did:plc:real' } } },
            likeCount: 27,
            indexedAt: '2026-10-06T16:00:01.512Z',
            viewer: {
              like: 'at://did:plc:realviewer/app.bsky.feed.like/3m2jy7nkcm52b',
              threadMuted: false
            },
            threadgate: { lists: [{ uri: 'at://did:plc:real/list/1' }] }
          },
          parent: { post: { author: { did: 'did:plc:real' } } },
          replies: [{ post: { author: { did: 'did:plc:real' } } }],
          threadContext: { rootAuthorLike: 'at://did:plc:real/like/1' }
        },
        threadgate: { uri: 'at://did:plc:real/threadgate/1' }
      })
    ).toEqual({
      thread: {
        $type: 'app.bsky.feed.defs#threadViewPost',
        post: {
          uri: `at://${did}/app.bsky.feed.post/3m2jy7mls222b`,
          cid: 'bafyreibqoz2qrjwd6t6zbwzhbte5g2r32zac7flxdhvmeonfgo6zlkxppi',
          author: {
            did,
            handle: 'giveaway.dog',
            viewer: {
              following: `at://${VIEWER_DID}/app.bsky.graph.follow/3m2jy7phdqd2b`
            }
          },
          record: {
            $type: 'app.bsky.feed.post',
            text: 'Giveaway time!',
            createdAt: '2026-10-06T16:00:00.000Z'
          },
          likeCount: 27,
          indexedAt: '2026-10-06T16:00:01.512Z',
          viewer: {
            like: `at://${VIEWER_DID}/app.bsky.feed.like/3m2jy7nkcm52b`,
            threadMuted: false
          }
        },
        replies: []
      }
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

  it('replaces each broadcaster of a condition', () => {
    expect(
      recording('Twitch GET /helix/eventsub/subscriptions').sanitize({
        data: [
          {
            id: 'a',
            type: 'channel.raid',
            condition: {
              from_broadcaster_user_id: '12826',
              to_broadcaster_user_id: ''
            }
          }
        ]
      })
    ).toEqual({
      data: [
        {
          id: '00000000-0000-4000-8000-000000000001',
          type: 'channel.raid',
          condition: {
            from_broadcaster_user_id: '100000001',
            to_broadcaster_user_id: ''
          }
        }
      ]
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
        owner_id: '200000000000000002',
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
