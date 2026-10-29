import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Prisma } from '@giveaway/db-model';
import prisma from '@giveaway/db-client/prisma';
import { db, holdTableWrites } from '@giveaway/testing-integration/database';
import {
  createHost,
  createSweepstakes
} from '@giveaway/testing-integration/fixtures';
import { crashAtEveryWrite } from '@giveaway/testing-integration/faults';
import { fakeNetwork, type FakeNetwork } from '@giveaway/testing-server/faults';
import { runAutomatedPostJobs } from '../run-automated-post-jobs';

vi.hoisted(() => {
  process.env.TWITTER_TEAM_APP_CLIENT_ID = 'x-client-id';
  process.env.TWITTER_TEAM_APP_CLIENT_SECRET = 'x-client-secret';
});

const NOW = new Date('2026-10-01T12:00:00.000Z');
const MINUTE = 60_000;
const TWEETS = 'POST https://api.x.com/2/tweets';
const CHANNEL_ID = '200000000000000001';
const MESSAGE_ID = '300000000000000001';
const DISCORD_MESSAGES = `POST https://discord.com/api/v10/channels/${CHANNEL_ID}/messages`;

let network: FakeNetwork;
let accounts = 100000000000000000n;

const createPostJob = async ({
  provider,
  type,
  request
}: {
  provider: 'TWITTER' | 'DISCORD';
  type: 'POST_TO_TWITTER' | 'POST_TO_DISCORD';
  request: (integrationId: string) => Prisma.InputJsonObject;
}) => {
  network.clearRequests();
  const { team } = await createHost();
  const sweepstakes = await createSweepstakes({ teamId: team.id });
  const integration = await db.integration.create({
    data: {
      provider,
      teamId: team.id,
      status: 'ACTIVE',
      label: 'giveawaydog',
      account_id: String(++accounts),
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600
    }
  });
  const job = await db.automatedPostJob.create({
    data: {
      sweepstakesId: sweepstakes.id,
      type,
      status: 'PENDING',
      runAt: new Date(Date.now() - MINUTE),
      request: request(integration.id)
    }
  });
  return { sweepstakes, job };
};

const setupTweet = () =>
  createPostJob({
    provider: 'TWITTER',
    type: 'POST_TO_TWITTER',
    request: (integrationId) => ({
      integrationId,
      text: 'Enter our giveaway',
      tasks: ['REPOST', 'LIKE']
    })
  });

const setupDiscordPost = () =>
  createPostJob({
    provider: 'DISCORD',
    type: 'POST_TO_DISCORD',
    request: (integrationId) => ({
      integrationId,
      channelId: CHANNEL_ID,
      roles: [],
      tasks: ['INTERACTION']
    })
  });

type Scenario = Awaited<ReturnType<typeof setupTweet>>;

const postState = async ({ sweepstakes }: Scenario) => {
  const tasks = await db.task.findMany({
    where: { sweepstakesId: sweepstakes.id },
    select: { index: true, config: true, jobs: { select: { status: true } } }
  });
  return {
    jobs: await db.automatedPostJob.findMany({
      where: { sweepstakesId: sweepstakes.id },
      select: { type: true, status: true }
    }),
    tasks: tasks
      .map(({ index, config, jobs }) => ({
        index,
        type: (config as { type: string }).type,
        jobs: jobs.length
      }))
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0)),
    tweeted: network.requests(TWEETS).length > 0,
    postedToDiscord: network.requests(DISCORD_MESSAGES).length > 0
  };
};

beforeEach(() => {
  vi.stubEnv('DISCORD_BOT_TOKEN', 'bot-token');
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  network = fakeNetwork();
  network.json(TWEETS, {
    data: {
      id: 'tweet-1',
      text: 'Enter our giveaway',
      edit_history_tweet_ids: ['tweet-1']
    }
  });
  network.json(DISCORD_MESSAGES, { id: MESSAGE_ID, channel_id: CHANNEL_ID });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('runAutomatedPostJobs', () => {
  describe('when the function stops after a write and the job runs again', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(NOW);
    });

    it('posts the tweet and adds only the maintained repost import task in a clean run', async () => {
      const scenario = await setupTweet();

      await runAutomatedPostJobs(prisma);

      expect(await postState(scenario)).toEqual({
        jobs: [{ type: 'POST_TO_TWITTER', status: 'COMPLETED' }],
        tasks: [
          { index: 0, type: 'BONUS_TASK', jobs: 0 },
          { index: 1, type: 'TWITTER_RETWEET_IMPORT_V2', jobs: 1 }
        ],
        tweeted: true,
        postedToDiscord: false
      });
    });

    it.each([
      ['POST_TO_TWITTER', setupTweet],
      ['POST_TO_DISCORD', setupDiscordPost]
    ] as const)(
      'reaches the same final state as a clean run after a stop at any write of a %s job',
      async (_, setup) => {
        const { writes, mismatches } = await crashAtEveryWrite({
          setup,
          run: () => runAutomatedPostJobs(prisma),
          recover: () =>
            db.automatedPostJob.updateMany({
              where: { status: 'IN_PROGRESS' },
              data: { status: 'PENDING' }
            }),
          state: postState
        });

        expect(writes).toBeGreaterThan(0);
        expect(mismatches).toEqual([]);
      }
    );
  });

  describe('when two runs overlap', () => {
    it('posts each tweet once', async () => {
      const { sweepstakes } = await setupTweet();

      await holdTableWrites('AutomatedPostJob', { writers: 2 }, () =>
        Promise.all([
          runAutomatedPostJobs(prisma),
          runAutomatedPostJobs(prisma)
        ])
      );

      expect(network.requests(TWEETS)).toHaveLength(1);
      expect(
        await db.task.count({ where: { sweepstakesId: sweepstakes.id } })
      ).toBe(2);
    });
  });

  describe('when one job of the run fails', () => {
    it('marks that job failed and still processes the next job', async () => {
      const failing = await setupTweet();
      const next = await setupDiscordPost();
      network.json(TWEETS, { title: 'Forbidden' }, { status: 403 });

      expect(await runAutomatedPostJobs(prisma)).toEqual({
        processed: 2
      });

      expect(
        await db.automatedPostJob.findUnique({ where: { id: failing.job.id } })
      ).toMatchObject({ status: 'FAILED' });
      expect(
        await db.automatedPostJob.findUnique({ where: { id: next.job.id } })
      ).toMatchObject({ status: 'COMPLETED' });
    });

    it('still processes the next job when the giveaway of a job is deleted during the run', async () => {
      const deleted = await setupTweet();
      const next = await setupDiscordPost();
      network.on(TWEETS, async () => {
        await db.sweepstakes.delete({
          where: { id: deleted.sweepstakes.id }
        });
        return new Response(null, { status: 503 });
      });

      await runAutomatedPostJobs(prisma);

      expect(
        await db.automatedPostJob.findUnique({ where: { id: next.job.id } })
      ).toMatchObject({ status: 'COMPLETED' });
    });
  });
});
