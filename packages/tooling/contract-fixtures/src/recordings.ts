import {
  anonymousBlueskyActor,
  anonymousXUser,
  firstItems,
  redactSecrets,
  replaceText
} from './sanitize.ts';

export type RecordingEnv = Record<string, string | undefined>;

export type FetchJson = (url: string, init?: RequestInit) => Promise<unknown>;

export type Recording = {
  name: string;
  fixture: string;
  needs: string[];
  record: (env: RecordingEnv, fetchJson: FetchJson) => Promise<unknown>;
  sanitize: (body: unknown) => unknown;
};

export const RECORDED_CURSOR = 'recorded-cursor';

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const scrapeBadger = (env: RecordingEnv, path: string, fetchJson: FetchJson) =>
  fetchJson(`https://scrapebadger.com/v1/twitter${path}`, {
    headers: {
      Accept: 'application/json',
      'X-API-Key': env.SCRAPEBADGER_API_KEY ?? ''
    }
  });

const blueskyPost = (env: RecordingEnv) => {
  const url = env.RECORD_BLUESKY_POST_URL ?? '';
  const match = url.match(/bsky\.app\/profile\/([^/]+)\/post\/([^/?#]+)/);
  if (!match) {
    throw new Error(
      'RECORD_BLUESKY_POST_URL must look like https://bsky.app/profile/<handle>/post/<rkey>'
    );
  }
  return { url, handle: match[1], rkey: match[2] };
};

const blueskyXrpc = async (env: RecordingEnv, fetchJson: FetchJson) => {
  const identifier = env.RECORD_BLUESKY_IDENTIFIER;
  const password = env.RECORD_BLUESKY_APP_PASSWORD;
  if (!identifier || !password) {
    return (nsid: string, params: Record<string, string>) =>
      fetchJson(
        `https://public.api.bsky.app/xrpc/${nsid}?${new URLSearchParams(params)}`
      );
  }
  const session = asRecord(
    await fetchJson(
      'https://bsky.social/xrpc/com.atproto.server.createSession',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      }
    )
  );
  return (nsid: string, params: Record<string, string>) =>
    fetchJson(
      `https://bsky.social/xrpc/${nsid}?${new URLSearchParams(params)}`,
      { headers: { Authorization: `Bearer ${String(session.accessJwt)}` } }
    );
};

const blueskyPostUri = async (env: RecordingEnv, fetchJson: FetchJson) => {
  const post = blueskyPost(env);
  const xrpc = await blueskyXrpc(env, fetchJson);
  const profile = asRecord(
    await xrpc('app.bsky.actor.getProfile', { actor: post.handle })
  );
  return {
    xrpc,
    uri: `at://${String(profile.did)}/app.bsky.feed.post/${post.rkey}`
  };
};

const anonymousActors =
  (listKey: string, role: string, actorKey?: string) => (body: unknown) => {
    const page = asRecord(body);
    return redactSecrets({
      ...page,
      ...('cursor' in page
        ? { cursor: replaceText(page.cursor, RECORDED_CURSOR) }
        : {}),
      [listKey]: firstItems(page[listKey]).map((item, index) =>
        actorKey
          ? {
              ...asRecord(item),
              [actorKey]: anonymousBlueskyActor(
                asRecord(item)[actorKey],
                role,
                index
              )
            }
          : anonymousBlueskyActor(item, role, index)
      )
    });
  };

const twitchAppToken = async (env: RecordingEnv, fetchJson: FetchJson) =>
  fetchJson('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.TWITCH_CLIENT_ID ?? '',
      client_secret: env.TWITCH_CLIENT_SECRET ?? '',
      grant_type: 'client_credentials'
    })
  });

const twitchHelix = async (
  env: RecordingEnv,
  path: string,
  fetchJson: FetchJson
) => {
  const token = asRecord(await twitchAppToken(env, fetchJson));
  return fetchJson(`https://api.twitch.tv/helix${path}`, {
    headers: {
      Authorization: `Bearer ${String(token.access_token)}`,
      'Client-Id': env.TWITCH_CLIENT_ID ?? ''
    }
  });
};

const anonymousSubscription = (subscription: unknown, index: number) => {
  const value = asRecord(subscription);
  const condition = asRecord(value.condition);
  return {
    ...value,
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    condition: {
      ...condition,
      ...('broadcaster_user_id' in condition
        ? { broadcaster_user_id: String(100000001 + index) }
        : {})
    }
  };
};

const X_SCRAPER = 'packages/integrations/x/x-scraper/src/testing';
const X_API = 'packages/integrations/x/x-api/src/testing';
const BLUESKY_API = 'packages/integrations/bluesky/bluesky-api/src/testing';
const TWITCH_API = 'packages/integrations/twitch/twitch-api/src/testing';
const DISCORD_API = 'packages/integrations/discord/discord-api/src/testing';

export const RECORDINGS: Recording[] = [
  {
    name: 'ScrapeBadger tweets.getById',
    fixture: `${X_SCRAPER}/fixtures-scrapebadger-tweet.json`,
    needs: ['SCRAPEBADGER_API_KEY', 'RECORD_X_TWEET_ID'],
    record: (env, fetchJson) =>
      scrapeBadger(env, `/tweets/tweet/${env.RECORD_X_TWEET_ID}`, fetchJson),
    sanitize: (body) => redactSecrets(body)
  },
  {
    name: 'ScrapeBadger users.getByUsername',
    fixture: `${X_SCRAPER}/fixtures-scrapebadger-user.json`,
    needs: ['SCRAPEBADGER_API_KEY', 'RECORD_X_USERNAME'],
    record: (env, fetchJson) =>
      scrapeBadger(
        env,
        `/users/${env.RECORD_X_USERNAME}/by_username`,
        fetchJson
      ),
    sanitize: (body) => redactSecrets(body)
  },
  {
    name: 'ScrapeBadger tweets.getRetweeters',
    fixture: `${X_SCRAPER}/fixtures-scrapebadger-retweeters.json`,
    needs: ['SCRAPEBADGER_API_KEY', 'RECORD_X_TWEET_ID'],
    record: (env, fetchJson) =>
      scrapeBadger(
        env,
        `/tweets/tweet/${env.RECORD_X_TWEET_ID}/retweeters`,
        fetchJson
      ),
    sanitize: (body) => {
      const page = asRecord(body);
      return redactSecrets({
        ...page,
        data: firstItems(page.data).map(anonymousXUser),
        next_cursor: replaceText(page.next_cursor, RECORDED_CURSOR)
      });
    }
  },
  {
    name: 'X GET /oembed',
    fixture: `${X_API}/fixtures-x-oembed.json`,
    needs: ['RECORD_X_USERNAME', 'RECORD_X_TWEET_ID'],
    record: (env, fetchJson) =>
      fetchJson(
        `https://publish.twitter.com/oembed?${new URLSearchParams({
          url: `https://twitter.com/${env.RECORD_X_USERNAME}/status/${env.RECORD_X_TWEET_ID}`,
          theme: 'dark'
        })}`
      ),
    sanitize: (body) => redactSecrets(body)
  },
  {
    name: 'Bluesky app.bsky.actor.getProfile',
    fixture: `${BLUESKY_API}/fixtures-bluesky-profile.json`,
    needs: ['RECORD_BLUESKY_POST_URL'],
    record: async (env, fetchJson) =>
      (await blueskyXrpc(env, fetchJson))('app.bsky.actor.getProfile', {
        actor: blueskyPost(env).handle
      }),
    sanitize: (body) => redactSecrets(body)
  },
  {
    name: 'Bluesky app.bsky.feed.getLikes',
    fixture: `${BLUESKY_API}/fixtures-bluesky-likes.json`,
    needs: ['RECORD_BLUESKY_POST_URL'],
    record: async (env, fetchJson) => {
      const { xrpc, uri } = await blueskyPostUri(env, fetchJson);
      return xrpc('app.bsky.feed.getLikes', { uri, limit: '3' });
    },
    sanitize: anonymousActors('likes', 'liker', 'actor')
  },
  {
    name: 'Bluesky app.bsky.feed.getRepostedBy',
    fixture: `${BLUESKY_API}/fixtures-bluesky-reposted-by.json`,
    needs: ['RECORD_BLUESKY_POST_URL'],
    record: async (env, fetchJson) => {
      const { xrpc, uri } = await blueskyPostUri(env, fetchJson);
      return xrpc('app.bsky.feed.getRepostedBy', { uri, limit: '3' });
    },
    sanitize: anonymousActors('repostedBy', 'reposter')
  },
  {
    name: 'Bluesky app.bsky.feed.getPostThread',
    fixture: `${BLUESKY_API}/fixtures-bluesky-post-thread.json`,
    needs: ['RECORD_BLUESKY_POST_URL'],
    record: async (env, fetchJson) => {
      const { xrpc, uri } = await blueskyPostUri(env, fetchJson);
      return xrpc('app.bsky.feed.getPostThread', { uri, depth: '0' });
    },
    sanitize: (body) => redactSecrets(body)
  },
  {
    name: 'Bluesky GET /oembed',
    fixture: `${BLUESKY_API}/fixtures-bluesky-oembed.json`,
    needs: ['RECORD_BLUESKY_POST_URL'],
    record: (env, fetchJson) =>
      fetchJson(
        `https://embed.bsky.app/oembed?${new URLSearchParams({
          url: blueskyPost(env).url
        })}`
      ),
    sanitize: (body) => redactSecrets(body)
  },
  {
    name: 'Twitch POST /oauth2/token client_credentials',
    fixture: `${TWITCH_API}/fixtures-twitch-app-token.json`,
    needs: ['TWITCH_CLIENT_ID', 'TWITCH_CLIENT_SECRET'],
    record: twitchAppToken,
    sanitize: (body) => redactSecrets(body)
  },
  {
    name: 'Twitch GET /helix/users',
    fixture: `${TWITCH_API}/fixtures-twitch-users.json`,
    needs: ['TWITCH_CLIENT_ID', 'TWITCH_CLIENT_SECRET', 'RECORD_TWITCH_LOGIN'],
    record: (env, fetchJson) =>
      twitchHelix(
        env,
        `/users?${new URLSearchParams({ login: env.RECORD_TWITCH_LOGIN ?? '' })}`,
        fetchJson
      ),
    sanitize: (body) => redactSecrets(body)
  },
  {
    name: 'Twitch GET /helix/eventsub/subscriptions',
    fixture: `${TWITCH_API}/fixtures-twitch-eventsub-subscriptions.json`,
    needs: ['TWITCH_CLIENT_ID', 'TWITCH_CLIENT_SECRET'],
    record: (env, fetchJson) =>
      twitchHelix(env, '/eventsub/subscriptions', fetchJson),
    sanitize: (body) => {
      const list = asRecord(body);
      const pagination = asRecord(list.pagination);
      return redactSecrets({
        ...list,
        data: firstItems(list.data, 2).map(anonymousSubscription),
        ...('pagination' in list
          ? {
              pagination:
                'cursor' in pagination
                  ? { cursor: replaceText(pagination.cursor, RECORDED_CURSOR) }
                  : pagination
            }
          : {})
      });
    }
  },
  {
    name: 'Discord GET /guilds/:id',
    fixture: `${DISCORD_API}/fixtures-discord-guild.json`,
    needs: ['DISCORD_BOT_TOKEN', 'RECORD_DISCORD_GUILD_ID'],
    record: (env, fetchJson) =>
      fetchJson(
        `https://discord.com/api/v10/guilds/${env.RECORD_DISCORD_GUILD_ID}`,
        { headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } }
      ),
    sanitize: (body) => {
      const guild = asRecord(body);
      return redactSecrets({
        ...guild,
        ...('owner_id' in guild ? { owner_id: '100000000000000001' } : {}),
        ...('emojis' in guild ? { emojis: [] } : {}),
        ...('stickers' in guild ? { stickers: [] } : {})
      });
    }
  }
];

export const missingEnv = (recording: Recording, env: RecordingEnv) =>
  recording.needs.filter((name) => !env[name]);

export const selectRecordings = (only: string[]) =>
  only.length === 0
    ? RECORDINGS
    : RECORDINGS.filter((recording) =>
        only.some((filter) =>
          recording.name.toLowerCase().includes(filter.toLowerCase())
        )
      );

export const toFixture = (body: unknown, recordedAt: Date) => ({
  recordedAt: recordedAt.toISOString().slice(0, 10),
  body
});
