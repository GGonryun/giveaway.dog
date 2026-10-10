import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SweepstakesJobType } from '@giveaway/db-model';
import { prismaMock, asPrismaClient } from '@giveaway/testing-server/prisma';
import {
  FAULTS,
  type Fault,
  type FakeNetwork,
  fakeNetwork,
  isTransientFault,
  knownBug,
  retryAfterTime,
  settleWithin
} from '@giveaway/testing-server/faults';
import { runSweepstakesJobs } from '../process-sweepstakes-jobs';

const NOW = new Date('2026-03-01T12:00:00.000Z');
const WEBHOOK = 'POST https://discord.com/api/webhooks/1/secret';
const DISCORD_MESSAGE =
  'PATCH https://discord.com/api/v10/channels/chan-1/messages/msg-1';

const ISSUES = {
  retry: '#183',
  timeout: '#303'
};

const job = (id: string, type: SweepstakesJobType) => ({
  id,
  sweepstakesId: 'sw-1',
  type,
  status: 'PENDING',
  data: null,
  error: null,
  runAt: new Date('2026-03-01T11:00:00.000Z'),
  createdAt: new Date('2026-02-01T00:00:00.000Z'),
  updatedAt: new Date('2026-02-01T00:00:00.000Z')
});

const giveaway = (status: 'ACTIVE' | 'COMPLETED') => ({
  id: 'sw-1',
  tasks: [],
  visibility: { visibility: 'PUBLIC', slug: 'summer' },
  teamId: 'team-1',
  details: { name: 'Summer Giveaway', description: null, banner: null },
  timing: {
    startDate: new Date('2026-02-01T00:00:00.000Z'),
    endDate: new Date('2026-03-10T00:00:00.000Z')
  },
  status,
  posts: [
    {
      id: 'post-1',
      type: 'POST_TO_DISCORD',
      status: 'COMPLETED',
      response: { channelId: 'chan-1', messageId: 'msg-1' }
    }
  ],
  team: { name: 'Acme', logo: null },
  prizes: []
});

type Expectation = 'finishes' | 'retries';

type Bugs = Partial<Record<Expectation, Partial<Record<Fault, string>>>>;

const HANGS: Bugs = {
  finishes: { timeout: ISSUES.timeout },
  retries: {
    timeout: ISSUES.timeout,
    'rate-limit': ISSUES.retry,
    'rate-limit-retry-after': ISSUES.retry,
    'server-error': ISSUES.retry,
    'network-error': ISSUES.retry
  }
};

const CALLS: {
  call: string;
  type: SweepstakesJobType;
  match: string;
  status: 'ACTIVE' | 'COMPLETED';
  bugs: Bugs;
  faults?: readonly Fault[];
}[] = [
  {
    call: 'the Discord announcement of a PROCESS_ACTIVATION job',
    type: 'PROCESS_ACTIVATION',
    match: WEBHOOK,
    status: 'ACTIVE',
    bugs: HANGS,
    faults: FAULTS.filter((fault) => fault !== 'malformed-body')
  },
  {
    call: 'the Discord message update of a PROCESS_EXPIRATION job',
    type: 'PROCESS_EXPIRATION',
    match: DISCORD_MESSAGE,
    status: 'ACTIVE',
    bugs: HANGS
  },
  {
    call: 'the Discord message update of a PROCESS_COMPLETION job',
    type: 'PROCESS_COMPLETION',
    match: DISCORD_MESSAGE,
    status: 'COMPLETED',
    bugs: HANGS
  }
];

const updatesOf = (id: string) =>
  prismaMock.sweepstakesJob.update.mock.calls
    .map(([arg]) => arg)
    .filter((arg) => arg.where.id === id);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  vi.setSystemTime(NOW);
  vi.stubEnv(
    'DISCORD_WEBHOOK_URL',
    'https://discord.com/api/webhooks/1/secret'
  );
  vi.stubEnv('DISCORD_BOT_TOKEN', 'bot-token');
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  prismaMock.sweepstakesJob.update.mockResolvedValue({});
  prismaMock.sweepstakesParticipant.count.mockResolvedValue(12);
  prismaMock.taskCompletion.count.mockResolvedValue(30);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('runSweepstakesJobs with a failing third-party call', () => {
  describe.each(CALLS)(
    'when $call fails',
    ({ type, match, status, bugs, faults = FAULTS }) => {
      let network: FakeNetwork;

      beforeEach(() => {
        network = fakeNetwork();
        network.on(WEBHOOK, new Response(null, { status: 204 }));
        network.json(DISCORD_MESSAGE, { id: 'msg-1', channel_id: 'chan-1' });
        prismaMock.sweepstakesJob.findMany.mockResolvedValue([
          job('job-1', type),
          job('job-2', 'PROCESS_MODIFICATION')
        ]);
        prismaMock.sweepstakes.findUnique.mockResolvedValue(giveaway(status));
      });

      it('completes the job when nothing fails', async () => {
        await settleWithin(runSweepstakesJobs(asPrismaClient()));

        expect(network.requests(match)).not.toHaveLength(0);
        expect(updatesOf('job-1').at(-1)).toEqual({
          where: { id: 'job-1' },
          data: { status: 'COMPLETED' }
        });
      });

      describe.each(faults)('with %s', (fault) => {
        it(
          ...knownBug(
            'finishes the run, records the failure and still processes the next job',
            bugs.finishes?.[fault]
          ),
          async () => {
            network.fault(match, fault);

            await expect(
              settleWithin(runSweepstakesJobs(asPrismaClient()))
            ).resolves.toEqual({ processed: 2 });

            expect(network.requests(match)).not.toHaveLength(0);
            expect(updatesOf('job-1').at(-1)).toEqual({
              where: { id: 'job-1' },
              data: expect.objectContaining({
                status: expect.stringMatching(/^(FAILED|PENDING)$/)
              })
            });
            expect(updatesOf('job-2')).toEqual([
              { where: { id: 'job-2' }, data: { status: 'COMPLETED' } }
            ]);
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
            network.fault(match, fault);

            await settleWithin(runSweepstakesJobs(asPrismaClient()));

            const outcome = updatesOf('job-1').at(-1);
            expect(outcome?.data.status).toBe('PENDING');
            expect(outcome?.data.runAt.getTime()).toBeGreaterThanOrEqual(
              fault === 'rate-limit-retry-after'
                ? retryAt.getTime()
                : Date.now() + 1
            );
          }
        );
      });
    }
  );

  it('completes an activation job when the announcement is accepted with a body it does not read', async () => {
    const network = fakeNetwork();
    network.fault(WEBHOOK, 'malformed-body');
    prismaMock.sweepstakesJob.findMany.mockResolvedValue([
      job('job-1', 'PROCESS_ACTIVATION')
    ]);
    prismaMock.sweepstakes.findUnique.mockResolvedValue(giveaway('ACTIVE'));

    await settleWithin(runSweepstakesJobs(asPrismaClient()));

    expect(updatesOf('job-1')).toEqual([
      { where: { id: 'job-1' }, data: { status: 'COMPLETED' } }
    ]);
  });
});
