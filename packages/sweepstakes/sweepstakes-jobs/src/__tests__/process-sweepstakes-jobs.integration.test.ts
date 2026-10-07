import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SweepstakesJobType, SweepstakesStatus } from '@giveaway/db-model';
import { db, holdTableWrites } from '@giveaway/testing-integration/database';
import {
  createEntries,
  createHost,
  createSweepstakes
} from '@giveaway/testing-integration/fixtures';
import { crashAtEveryWrite } from '@giveaway/testing-integration/faults';
import { fakeNetwork, type FakeNetwork } from '@giveaway/testing-server/faults';
import { processSweepstakesJobs } from '../process-sweepstakes-jobs';

const NOW = new Date('2026-10-01T12:00:00.000Z');
const MINUTE = 60_000;
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1/secret';
const DISCORD_MESSAGE =
  'https://discord.com/api/v10/channels/channel-1/messages/message-1';

let network: FakeNetwork;

const createGiveaway = async ({
  status = 'ACTIVE',
  allowUserSelection = false,
  entries = 0
}: {
  status?: SweepstakesStatus;
  allowUserSelection?: boolean;
  entries?: number;
} = {}) => {
  network.clearRequests();
  const { team } = await createHost();
  const sweepstakes = await createSweepstakes({
    teamId: team.id,
    status,
    criteria: { allowUserSelection }
  });
  await createEntries({
    sweepstakesId: sweepstakes.id,
    taskIds: [sweepstakes.tasks[0].id],
    count: entries
  });
  return sweepstakes;
};

const createJob = (sweepstakesId: string, type: SweepstakesJobType) =>
  db.sweepstakesJob.create({
    data: {
      sweepstakesId,
      type,
      status: 'PENDING',
      runAt: new Date(Date.now() - MINUTE)
    }
  });

const createDiscordPost = (sweepstakesId: string) =>
  db.automatedPostJob.create({
    data: {
      sweepstakesId,
      type: 'POST_TO_DISCORD',
      status: 'COMPLETED',
      runAt: new Date(Date.now() - MINUTE),
      request: {
        integrationId: 'integration-1',
        channelId: 'channel-1',
        roles: [],
        tasks: []
      },
      response: {
        channelId: 'channel-1',
        messageId: 'message-1',
        messageUrl: 'https://discord.com/channels/1/2/3'
      }
    }
  });

const setupActivation = async () => {
  const sweepstakes = await createGiveaway();
  const job = await createJob(sweepstakes.id, 'PROCESS_ACTIVATION');
  return { sweepstakes, job };
};

const setupDiscordUpdate = async (
  type: 'PROCESS_EXPIRATION' | 'PROCESS_COMPLETION'
) => {
  const sweepstakes = await createGiveaway({
    status: type === 'PROCESS_COMPLETION' ? 'COMPLETED' : 'ACTIVE'
  });
  await createDiscordPost(sweepstakes.id);
  const job = await createJob(sweepstakes.id, type);
  return { sweepstakes, job };
};

const setupPrizeAssignment = async () => {
  const sweepstakes = await createGiveaway({
    allowUserSelection: true,
    entries: 3
  });
  const job = await createJob(sweepstakes.id, 'RANDOMLY_ASSIGN_PRIZES');
  return { sweepstakes, job };
};

type Scenario = Awaited<ReturnType<typeof setupActivation>>;

const releaseStoppedJobs = () =>
  db.sweepstakesJob.updateMany({
    where: { status: 'IN_PROGRESS' },
    data: { status: 'PENDING' }
  });

const jobState = async ({ sweepstakes }: Scenario) => ({
  jobs: await db.sweepstakesJob.findMany({
    where: { sweepstakesId: sweepstakes.id },
    select: { type: true, status: true, runAt: true, error: true }
  }),
  allocations: await db.sweepstakesAllocation.count({
    where: { participant: { sweepstakesId: sweepstakes.id } }
  }),
  announced: network.requests(`POST ${WEBHOOK_URL}`).length > 0,
  discordMessageUpdated: network.requests(`PATCH ${DISCORD_MESSAGE}`).length > 0
});

beforeEach(() => {
  vi.stubEnv('DISCORD_WEBHOOK_URL', WEBHOOK_URL);
  vi.stubEnv('DISCORD_BOT_TOKEN', 'bot-token');
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  network = fakeNetwork();
  network.on(`POST ${WEBHOOK_URL}`, new Response(null, { status: 204 }));
  network.json(`PATCH ${DISCORD_MESSAGE}`, {
    id: 'message-1',
    channel_id: 'channel-1'
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('processSweepstakesJobs', () => {
  describe('when the function stops after a write and the job runs again', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(NOW);
    });

    it('announces the giveaway once a clean run completes the activation job', async () => {
      const scenario = await setupActivation();

      await processSweepstakesJobs();

      expect(await jobState(scenario)).toEqual({
        jobs: [
          {
            type: 'PROCESS_ACTIVATION',
            status: 'COMPLETED',
            runAt: new Date(NOW.getTime() - MINUTE),
            error: null
          }
        ],
        allocations: 0,
        announced: true,
        discordMessageUpdated: false
      });
    });

    it.each([
      ['PROCESS_ACTIVATION', setupActivation],
      ['PROCESS_EXPIRATION', () => setupDiscordUpdate('PROCESS_EXPIRATION')],
      ['RANDOMLY_ASSIGN_PRIZES', setupPrizeAssignment]
    ] as const)(
      'reaches the same final state as a clean run after a stop at any write of a %s job',
      async (_, setup) => {
        const { writes, mismatches } = await crashAtEveryWrite({
          setup,
          run: () => processSweepstakesJobs(),
          recover: releaseStoppedJobs,
          state: jobState
        });

        expect(writes).toBeGreaterThan(0);
        expect(mismatches).toEqual([]);
      }
    );

    it.fails(
      'reaches the same final state as a clean run after a stop at any write of a PROCESS_COMPLETION job (fails until #301 is fixed)',
      async () => {
        const { mismatches } = await crashAtEveryWrite({
          setup: () => setupDiscordUpdate('PROCESS_COMPLETION'),
          run: () => processSweepstakesJobs(),
          recover: releaseStoppedJobs,
          state: jobState
        });

        expect(mismatches).toEqual([]);
      }
    );
  });

  describe('when two runs overlap', () => {
    it.fails(
      'announces a giveaway once (fails until #299 is fixed)',
      async () => {
        await setupActivation();

        await holdTableWrites('SweepstakesJob', { writers: 2 }, () =>
          Promise.all([processSweepstakesJobs(), processSweepstakesJobs()])
        );

        expect(network.requests(`POST ${WEBHOOK_URL}`)).toHaveLength(1);
      }
    );

    it('gives each participant one prize', async () => {
      const { sweepstakes } = await setupPrizeAssignment();

      await holdTableWrites('SweepstakesAllocation', { writers: 2 }, () =>
        Promise.all([processSweepstakesJobs(), processSweepstakesJobs()])
      );

      expect(
        await db.sweepstakesAllocation.count({
          where: { participant: { sweepstakesId: sweepstakes.id } }
        })
      ).toBe(3);
    });
  });

  describe('when one job of the run fails', () => {
    it('marks that job failed and still processes the next job', async () => {
      const failing = await setupActivation();
      const next = await setupDiscordUpdate('PROCESS_EXPIRATION');
      network.json(
        `POST ${WEBHOOK_URL}`,
        { message: 'Internal Server Error' },
        { status: 500 }
      );

      await expect(processSweepstakesJobs()).resolves.toEqual({
        processed: 2
      });

      expect(
        await db.sweepstakesJob.findUnique({ where: { id: failing.job.id } })
      ).toMatchObject({ status: 'FAILED' });
      expect(
        await db.sweepstakesJob.findUnique({ where: { id: next.job.id } })
      ).toMatchObject({ status: 'COMPLETED' });
    });

    it.fails(
      'still processes the next job when the giveaway of a job is deleted during the run (fails until #300 is fixed)',
      async () => {
        const deleted = await setupActivation();
        const next = await setupDiscordUpdate('PROCESS_EXPIRATION');
        network.on(`POST ${WEBHOOK_URL}`, async () => {
          await db.sweepstakes.delete({
            where: { id: deleted.sweepstakes.id }
          });
          return new Response(null, { status: 500 });
        });

        await expect(processSweepstakesJobs()).resolves.toEqual({
          processed: 2
        });

        expect(
          await db.sweepstakesJob.findUnique({ where: { id: next.job.id } })
        ).toMatchObject({ status: 'COMPLETED' });
      }
    );
  });
});
