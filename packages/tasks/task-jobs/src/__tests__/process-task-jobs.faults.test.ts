import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TaskType } from '@giveaway/task-model/schemas';
import { prismaMock, asPrismaClient } from '@giveaway/testing-server/prisma';
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
import { buildTaskJob } from '@giveaway/task-model/testing/fixtures-task-procedures-verification';
import { runTaskJobs } from '../process-task-jobs';

const m = vi.hoisted(() => ({ restore: vi.fn() }));

vi.mock('@giveaway/bluesky-api/bluesky/team-bluesky-client', () => ({
  getTeamBlueskyClient: async () => ({ restore: m.restore })
}));

const NOW = new Date('2026-10-01T12:00:00.000Z');
const PDS = 'https://pds.test';
const RETWEETERS =
  'GET https://scrapebadger.com/v1/twitter/tweets/tweet/1234567890/retweeters';
const PROFILE = `GET ${PDS}/xrpc/app.bsky.actor.getProfile`;
const LIKES = `GET ${PDS}/xrpc/app.bsky.feed.getLikes`;
const REPOSTS = `GET ${PDS}/xrpc/app.bsky.feed.getRepostedBy`;
const POST_URI = 'at://did:plc:giveawaydog/app.bsky.feed.post/3kabc123';

const ISSUES = {
  retry: '#302',
  timeout: '#303',
  token: '#304'
};

type Expectation = 'finishes' | 'retries' | 'staysConnected';

type Bugs = Partial<Record<Expectation, Partial<Record<Fault, string>>>>;

type Call = {
  call: string;
  type: TaskType;
  inject: (network: FakeNetwork, fault: Fault) => void;
  reached: (network: FakeNetwork) => boolean;
  bugs: Bugs;
  refreshesSession?: boolean;
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
  type: TaskType,
  matcher: string,
  bugs: Bugs
): Call => ({
  call,
  type,
  inject: (network, fault) => network.fault(matcher, fault),
  reached: requested(matcher),
  bugs
});

const CALLS: Call[] = [
  networkCall(
    'the ScrapeBadger retweeters request of an X repost import',
    'TWITTER_RETWEET_IMPORT_V2',
    RETWEETERS,
    { retries: RETRIES_LATER }
  ),
  {
    call: 'the Bluesky session refresh of a like import',
    type: 'BLUESKY_LIKE_IMPORT',
    inject: (_, fault) => m.restore.mockRejectedValue(faultError(fault)),
    reached: () => m.restore.mock.calls.length > 0,
    refreshesSession: true,
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
    'the Bluesky profile lookup of a like import',
    'BLUESKY_LIKE_IMPORT',
    PROFILE,
    HANGS
  ),
  networkCall(
    'the Bluesky likes request of a like import',
    'BLUESKY_LIKE_IMPORT',
    LIKES,
    HANGS
  ),
  networkCall(
    'the Bluesky reposts request of a repost import',
    'BLUESKY_REPOST_IMPORT',
    REPOSTS,
    HANGS
  )
];

const updatesOf = (id: string) =>
  prismaMock.taskJob.update.mock.calls
    .map(([arg]) => arg)
    .filter((arg) => arg.where.id === id);

const lastUpdateOf = (id: string) => updatesOf(id).at(-1);

const givenJobs = (type: TaskType) => {
  prismaMock.taskJob.findMany.mockResolvedValue([
    buildTaskJob({
      type,
      data: { runs: 1 },
      job: { id: 'job-1', status: 'PENDING' }
    }),
    buildTaskJob({
      sweepstakes: { status: 'COMPLETED' },
      job: { id: 'job-2', status: 'PENDING' }
    })
  ]);
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  vi.setSystemTime(NOW);
  vi.stubEnv('SCRAPEBADGER_API_KEY', 'scrapebadger-key');
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  prismaMock.taskJob.update.mockResolvedValue({});
  prismaMock.integration.findFirst.mockResolvedValue({
    id: 'bluesky-integration',
    teamId: 'team-1',
    provider: 'BLUESKY',
    status: 'ACTIVE',
    account_id: 'did:plc:host',
    session_state: 'session'
  });
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

describe('runTaskJobs with a failing third-party call', () => {
  describe.each(CALLS)(
    'when $call fails',
    ({ type, inject, reached, bugs, refreshesSession }) => {
      let network: FakeNetwork;

      beforeEach(() => {
        network = fakeNetwork();
        network.json(RETWEETERS, { data: [] });
        network.json(PROFILE, {
          did: 'did:plc:giveawaydog',
          handle: 'giveawaydog.bsky.social'
        });
        network.json(LIKES, { uri: POST_URI, likes: [] });
        network.json(REPOSTS, { uri: POST_URI, repostedBy: [] });
        givenJobs(type);
      });

      it('completes the job and schedules its next run when nothing fails', async () => {
        const result = await settleWithin(runTaskJobs(asPrismaClient()));

        expect(result).toEqual({ processed: 2 });
        expect(reached(network)).toBe(true);
        expect(lastUpdateOf('job-1')).toEqual({
          where: { id: 'job-1' },
          data: { status: 'COMPLETED' }
        });
        expect(prismaMock.taskJob.create).toHaveBeenCalledTimes(1);
      });

      describe.each(FAULTS)('with %s', (fault) => {
        it(
          ...knownBug(
            'finishes the run, records the failure and still processes the next job',
            bugs.finishes?.[fault]
          ),
          async () => {
            inject(network, fault);

            const result = await settleWithin(runTaskJobs(asPrismaClient()));

            expect(result).toEqual({ processed: 2 });
            expect(reached(network)).toBe(true);
            expect(lastUpdateOf('job-1')?.data.status).toMatch(
              /^(FAILED|PENDING)$/
            );
            expect(prismaMock.taskJob.create).not.toHaveBeenCalled();
            expect(prismaMock.taskCompletion.create).not.toHaveBeenCalled();
            expect(lastUpdateOf('job-2')).toEqual({
              where: { id: 'job-2' },
              data: { status: 'COMPLETED' }
            });
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

            await settleWithin(runTaskJobs(asPrismaClient()));

            const outcome = lastUpdateOf('job-1');
            expect(outcome?.data.status).toBe('PENDING');
            expect(outcome?.data.runAt.getTime()).toBeGreaterThanOrEqual(
              fault === 'rate-limit-retry-after'
                ? retryAt.getTime()
                : Date.now() + 1
            );
          }
        );

        if (!refreshesSession) {
          return;
        }

        it(
          ...knownBug(
            "keeps the team's Bluesky integration connected",
            bugs.staysConnected?.[fault]
          ),
          async () => {
            inject(network, fault);

            await settleWithin(runTaskJobs(asPrismaClient()));

            expect(prismaMock.integration.update).not.toHaveBeenCalled();
          }
        );
      });
    }
  );
});
