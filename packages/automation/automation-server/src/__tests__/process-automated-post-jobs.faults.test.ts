import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AutomatedPostJob } from '@giveaway/db-model';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { expectOk } from '@giveaway/testing-server/result';
import {
  FAULTS,
  type Fault,
  type FakeNetwork,
  faultError,
  fakeNetwork,
  isTransientFault,
  knownBug,
  retryAfterTime,
  settleWithin
} from '@giveaway/testing-server/faults';
import { processAutomatedPostJobs } from '../process-automated-post-jobs';

const m = vi.hoisted(() => {
  process.env.TWITTER_TEAM_APP_CLIENT_ID = 'x-client-id';
  process.env.TWITTER_TEAM_APP_CLIENT_SECRET = 'x-client-secret';
  return { restore: vi.fn() };
});

vi.mock('@giveaway/bluesky-api/bluesky/team-bluesky-client', () => ({
  getTeamBlueskyClient: async () => ({ restore: m.restore })
}));

const NOW = new Date('2026-06-01T12:00:00.000Z');
const PDS = 'https://pds.test';
const IMAGE = 'GET https://cdn.example.com/banner.png';
const X_TOKEN = 'POST https://api.x.com/2/oauth2/token';
const X_MEDIA = 'POST https://api.x.com/2/media/upload';
const X_TWEETS = 'POST https://api.x.com/2/tweets';
const BLUESKY_BLOB = `POST ${PDS}/xrpc/com.atproto.repo.uploadBlob`;
const BLUESKY_RECORD = `POST ${PDS}/xrpc/com.atproto.repo.createRecord`;
const DISCORD_MESSAGES = 'POST https://discord.com/api/v10/channels/chan-1/';
const DISCORD_OK_MESSAGES =
  'POST https://discord.com/api/v10/channels/chan-ok/';

const ISSUES = {
  retry: '#183',
  timeout: '#303',
  token: '#304',
  image: '#305'
};

const job = (
  id: string,
  type: AutomatedPostJob['type'],
  request: AutomatedPostJob['request']
): AutomatedPostJob => ({
  id,
  sweepstakesId: 'sweep-1',
  type,
  status: 'PENDING',
  runAt: new Date('2026-06-01T11:00:00.000Z'),
  createdAt: new Date('2026-06-01T10:00:00.000Z'),
  updatedAt: new Date('2026-06-01T10:00:00.000Z'),
  request,
  response: null
});

const JOBS = {
  POST_TO_TWITTER: job('job-1', 'POST_TO_TWITTER', {
    integrationId: 'x-integration',
    text: 'Win stuff',
    imageUrl: 'https://cdn.example.com/banner.png',
    tasks: ['REPOST', 'LIKE']
  }),
  POST_TO_BLUESKY: job('job-1', 'POST_TO_BLUESKY', {
    integrationId: 'bluesky-integration',
    text: 'Win stuff',
    imageUrl: 'https://cdn.example.com/banner.png',
    tasks: ['REPOST', 'LIKE']
  }),
  POST_TO_DISCORD: job('job-1', 'POST_TO_DISCORD', {
    integrationId: 'discord-integration',
    channelId: 'chan-1',
    roles: [],
    tasks: ['INTERACTION']
  })
};

type Expectation = 'finishes' | 'retries' | 'staysConnected';

type Bugs = Partial<Record<Expectation, Partial<Record<Fault, string>>>>;

type Call = {
  call: string;
  type: keyof typeof JOBS;
  inject: (network: FakeNetwork, fault: Fault) => void;
  reached: (network: FakeNetwork) => boolean;
  bugs: Bugs;
  expiredToken?: boolean;
  refreshesToken?: boolean;
  faults?: readonly Fault[];
};

const RETRIES_LATER: Partial<Record<Fault, string>> = {
  timeout: ISSUES.retry,
  'rate-limit': ISSUES.retry,
  'rate-limit-retry-after': ISSUES.retry,
  'server-error': ISSUES.retry,
  'network-error': ISSUES.retry
};

const HANGS: Bugs = {
  finishes: { timeout: ISSUES.timeout },
  retries: { ...RETRIES_LATER, timeout: ISSUES.timeout }
};

const requested = (matcher: string) => (network: FakeNetwork) =>
  network.requests(matcher).length > 0;

const networkCall = (
  call: string,
  type: keyof typeof JOBS,
  matcher: string,
  options: Partial<Call> = {}
): Call => ({
  call,
  type,
  inject: (network, fault) => network.fault(matcher, fault),
  reached: requested(matcher),
  bugs: HANGS,
  ...options
});

const IMAGE_FAULTS = FAULTS.filter((fault) => fault !== 'malformed-body');

const CALLS: Call[] = [
  networkCall('the X token refresh of an X post', 'POST_TO_TWITTER', X_TOKEN, {
    expiredToken: true,
    refreshesToken: true,
    bugs: {
      ...HANGS,
      staysConnected: {
        timeout: ISSUES.timeout,
        'rate-limit': ISSUES.token,
        'rate-limit-retry-after': ISSUES.token,
        'server-error': ISSUES.token
      }
    }
  }),
  networkCall('the image download of an X post', 'POST_TO_TWITTER', IMAGE, {
    faults: IMAGE_FAULTS
  }),
  networkCall('the X media upload of an X post', 'POST_TO_TWITTER', X_MEDIA),
  networkCall('the X tweet request of an X post', 'POST_TO_TWITTER', X_TWEETS),
  {
    call: 'the Bluesky session refresh of a Bluesky post',
    type: 'POST_TO_BLUESKY',
    inject: (_, fault) => m.restore.mockRejectedValue(faultError(fault)),
    reached: () => m.restore.mock.calls.length > 0,
    refreshesToken: true,
    bugs: {
      retries: RETRIES_LATER,
      staysConnected: {
        timeout: ISSUES.token,
        'rate-limit': ISSUES.token,
        'rate-limit-retry-after': ISSUES.token,
        'server-error': ISSUES.token,
        'network-error': ISSUES.token
      }
    }
  },
  networkCall(
    'the image download of a Bluesky post',
    'POST_TO_BLUESKY',
    IMAGE,
    {
      faults: IMAGE_FAULTS,
      bugs: {
        ...HANGS,
        finishes: {
          timeout: ISSUES.timeout,
          'rate-limit': ISSUES.image,
          'rate-limit-retry-after': ISSUES.image,
          'server-error': ISSUES.image
        }
      }
    }
  ),
  networkCall(
    'the Bluesky image upload of a Bluesky post',
    'POST_TO_BLUESKY',
    BLUESKY_BLOB
  ),
  networkCall(
    'the Bluesky post request of a Bluesky post',
    'POST_TO_BLUESKY',
    BLUESKY_RECORD
  ),
  networkCall(
    'the Discord message of a Discord post',
    'POST_TO_DISCORD',
    DISCORD_MESSAGES
  )
];

const integration = (provider: string, expiredToken: boolean) => {
  const expiresAt = Math.floor(NOW.getTime() / 1000) + 3600;
  return {
    TWITTER: {
      id: 'x-integration',
      teamId: 'team-1',
      provider: 'TWITTER',
      status: 'ACTIVE',
      label: 'giveawaydog',
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expires_at: expiredToken ? expiresAt - 7200 : expiresAt
    },
    BLUESKY: {
      id: 'bluesky-integration',
      teamId: 'team-1',
      provider: 'BLUESKY',
      status: 'ACTIVE',
      label: 'giveawaydog.bsky.social',
      account_id: 'did:plc:host',
      session_state: 'session'
    },
    DISCORD: {
      id: 'discord-integration',
      teamId: 'team-1',
      provider: 'DISCORD',
      status: 'ACTIVE',
      label: 'Giveaways',
      account_id: '111111111111111111'
    }
  }[provider];
};

const sweepstakes = {
  id: 'sweep-1',
  teamId: 'team-1',
  tasks: [],
  visibility: { visibility: 'PUBLIC', slug: 'summer' },
  details: { name: 'Summer Giveaway', description: null, banner: null },
  timing: {
    startDate: new Date('2026-05-01T00:00:00.000Z'),
    endDate: new Date('2026-07-01T00:00:00.000Z')
  },
  status: 'ACTIVE',
  posts: [],
  team: { name: 'Acme', logo: null },
  prizes: []
};

const updatesOf = (id: string) =>
  prismaMock.automatedPostJob.update.mock.calls
    .map(([arg]) => arg)
    .filter((arg) => arg.where.id === id);

const markedIntegrationError = () =>
  prismaMock.integration.update.mock.calls.some(
    ([arg]) => arg.data.status === 'ERROR'
  );

const fakeProviders = () => {
  const network = fakeNetwork();
  network.on(
    IMAGE,
    new Response(new Uint8Array([137, 80, 78, 71]), {
      headers: { 'content-type': 'image/png' }
    })
  );
  network.json(X_TOKEN, {
    access_token: 'new-access-token',
    refresh_token: 'new-refresh-token',
    expires_in: 7200,
    scope: 'tweet.write',
    token_type: 'bearer'
  });
  network.json(X_MEDIA, { data: { id: 'media-1', media_key: '3_media-1' } });
  network.json(X_TWEETS, {
    data: { id: 'tweet-1', text: 'Win stuff', edit_history_tweet_ids: [] }
  });
  network.json(BLUESKY_BLOB, {
    blob: {
      $type: 'blob',
      ref: {
        $link: 'bafkreie5737gdxlw5i64vzichcalba3z2v5n6icifvx5xytvske7mr3hpm'
      },
      mimeType: 'image/png',
      size: 4
    }
  });
  network.json(BLUESKY_RECORD, {
    uri: 'at://did:plc:host/app.bsky.feed.post/3kpost',
    cid: 'bafyreie5737gdxlw5i64vzichcalba3z2v5n6icifvx5xytvske7mr3hpm'
  });
  network.json(DISCORD_MESSAGES, { id: '333', channel_id: 'chan-1' });
  network.json(DISCORD_OK_MESSAGES, { id: '444', channel_id: 'chan-ok' });
  return network;
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  vi.setSystemTime(NOW);
  vi.stubEnv('DISCORD_BOT_TOKEN', 'bot-token');
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  prismaMock.automatedPostJob.update.mockResolvedValue({});
  prismaMock.sweepstakes.findUnique.mockResolvedValue(sweepstakes);
  prismaMock.sweepstakes.update.mockResolvedValue({});
  prismaMock.integration.update.mockResolvedValue({});
  prismaMock.sweepstakesParticipant.count.mockResolvedValue(0);
  prismaMock.taskCompletion.count.mockResolvedValue(0);
  m.restore.mockReset();
  m.restore.mockResolvedValue({
    did: 'did:plc:host',
    fetchHandler: (path: string, init?: RequestInit) =>
      fetch(new URL(path, PDS), init)
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('processAutomatedPostJobs with a failing third-party call', () => {
  describe.each(CALLS)(
    'when $call fails',
    ({
      type,
      inject,
      reached,
      bugs,
      expiredToken = false,
      refreshesToken = false,
      faults = FAULTS
    }) => {
      let network: FakeNetwork;

      beforeEach(() => {
        network = fakeProviders();
        prismaMock.automatedPostJob.findMany.mockResolvedValue([
          JOBS[type],
          job('job-2', 'POST_TO_DISCORD', {
            integrationId: 'discord-integration',
            channelId: 'chan-ok',
            roles: [],
            tasks: []
          })
        ]);
        prismaMock.integration.findFirst.mockImplementation(
          async ({ where }: { where: { provider: string } }) =>
            integration(where.provider, expiredToken)
        );
      });

      it('posts and completes the job when nothing fails', async () => {
        const result = await settleWithin(processAutomatedPostJobs());

        expect(expectOk(result)).toEqual({ processed: 2 });
        expect(reached(network)).toBe(true);
        expect(updatesOf('job-1').at(-1)?.data.status).toBe('COMPLETED');
        expect(prismaMock.sweepstakes.update).toHaveBeenCalledTimes(1);
      });

      describe.each(faults)('with %s', (fault) => {
        it(
          ...knownBug(
            'finishes the run, records the failure, adds no tasks and still processes the next job',
            bugs.finishes?.[fault]
          ),
          async () => {
            inject(network, fault);

            const result = await settleWithin(processAutomatedPostJobs());

            expect(expectOk(result)).toEqual({ processed: 2 });
            expect(reached(network)).toBe(true);
            expect(updatesOf('job-1').at(-1)?.data.status).toMatch(
              /^(FAILED|PENDING)$/
            );
            expect(prismaMock.sweepstakes.update).not.toHaveBeenCalled();
            expect(updatesOf('job-2').at(-1)?.data.status).toBe('COMPLETED');
          }
        );

        if (!isTransientFault(fault)) {
          return;
        }

        it(
          ...knownBug(
            'schedules the job to run again later instead of failing it',
            bugs.retries?.[fault]
          ),
          async () => {
            const retryAt = retryAfterTime();
            inject(network, fault);

            await settleWithin(processAutomatedPostJobs());

            const outcome = updatesOf('job-1').at(-1);
            expect(outcome?.data.status).toBe('PENDING');
            expect(outcome?.data.runAt.getTime()).toBeGreaterThanOrEqual(
              fault === 'rate-limit-retry-after'
                ? retryAt.getTime()
                : Date.now() + 1
            );
          }
        );

        if (!refreshesToken) {
          return;
        }

        it(
          ...knownBug(
            "keeps the team's integration connected",
            bugs.staysConnected?.[fault]
          ),
          async () => {
            inject(network, fault);

            await settleWithin(processAutomatedPostJobs());

            expect(markedIntegrationError()).toBe(false);
          }
        );
      });
    }
  );
});
