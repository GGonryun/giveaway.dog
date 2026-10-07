import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processSweepstakesJobs } from '../process-sweepstakes-jobs';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { SWEEPSTAKES_DISCORD_POST_SELECT_QUERY } from '@giveaway/automation-model/db';

const NOW = new Date('2026-03-01T12:00:00.000Z');
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1/secret';
const BOT_TOKEN = 'bot-token';

type JobType =
  | 'PROCESS_ACTIVATION'
  | 'PROCESS_MODIFICATION'
  | 'PROCESS_EXPIRATION'
  | 'PROCESS_COMPLETION'
  | 'RANDOMLY_ASSIGN_PRIZES';

const job = (
  type: JobType | string,
  overrides: Record<string, unknown> = {}
) => ({
  id: `job-${type}`,
  sweepstakesId: 'sw-1',
  type,
  status: 'PENDING',
  data: null,
  error: null,
  runAt: new Date('2026-03-01T11:00:00.000Z'),
  createdAt: new Date('2026-02-01T00:00:00.000Z'),
  updatedAt: new Date('2026-02-01T00:00:00.000Z'),
  ...overrides
});

const givenJobs = (...jobs: ReturnType<typeof job>[]) => {
  prismaMock.sweepstakesJob.findMany.mockResolvedValue(jobs);
};

const updateCalls = () =>
  prismaMock.sweepstakesJob.update.mock.calls.map((call) => call[0]);

const completed = (id: string) => ({
  where: { id },
  data: { status: 'COMPLETED' }
});

const failed = (id: string, error: string) => ({
  where: { id },
  data: { status: 'FAILED', error }
});

const fetchMock = vi.fn<typeof fetch>();

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), { status: 200, ...init });

const lastFetchBody = () => {
  const init = fetchMock.mock.calls[fetchMock.mock.calls.length - 1][1];
  return JSON.parse(String(init?.body));
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  vi.stubEnv('DISCORD_WEBHOOK_URL', WEBHOOK_URL);
  vi.stubEnv('DISCORD_BOT_TOKEN', BOT_TOKEN);
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  prismaMock.sweepstakesJob.update.mockResolvedValue({});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('processSweepstakesJobs', () => {
  describe('job selection', () => {
    it('queries up to five due pending jobs ordered by creation time', async () => {
      givenJobs();

      await processSweepstakesJobs();

      expect(prismaMock.sweepstakesJob.findMany).toHaveBeenCalledWith({
        where: {
          runAt: { lte: NOW },
          status: { in: ['PENDING'] }
        },
        orderBy: { createdAt: 'asc' },
        take: 5
      });
    });

    it('returns zero processed and performs no updates when nothing is due', async () => {
      givenJobs();

      await expect(processSweepstakesJobs()).resolves.toEqual({
        processed: 0
      });
      expect(prismaMock.sweepstakesJob.update).not.toHaveBeenCalled();
      expect(console.info).toHaveBeenCalledWith(
        'Found 0 sweepstakes jobs to process'
      );
    });

    it('reports every fetched job as processed even when some fail', async () => {
      givenJobs(job('PROCESS_MODIFICATION'), job('UNKNOWN_TYPE'));

      await expect(processSweepstakesJobs()).resolves.toEqual({
        processed: 2
      });
    });

    it('propagates a findMany failure', async () => {
      prismaMock.sweepstakesJob.findMany.mockRejectedValue(new Error('db'));

      await expect(processSweepstakesJobs()).rejects.toThrow('db');
    });
  });

  describe('error handling', () => {
    it('marks a job with an unknown type as failed with a generic message', async () => {
      givenJobs(job('UNKNOWN_TYPE'));

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([
        failed('job-UNKNOWN_TYPE', 'An unknown error occurred...')
      ]);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to process sweepstakes job job-UNKNOWN_TYPE',
        expect.objectContaining({ message: 'Unexpected value: UNKNOWN_TYPE' })
      );
    });

    it('keeps processing later jobs after one fails', async () => {
      givenJobs(job('UNKNOWN_TYPE'), job('PROCESS_MODIFICATION'));

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([
        failed('job-UNKNOWN_TYPE', 'An unknown error occurred...'),
        completed('job-PROCESS_MODIFICATION')
      ]);
    });

    it('uses a generic message when a job throws a non application error', async () => {
      givenJobs(job('PROCESS_ACTIVATION'));
      prismaMock.sweepstakes.findUnique.mockRejectedValue(
        new Error('connection lost')
      );

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([
        failed('job-PROCESS_ACTIVATION', 'An unknown error occurred...')
      ]);
    });

    it('rejects when marking a job as failed also fails', async () => {
      givenJobs(job('UNKNOWN_TYPE'));
      prismaMock.sweepstakesJob.update.mockRejectedValue(
        new Error('update failed')
      );

      await expect(processSweepstakesJobs()).rejects.toThrow('update failed');
    });
  });

  describe('PROCESS_MODIFICATION', () => {
    it('marks the job completed without loading the sweepstakes', async () => {
      givenJobs(job('PROCESS_MODIFICATION'));

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([completed('job-PROCESS_MODIFICATION')]);
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('RANDOMLY_ASSIGN_PRIZES', () => {
    const JOB_ID = 'job-RANDOMLY_ASSIGN_PRIZES';

    beforeEach(() => {
      givenJobs(job('RANDOMLY_ASSIGN_PRIZES'));
    });

    it('loads the sweepstakes criteria and prize ids', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      await processSweepstakesJobs();

      expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
        where: { id: 'sw-1' },
        select: { criteria: true, prizes: { select: { id: true } } }
      });
    });

    it('fails the job when the sweepstakes does not exist', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([
        failed(JOB_ID, 'Sweepstakes with id sw-1 not found')
      ]);
    });

    it('completes without assigning when there are no criteria', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue({
        criteria: null,
        prizes: [{ id: 'p-1' }]
      });

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([completed(JOB_ID)]);
      expect(prismaMock.sweepstakesParticipant.findMany).not.toHaveBeenCalled();
      expect(console.info).toHaveBeenCalledWith(
        'Sweepstakes sw-1 does not require random prize assignment'
      );
    });

    it('completes without assigning when user selection is disabled', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue({
        criteria: { allowUserSelection: false },
        prizes: [{ id: 'p-1' }]
      });

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([completed(JOB_ID)]);
      expect(
        prismaMock.sweepstakesAllocation.createMany
      ).not.toHaveBeenCalled();
    });

    it('completes without assigning when there are no prizes', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue({
        criteria: { allowUserSelection: true },
        prizes: []
      });

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([completed(JOB_ID)]);
      expect(prismaMock.sweepstakesParticipant.findMany).not.toHaveBeenCalled();
    });

    it('queries participants of the sweepstakes without an allocation', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue({
        criteria: { allowUserSelection: true },
        prizes: [{ id: 'p-1' }]
      });
      prismaMock.sweepstakesParticipant.findMany.mockResolvedValue([]);

      await processSweepstakesJobs();

      expect(prismaMock.sweepstakesParticipant.findMany).toHaveBeenCalledWith({
        where: { sweepstakesId: 'sw-1', allocations: null },
        select: { id: true }
      });
    });

    it('completes without creating allocations when every participant has one', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue({
        criteria: { allowUserSelection: true },
        prizes: [{ id: 'p-1' }]
      });
      prismaMock.sweepstakesParticipant.findMany.mockResolvedValue([]);

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([completed(JOB_ID)]);
      expect(
        prismaMock.sweepstakesAllocation.createMany
      ).not.toHaveBeenCalled();
      expect(console.info).toHaveBeenCalledWith(
        'No participants without allocations for sweepstakes sw-1'
      );
    });

    it('allocates a random prize to every unallocated participant', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue({
        criteria: { allowUserSelection: true },
        prizes: [{ id: 'p-1' }, { id: 'p-2' }, { id: 'p-3' }]
      });
      prismaMock.sweepstakesParticipant.findMany.mockResolvedValue([
        { id: 'part-1' },
        { id: 'part-2' },
        { id: 'part-3' }
      ]);
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.99);

      await processSweepstakesJobs();

      expect(prismaMock.sweepstakesAllocation.createMany).toHaveBeenCalledWith({
        data: [
          { participantId: 'part-1', prizeId: 'p-1' },
          { participantId: 'part-2', prizeId: 'p-2' },
          { participantId: 'part-3', prizeId: 'p-3' }
        ],
        skipDuplicates: true
      });
    });

    it('marks the job completed after creating allocations', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue({
        criteria: { allowUserSelection: true },
        prizes: [{ id: 'p-1' }]
      });
      prismaMock.sweepstakesParticipant.findMany.mockResolvedValue([
        { id: 'part-1' },
        { id: 'part-2' }
      ]);

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([completed(JOB_ID)]);
      expect(console.info).toHaveBeenCalledWith(
        'Successfully assigned random prizes to 2 participants for sweepstakes sw-1'
      );
    });

    it('does not complete the job when creating allocations fails', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue({
        criteria: { allowUserSelection: true },
        prizes: [{ id: 'p-1' }]
      });
      prismaMock.sweepstakesParticipant.findMany.mockResolvedValue([
        { id: 'part-1' }
      ]);
      prismaMock.sweepstakesAllocation.createMany.mockRejectedValue(
        new Error('constraint')
      );

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([
        failed(JOB_ID, 'An unknown error occurred...')
      ]);
    });
  });

  describe('PROCESS_ACTIVATION', () => {
    const JOB_ID = 'job-PROCESS_ACTIVATION';

    const activationSweepstakes = (
      overrides: Record<string, unknown> = {}
    ) => ({
      id: 'sw-1',
      details: {
        name: 'Summer Giveaway',
        description: '<p>Win <strong>big</strong></p>',
        banner: 'https://cdn.example.com/banner.png'
      },
      timing: {
        startDate: new Date('2026-02-28T00:00:00.000Z'),
        endDate: new Date('2026-03-10T00:00:00.000Z')
      },
      visibility: { visibility: 'PUBLIC', slug: 'summer' },
      team: { name: 'Acme' },
      ...overrides
    });

    beforeEach(() => {
      givenJobs(job('PROCESS_ACTIVATION'));
      fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    });

    it('loads the sweepstakes with details, timing, visibility and team', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      await processSweepstakesJobs();

      expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
        where: { id: 'sw-1' },
        include: { details: true, timing: true, visibility: true, team: true }
      });
    });

    it('fails the job when the sweepstakes does not exist', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([
        failed(JOB_ID, 'Sweepstakes with id sw-1 not found')
      ]);
    });

    it.each(['UNLISTED', 'PRIVATE'])(
      'completes without notifying when visibility is %s',
      async (visibility) => {
        prismaMock.sweepstakes.findUnique.mockResolvedValue(
          activationSweepstakes({ visibility: { visibility, slug: 'x' } })
        );

        await processSweepstakesJobs();

        expect(updateCalls()).toEqual([completed(JOB_ID)]);
        expect(fetchMock).not.toHaveBeenCalled();
        expect(console.info).toHaveBeenCalledWith(
          'Sweepstakes sw-1 is not public, skipping Discord notification'
        );
      }
    );

    it('completes without notifying when there is no visibility record', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        activationSweepstakes({ visibility: null })
      );

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([completed(JOB_ID)]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('completes without notifying when the sweepstakes already ended', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        activationSweepstakes({
          timing: {
            startDate: null,
            endDate: new Date('2026-03-01T11:59:59.000Z')
          }
        })
      );

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([completed(JOB_ID)]);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(console.info).toHaveBeenCalledWith(
        'Sweepstakes sw-1 has already ended, completing job'
      );
    });

    it('treats an end date equal to now as already ended', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        activationSweepstakes({ timing: { startDate: null, endDate: NOW } })
      );

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([completed(JOB_ID)]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('reschedules the job for the start date when it has not started', async () => {
      const startDate = new Date('2026-03-05T00:00:00.000Z');
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        activationSweepstakes({
          timing: { startDate, endDate: new Date('2026-03-10T00:00:00.000Z') }
        })
      );

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([
        {
          where: { id: JOB_ID },
          data: { status: 'PENDING', runAt: startDate }
        }
      ]);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(console.info).toHaveBeenCalledWith(
        'Sweepstakes sw-1 has not started yet, rescheduling job'
      );
    });

    it('sends the notification when the start date equals now', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        activationSweepstakes({ timing: { startDate: NOW, endDate: null } })
      );

      await processSweepstakesJobs();

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('posts the embed to the discord webhook as json', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        activationSweepstakes()
      );

      await processSweepstakesJobs();

      expect(fetchMock).toHaveBeenCalledWith(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String)
      });
      expect(lastFetchBody()).toEqual({
        embeds: [
          {
            title: 'Summer Giveaway',
            description: 'Win **big**',
            fields: [
              { name: 'Host', value: 'Acme', inline: true },
              {
                name: 'Ends At',
                value: new Date(
                  '2026-03-10T00:00:00.000Z'
                ).toLocaleDateString(),
                inline: true
              }
            ],
            url: 'https://giveaway.dog/browse/summer',
            color: 0x5865f2,
            timestamp: NOW.toISOString(),
            image: { url: 'https://cdn.example.com/banner.png' }
          }
        ]
      });
    });

    it('marks the job completed after a successful notification', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        activationSweepstakes()
      );

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([completed(JOB_ID)]);
      expect(console.info).toHaveBeenCalledWith(
        'Successfully sent Discord notification for sweepstakes sw-1'
      );
    });

    it('uses defaults when details, team and timing are missing', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        activationSweepstakes({
          details: null,
          team: null,
          timing: null,
          visibility: { visibility: 'PUBLIC', slug: null }
        })
      );

      await processSweepstakesJobs();

      const [embed] = lastFetchBody().embeds;
      expect(embed).toEqual({
        title: 'Untitled Sweepstakes',
        description: 'A new sweepstakes has been published',
        fields: [
          { name: 'Host', value: 'Default Team', inline: true },
          { name: 'Ends At', value: 'Not set', inline: true }
        ],
        url: 'https://giveaway.dog/browse/sw-1',
        color: 5793266,
        timestamp: NOW.toISOString()
      });
    });

    it('uses defaults when the name, description and team name are empty', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        activationSweepstakes({
          details: { name: '', description: '', banner: '' },
          team: { name: '' }
        })
      );

      await processSweepstakesJobs();

      const [embed] = lastFetchBody().embeds;
      expect(embed.title).toBe('Untitled Sweepstakes');
      expect(embed.description).toBe('A new sweepstakes has been published');
      expect(embed.fields[0].value).toBe('Default Team');
      expect(embed).not.toHaveProperty('image');
    });

    it('truncates the description to 4096 characters', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        activationSweepstakes({
          details: { name: 'Long', description: 'a'.repeat(5000), banner: null }
        })
      );

      await processSweepstakesJobs();

      expect(lastFetchBody().embeds[0].description).toBe('a'.repeat(4096));
    });

    it('fails the job with the status when the webhook responds with an error', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        activationSweepstakes()
      );
      fetchMock.mockResolvedValue(
        new Response('nope', { status: 429, statusText: 'Too Many Requests' })
      );

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([
        failed(JOB_ID, 'Failed to send Discord webhook: 429 Too Many Requests')
      ]);
    });

    describe('without DISCORD_WEBHOOK_URL', () => {
      beforeEach(() => {
        vi.stubEnv('DISCORD_WEBHOOK_URL', undefined);
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      });

      it('fails the job when the sweepstakes does not exist', async () => {
        prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

        await processSweepstakesJobs();

        expect(updateCalls()).toEqual([
          failed(JOB_ID, 'Sweepstakes with id sw-1 not found')
        ]);
      });

      it('completes without notifying when the sweepstakes is not public', async () => {
        prismaMock.sweepstakes.findUnique.mockResolvedValue(
          activationSweepstakes({
            visibility: { visibility: 'UNLISTED', slug: 'x' }
          })
        );

        await processSweepstakesJobs();

        expect(updateCalls()).toEqual([completed(JOB_ID)]);
        expect(fetchMock).not.toHaveBeenCalled();
        expect(console.info).toHaveBeenCalledWith(
          'Sweepstakes sw-1 is not public, skipping Discord notification'
        );
      });

      it('completes without notifying when the sweepstakes already ended', async () => {
        prismaMock.sweepstakes.findUnique.mockResolvedValue(
          activationSweepstakes({ timing: { startDate: null, endDate: NOW } })
        );

        await processSweepstakesJobs();

        expect(updateCalls()).toEqual([completed(JOB_ID)]);
        expect(fetchMock).not.toHaveBeenCalled();
        expect(console.info).toHaveBeenCalledWith(
          'Sweepstakes sw-1 has already ended, completing job'
        );
      });

      it('reschedules the job for the start date when it has not started', async () => {
        const startDate = new Date('2026-03-05T00:00:00.000Z');
        prismaMock.sweepstakes.findUnique.mockResolvedValue(
          activationSweepstakes({
            timing: { startDate, endDate: new Date('2026-03-10T00:00:00.000Z') }
          })
        );

        await processSweepstakesJobs();

        expect(updateCalls()).toEqual([
          {
            where: { id: JOB_ID },
            data: { status: 'PENDING', runAt: startDate }
          }
        ]);
        expect(fetchMock).not.toHaveBeenCalled();
      });

      it.each([undefined, ''])(
        'completes without notifying a public started sweepstakes when the url is %j',
        async (webhookUrl) => {
          vi.stubEnv('DISCORD_WEBHOOK_URL', webhookUrl);
          prismaMock.sweepstakes.findUnique.mockResolvedValue(
            activationSweepstakes()
          );

          await processSweepstakesJobs();

          expect(updateCalls()).toEqual([completed(JOB_ID)]);
          expect(fetchMock).not.toHaveBeenCalled();
          expect(console.warn).toHaveBeenCalledWith(
            'DISCORD_WEBHOOK_URL is not set, skipping Discord notification for sweepstakes sw-1'
          );
        }
      );
    });
  });

  const discordSweepstakes = (overrides: Record<string, unknown> = {}) => ({
    id: 'sw-1',
    tasks: [],
    visibility: { visibility: 'PUBLIC', slug: 'summer' },
    teamId: 'team-1',
    details: {
      name: 'Summer Giveaway',
      description: null,
      banner: null
    },
    timing: {
      startDate: new Date('2026-02-01T00:00:00.000Z'),
      endDate: new Date('2026-02-28T00:00:00.000Z')
    },
    status: 'ACTIVE',
    posts: [],
    team: { name: 'Acme', logo: 'https://cdn.example.com/acme.png' },
    prizes: [
      {
        name: 'Gift Card',
        quota: 1,
        draws: [
          {
            result: 'WINNER',
            taskCompletion: {
              participant: { user: { id: 'u-1', name: 'Bob' } }
            }
          }
        ]
      }
    ],
    ...overrides
  });

  const discordPost = (overrides: Record<string, unknown> = {}) => ({
    id: 'post-1',
    type: 'POST_TO_DISCORD',
    status: 'COMPLETED',
    response: { channelId: 'chan-1', messageId: 'msg-1' },
    ...overrides
  });

  const givenDiscordUpdateSucceeds = () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ id: 'msg-1', channel_id: 'chan-1' })
    );
    prismaMock.sweepstakesParticipant.count.mockResolvedValue(12);
    prismaMock.taskCompletion.count.mockResolvedValue(30);
  };

  describe('PROCESS_EXPIRATION', () => {
    const JOB_ID = 'job-PROCESS_EXPIRATION';

    beforeEach(() => {
      givenJobs(job('PROCESS_EXPIRATION'));
      givenDiscordUpdateSucceeds();
    });

    it('loads the sweepstakes with the discord post selection', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      await processSweepstakesJobs();

      expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
        where: { id: 'sw-1' },
        select: SWEEPSTAKES_DISCORD_POST_SELECT_QUERY
      });
    });

    it('fails the job when the sweepstakes does not exist', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([
        failed(JOB_ID, 'Sweepstakes with id sw-1 not found')
      ]);
    });

    it('fails the job when the sweepstakes is already completed', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        discordSweepstakes({ status: 'COMPLETED' })
      );

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([
        failed(JOB_ID, 'Sweepstakes sw-1 is already expired')
      ]);
    });

    it('fails the job when the sweepstakes is still a draft', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        discordSweepstakes({ status: 'DRAFT' })
      );

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([
        failed(
          JOB_ID,
          'Sweepstakes sw-1 is still in draft status and cannot process expiration'
        )
      ]);
    });

    it('completes without touching discord when there is no discord post', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        discordSweepstakes({
          posts: [discordPost({ type: 'POST_TO_BLUESKY' })]
        })
      );

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([completed(JOB_ID)]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it.each(['PENDING', 'FAILED'])(
      'completes without touching discord when the discord post is %s',
      async (status) => {
        prismaMock.sweepstakes.findUnique.mockResolvedValue(
          discordSweepstakes({ posts: [discordPost({ status })] })
        );

        await processSweepstakesJobs();

        expect(updateCalls()).toEqual([completed(JOB_ID)]);
        expect(fetchMock).not.toHaveBeenCalled();
      }
    );

    it('fails the job when the discord response has no channel id', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        discordSweepstakes({
          posts: [discordPost({ response: { messageId: 'msg-1' } })]
        })
      );

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([
        failed(
          JOB_ID,
          'Post to Discord job for sweepstakes sw-1 is missing channelId in response'
        )
      ]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('fails the job when the discord response has no message id', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        discordSweepstakes({
          posts: [discordPost({ response: { channelId: 'chan-1' } })]
        })
      );

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([
        failed(
          JOB_ID,
          'Post to Discord job for sweepstakes sw-1 is missing messageId in response'
        )
      ]);
    });

    it('fails the job when the discord response cannot be parsed', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        discordSweepstakes({ posts: [discordPost({ response: null })] })
      );

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([
        failed(JOB_ID, 'Invalid Post to Discord response data')
      ]);
    });

    it('updates the discord message with the expired embed and components', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        discordSweepstakes({ posts: [discordPost()] })
      );

      await processSweepstakesJobs();

      expect(fetchMock).toHaveBeenCalledWith(
        'https://discord.com/api/v10/channels/chan-1/messages/msg-1',
        expect.objectContaining({
          method: 'PATCH',
          headers: {
            Authorization: `Bot ${BOT_TOKEN}`,
            'Content-Type': 'application/json'
          }
        })
      );
      const body = lastFetchBody();
      expect(body.embeds[0].title).toBe('Giveaway Expired!');
      expect(body.components).toEqual([
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: 'View Details',
              url: 'https://giveaway.dog/browse/summer'
            },
            {
              type: 2,
              style: 5,
              label: 'Browse Giveaways',
              url: 'https://giveaway.dog/browse'
            }
          ]
        }
      ]);
    });

    it('marks the job completed after updating the discord message', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        discordSweepstakes({ posts: [discordPost()] })
      );

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([completed(JOB_ID)]);
      expect(console.info).toHaveBeenCalledWith(
        'Updating Discord message for sweepstakes sw-1 to indicate expiration'
      );
    });

    it('fails the job with the discord error when the message update fails', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        discordSweepstakes({ posts: [discordPost()] })
      );
      fetchMock.mockResolvedValue(new Response('{}', { status: 404 }));

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([
        failed(JOB_ID, 'Message or channel not found')
      ]);
    });

    it('fails the job when the discord bot token is not configured', async () => {
      vi.stubEnv('DISCORD_BOT_TOKEN', '');
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        discordSweepstakes({ posts: [discordPost()] })
      );

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([
        failed(JOB_ID, 'Discord bot token is not configured')
      ]);
    });
  });

  describe('PROCESS_COMPLETION', () => {
    const JOB_ID = 'job-PROCESS_COMPLETION';

    beforeEach(() => {
      givenJobs(job('PROCESS_COMPLETION'));
      givenDiscordUpdateSucceeds();
    });

    it('marks the job completed before loading the sweepstakes', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        discordSweepstakes({ status: 'COMPLETED' })
      );

      await processSweepstakesJobs();

      const updateOrder =
        prismaMock.sweepstakesJob.update.mock.invocationCallOrder[0];
      const findOrder =
        prismaMock.sweepstakes.findUnique.mock.invocationCallOrder[0];
      expect(updateOrder).toBeLessThan(findOrder);
      expect(console.info).toHaveBeenCalledWith(
        'Sweepstakes sw-1 marked as completed in job job-PROCESS_COMPLETION'
      );
    });

    it('loads the sweepstakes with the discord post selection', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      await processSweepstakesJobs();

      expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
        where: { id: 'sw-1' },
        select: SWEEPSTAKES_DISCORD_POST_SELECT_QUERY
      });
    });

    it('completes then fails the job when the sweepstakes does not exist', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([
        completed(JOB_ID),
        failed(JOB_ID, 'Sweepstakes with id sw-1 not found')
      ]);
    });

    it('completes then fails the job when the sweepstakes is not completed', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        discordSweepstakes({ status: 'ACTIVE' })
      );

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([
        completed(JOB_ID),
        failed(JOB_ID, 'Sweepstakes sw-1 is not completed yet')
      ]);
    });

    it('marks the job completed twice when there is no discord post', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        discordSweepstakes({ status: 'COMPLETED' })
      );

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([completed(JOB_ID), completed(JOB_ID)]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('ignores completed posts to other platforms', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        discordSweepstakes({
          status: 'COMPLETED',
          posts: [discordPost({ type: 'POST_TO_BLUESKY' })]
        })
      );

      await processSweepstakesJobs();

      expect(fetchMock).not.toHaveBeenCalled();
      expect(updateCalls()).toEqual([completed(JOB_ID), completed(JOB_ID)]);
    });

    it('updates the discord post even when it is not the first post', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        discordSweepstakes({
          status: 'COMPLETED',
          posts: [
            discordPost({ id: 'post-0', type: 'POST_TO_BLUESKY' }),
            discordPost()
          ]
        })
      );

      await processSweepstakesJobs();

      expect(fetchMock).toHaveBeenCalledWith(
        'https://discord.com/api/v10/channels/chan-1/messages/msg-1',
        expect.objectContaining({ method: 'PATCH' })
      );
    });

    it('skips discord when the discord post is not completed', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        discordSweepstakes({
          status: 'COMPLETED',
          posts: [discordPost({ status: 'PENDING' })]
        })
      );

      await processSweepstakesJobs();

      expect(fetchMock).not.toHaveBeenCalled();
      expect(updateCalls()).toEqual([completed(JOB_ID), completed(JOB_ID)]);
    });

    it('fails the job when the discord response has no channel id', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        discordSweepstakes({
          status: 'COMPLETED',
          posts: [discordPost({ response: {} })]
        })
      );

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([
        completed(JOB_ID),
        failed(
          JOB_ID,
          'Post to Discord job for sweepstakes sw-1 is missing channelId in response'
        )
      ]);
    });

    it('fails the job when the discord response has no message id', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        discordSweepstakes({
          status: 'COMPLETED',
          posts: [discordPost({ response: { channelId: 'chan-1' } })]
        })
      );

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([
        completed(JOB_ID),
        failed(
          JOB_ID,
          'Post to Discord job for sweepstakes sw-1 is missing messageId in response'
        )
      ]);
    });

    it('updates the discord message with the completed embed listing winners', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        discordSweepstakes({ status: 'COMPLETED', posts: [discordPost()] })
      );

      await processSweepstakesJobs();

      expect(fetchMock).toHaveBeenCalledWith(
        'https://discord.com/api/v10/channels/chan-1/messages/msg-1',
        expect.objectContaining({ method: 'PATCH' })
      );
      const body = lastFetchBody();
      expect(body.embeds[0].title).toBe('Giveaway Completed!');
      expect(body.embeds[0].description).toContain('**Winners:** Bob');
      expect(body.embeds[0].description).toContain('**Participants:** 12');
      expect(body.embeds[0].description).toContain('**Entries:** 30');
      expect(
        body.components[0].components.map((c: { label: string }) => c.label)
      ).toEqual(['View Details', 'Browse Giveaways']);
    });

    it('marks the job completed again after updating discord', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        discordSweepstakes({ status: 'COMPLETED', posts: [discordPost()] })
      );

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([completed(JOB_ID), completed(JOB_ID)]);
    });

    it('fails the job when discord rejects the bot token', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        discordSweepstakes({ status: 'COMPLETED', posts: [discordPost()] })
      );
      fetchMock.mockResolvedValue(new Response('{}', { status: 401 }));

      await processSweepstakesJobs();

      expect(updateCalls()).toEqual([
        completed(JOB_ID),
        failed(JOB_ID, 'Discord bot token is invalid')
      ]);
    });
  });
});
