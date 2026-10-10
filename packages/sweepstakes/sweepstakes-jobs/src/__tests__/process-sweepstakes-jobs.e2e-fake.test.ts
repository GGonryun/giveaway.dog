import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prismaMock } from '@giveaway/testing-server/prisma';
import {
  E2E_CLOSED_GATES,
  stubE2eFakeEnvironment
} from '@giveaway/e2e-fakes/testing/env';
import {
  clearMemoryOutbox,
  memoryOutbox,
  readE2eOutbox
} from '@giveaway/e2e-fakes/testing/outbox';
import { processSweepstakesJobs } from '../process-sweepstakes-jobs';

vi.mock(
  '@giveaway/e2e-fakes/outbox',
  () => import('@giveaway/e2e-fakes/testing/outbox')
);

const NOW = new Date('2026-03-01T12:00:00.000Z');
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1/secret';
const JOB_ID = 'job-activation';

const fetchMock = vi.fn<typeof fetch>();

const givenPublicActivation = () => {
  prismaMock.sweepstakesJob.findMany.mockResolvedValue([
    {
      id: JOB_ID,
      sweepstakesId: 'sw-1',
      type: 'PROCESS_ACTIVATION',
      status: 'PENDING',
      data: null,
      error: null,
      runAt: new Date('2026-03-01T11:00:00.000Z'),
      createdAt: new Date('2026-02-01T00:00:00.000Z'),
      updatedAt: new Date('2026-02-01T00:00:00.000Z')
    }
  ] as never);
  prismaMock.sweepstakes.findUnique.mockResolvedValue({
    id: 'sw-1',
    details: { name: 'Summer Giveaway', description: null, banner: null },
    timing: {
      startDate: new Date('2026-02-28T00:00:00.000Z'),
      endDate: new Date('2026-03-10T00:00:00.000Z')
    },
    visibility: { visibility: 'PUBLIC', slug: 'summer' },
    team: { name: 'Acme' }
  } as never);
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  clearMemoryOutbox();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  prismaMock.sweepstakesJob.update.mockResolvedValue({} as never);
  givenPublicActivation();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('the activation alert with the discord fake', () => {
  it('records the alert in the outbox of the giveaway without DISCORD_WEBHOOK_URL', async () => {
    stubE2eFakeEnvironment('preview', 'discord');
    vi.stubEnv('DISCORD_WEBHOOK_URL', undefined);

    await processSweepstakesJobs();

    const [entry] = await readE2eOutbox({
      channel: 'discord-alert',
      target: 'sw-1'
    });
    expect(entry.payload).toEqual({
      embeds: [
        expect.objectContaining({
          title: 'Summer Giveaway',
          fields: expect.arrayContaining([
            { name: 'Host', value: 'Acme', inline: true }
          ])
        })
      ]
    });
    expect(prismaMock.sweepstakesJob.update).toHaveBeenCalledWith({
      where: { id: JOB_ID },
      data: { status: 'COMPLETED' }
    });
  });

  it('calls no webhook when DISCORD_WEBHOOK_URL is set', async () => {
    stubE2eFakeEnvironment('preview', 'discord');
    vi.stubEnv('DISCORD_WEBHOOK_URL', WEBHOOK_URL);

    await processSweepstakesJobs();

    expect(fetchMock).not.toHaveBeenCalled();
    await expect(
      readE2eOutbox({ channel: 'discord-alert', target: 'sw-1' })
    ).resolves.toHaveLength(1);
  });

  it.each(E2E_CLOSED_GATES)(
    'posts to the webhook on %s',
    async (environment) => {
      stubE2eFakeEnvironment(environment, 'discord');
      vi.stubEnv('DISCORD_WEBHOOK_URL', WEBHOOK_URL);

      await processSweepstakesJobs();

      expect(fetchMock).toHaveBeenCalledWith(
        WEBHOOK_URL,
        expect.objectContaining({ method: 'POST' })
      );
      expect(memoryOutbox.redis.rpush).not.toHaveBeenCalled();
    }
  );

  it.each(E2E_CLOSED_GATES)(
    'fails the job on %s when the webhook fails',
    async (environment) => {
      stubE2eFakeEnvironment(environment, 'discord');
      vi.stubEnv('DISCORD_WEBHOOK_URL', WEBHOOK_URL);
      fetchMock.mockResolvedValue(
        new Response(null, { status: 500, statusText: 'Server Error' })
      );

      await processSweepstakesJobs();

      expect(prismaMock.sweepstakesJob.update).toHaveBeenCalledWith({
        where: { id: JOB_ID },
        data: {
          status: 'FAILED',
          error: 'Failed to send Discord webhook: 500 Server Error'
        }
      });
    }
  );

  it.each(E2E_CLOSED_GATES)(
    'sends nothing on %s without DISCORD_WEBHOOK_URL',
    async (environment) => {
      stubE2eFakeEnvironment(environment, 'discord');
      vi.stubEnv('DISCORD_WEBHOOK_URL', undefined);

      await processSweepstakesJobs();

      expect(fetchMock).not.toHaveBeenCalled();
      expect(memoryOutbox.redis.rpush).not.toHaveBeenCalled();
    }
  );
});
