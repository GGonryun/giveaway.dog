import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApplicationError } from '@giveaway/util-errors';
import { asPrismaClient, prismaMock } from '@giveaway/testing-server/prisma';
import type { PostToDiscordJobSchema } from '@giveaway/automation-model/schemas';
import { getSweepstakesActivity, toSweepstakesEmbed } from '../embeds';
import {
  type DiscordPostSweepstakes,
  discordPostDraw,
  discordPostPrize,
  discordPostSweepstakes,
  discordPostTask
} from '../testing/fixtures-discord-core';

const NOW = new Date('2025-06-01T12:00:00.000Z');
const END_DATE_SECONDS = 1893456000;

const interactionTask = (roles?: string[], id = 'task-discord') =>
  discordPostTask(
    {
      type: 'DISCORD_INTERACTION_IMPORT',
      title: 'Interact on Discord',
      value: 1,
      mandatory: true,
      tasksRequired: 0,
      link: 'https://discord.com/channels/1/2/3',
      ...(roles ? { roles } : {})
    },
    id
  );

const bonusTask = () =>
  discordPostTask(
    {
      type: 'BONUS_TASK',
      title: 'Bonus',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    'task-bonus'
  );

const discordJob = (roles: string[]): PostToDiscordJobSchema => ({
  id: 'job-1',
  sweepstakesId: 'sweep-1',
  runAt: NOW,
  type: 'POST_TO_DISCORD',
  status: 'PENDING',
  createdAt: NOW,
  updatedAt: NOW,
  request: {
    integrationId: 'integration-1',
    channelId: 'channel-1',
    roles,
    tasks: []
  }
});

const mockActivity = (participants: number, entries: number) => {
  prismaMock.sweepstakesParticipant.count.mockResolvedValue(participants);
  prismaMock.taskCompletion.count.mockResolvedValue(entries);
};

const buildEmbed = (
  overrides: Partial<DiscordPostSweepstakes> = {},
  job?: PostToDiscordJobSchema
) =>
  toSweepstakesEmbed({
    db: asPrismaClient(),
    sweepstakes: discordPostSweepstakes(overrides),
    job
  });

const descriptionLines = async (
  overrides: Partial<DiscordPostSweepstakes> = {},
  job?: PostToDiscordJobSchema
) => (await buildEmbed(overrides, job)).description.split('\n');

const lineFor = (lines: string[], name: string) =>
  lines.find((line) => line.startsWith(`**${name}:**`));

describe('getSweepstakesActivity', () => {
  it('counts participants and task completions for the sweepstakes', async () => {
    mockActivity(4, 9);

    const result = await getSweepstakesActivity({
      db: asPrismaClient(),
      sweepstakesId: 'sweep-42'
    });

    expect(result).toEqual({ participants: 4, entries: 9 });
    expect(prismaMock.sweepstakesParticipant.count).toHaveBeenCalledWith({
      where: { sweepstakesId: 'sweep-42' }
    });
    expect(prismaMock.taskCompletion.count).toHaveBeenCalledWith({
      where: { task: { sweepstakesId: 'sweep-42' } }
    });
  });

  it('returns zero counts for an empty sweepstakes', async () => {
    mockActivity(0, 0);

    await expect(
      getSweepstakesActivity({ db: asPrismaClient(), sweepstakesId: 's' })
    ).resolves.toEqual({ participants: 0, entries: 0 });
  });

  it('propagates database errors', async () => {
    prismaMock.sweepstakesParticipant.count.mockRejectedValue(
      new Error('db down')
    );

    await expect(
      getSweepstakesActivity({ db: asPrismaClient(), sweepstakesId: 's' })
    ).rejects.toThrow('db down');
    expect(prismaMock.taskCompletion.count).not.toHaveBeenCalled();
  });
});

describe('toSweepstakesEmbed', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    mockActivity(3, 10);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('for a running sweepstakes', () => {
    it('builds the complete embed', async () => {
      const embed = await buildEmbed();

      expect(embed).toEqual({
        title: 'New Giveaway!',
        description: [
          '**Name:** [Dog Treats](https://giveaway.dog/browse/dog-treats)',
          '**Hosted By:** Good Dogs',
          `**Ends At:** <t:${END_DATE_SECONDS}:R>`,
          '**Prizes:** TBD',
          '**Status:** Running',
          '**Participants:** 3',
          '**Entries:** 10'
        ].join('\n'),
        author: {
          name: 'Good Dogs',
          icon_url: 'https://cdn.example.com/logo.png'
        },
        fields: [],
        image: { url: 'https://cdn.example.com/banner.png' },
        color: 0x5865f2,
        timestamp: '2025-06-01T12:00:00.000Z'
      });
    });

    it('loads the activity counts for the sweepstakes id', async () => {
      await buildEmbed({ id: 'sweep-99' });

      expect(prismaMock.sweepstakesParticipant.count).toHaveBeenCalledWith({
        where: { sweepstakesId: 'sweep-99' }
      });
      expect(prismaMock.taskCompletion.count).toHaveBeenCalledWith({
        where: { task: { sweepstakesId: 'sweep-99' } }
      });
    });
  });

  describe('title and status by derived status', () => {
    it.each<[string, Partial<DiscordPostSweepstakes>, string, string]>([
      ['a draft', { status: 'DRAFT' }, 'Upcoming Giveaway!', 'Draft'],
      [
        'an active sweepstakes without timing',
        { status: 'ACTIVE', timing: null },
        'Upcoming Giveaway!',
        'Draft'
      ],
      [
        'a scheduled sweepstakes',
        {
          timing: {
            id: 't',
            sweepstakesId: 'sweep-1',
            startDate: new Date('2026-01-01T00:00:00.000Z'),
            endDate: new Date('2026-02-01T00:00:00.000Z'),
            timeZone: null
          }
        },
        'Upcoming Giveaway!',
        'Scheduled'
      ],
      [
        'an expired sweepstakes',
        {
          timing: {
            id: 't',
            sweepstakesId: 'sweep-1',
            startDate: new Date('2024-01-01T00:00:00.000Z'),
            endDate: new Date('2025-01-01T00:00:00.000Z'),
            timeZone: null
          }
        },
        'Giveaway Expired!',
        'Expired'
      ],
      [
        'a completed sweepstakes',
        { status: 'COMPLETED' },
        'Giveaway Completed!',
        'Completed'
      ],
      [
        'an active sweepstakes without an end date',
        {
          timing: {
            id: 't',
            sweepstakesId: 'sweep-1',
            startDate: new Date('2024-01-01T00:00:00.000Z'),
            endDate: null,
            timeZone: null
          }
        },
        'Invalid Giveaway!',
        'Error'
      ]
    ])('uses %s title and status label', async (_, overrides, title, label) => {
      const embed = await buildEmbed(overrides);

      expect(embed.title).toBe(title);
      expect(lineFor(embed.description.split('\n'), 'Status')).toBe(
        `**Status:** ${label}`
      );
    });
  });

  describe('name field', () => {
    it('falls back to the default name when there are no details', async () => {
      const lines = await descriptionLines({ details: null });

      expect(lineFor(lines, 'Name')).toBe(
        '**Name:** [Untitled Sweepstakes](https://giveaway.dog/browse/dog-treats)'
      );
    });

    it('falls back to the default name when the name is empty', async () => {
      const lines = await descriptionLines({
        details: {
          id: 'd',
          sweepstakesId: 'sweep-1',
          name: '',
          description: null,
          banner: null
        }
      });

      expect(lineFor(lines, 'Name')).toBe(
        '**Name:** [Untitled Sweepstakes](https://giveaway.dog/browse/dog-treats)'
      );
    });

    it('links to the sweepstakes id when there is no visibility slug', async () => {
      const lines = await descriptionLines({ id: 'sweep-7', visibility: null });

      expect(lineFor(lines, 'Name')).toBe(
        '**Name:** [Dog Treats](https://giveaway.dog/browse/sweep-7)'
      );
    });

    it('links to the production site instead of the configured app url', async () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');

      const lines = await descriptionLines();

      expect(lineFor(lines, 'Name')).toBe(
        '**Name:** [Dog Treats](https://giveaway.dog/browse/dog-treats)'
      );
    });
  });

  describe('host', () => {
    it('uses Unknown Host without an icon when there is no team', async () => {
      const embed = await buildEmbed({ team: null });

      expect(lineFor(embed.description.split('\n'), 'Hosted By')).toBe(
        '**Hosted By:** Unknown Host'
      );
      expect(embed.author).toEqual({
        name: 'Unknown Host',
        icon_url: undefined
      });
    });

    it('uses Unknown Host when the team name is empty', async () => {
      const embed = await buildEmbed({ team: { name: '', logo: 'logo.png' } });

      expect(embed.author).toEqual({
        name: 'Unknown Host',
        icon_url: 'logo.png'
      });
    });

    it('omits the author icon when the team logo is empty', async () => {
      const embed = await buildEmbed({ team: { name: 'Pups', logo: '' } });

      expect(embed.author).toEqual({ name: 'Pups', icon_url: undefined });
    });
  });

  describe('end date', () => {
    it('shows TBD when there is no end date', async () => {
      const lines = await descriptionLines({
        timing: {
          id: 't',
          sweepstakesId: 'sweep-1',
          startDate: null,
          endDate: null,
          timeZone: null
        }
      });

      expect(lineFor(lines, 'Ends At')).toBe('**Ends At:** TBD');
    });

    it('shows TBD when there is no timing', async () => {
      const lines = await descriptionLines({ timing: null });

      expect(lineFor(lines, 'Ends At')).toBe('**Ends At:** TBD');
    });

    it('rounds the end date down to whole seconds', async () => {
      const lines = await descriptionLines({
        timing: {
          id: 't',
          sweepstakesId: 'sweep-1',
          startDate: null,
          endDate: new Date('2030-01-01T00:00:00.999Z'),
          timeZone: null
        }
      });

      expect(lineFor(lines, 'Ends At')).toBe(
        `**Ends At:** <t:${END_DATE_SECONDS}:R>`
      );
    });

    it('shows TBD for an end date at the unix epoch', async () => {
      const lines = await descriptionLines({
        timing: {
          id: 't',
          sweepstakesId: 'sweep-1',
          startDate: null,
          endDate: new Date(0),
          timeZone: null
        }
      });

      expect(lineFor(lines, 'Ends At')).toBe('**Ends At:** TBD');
    });
  });

  describe('prizes', () => {
    it('lists prize names separated by commas', async () => {
      const lines = await descriptionLines({
        prizes: [discordPostPrize('Bone'), discordPostPrize('Ball')]
      });

      expect(lineFor(lines, 'Prizes')).toBe('**Prizes:** Bone, Ball');
    });

    it('renders a prize without a name as the text null', async () => {
      const lines = await descriptionLines({
        prizes: [discordPostPrize(null), discordPostPrize('Ball')]
      });

      expect(lineFor(lines, 'Prizes')).toBe('**Prizes:** null, Ball');
    });

    it('shows TBD when a single prize has an empty name', async () => {
      const lines = await descriptionLines({ prizes: [discordPostPrize('')] });

      expect(lineFor(lines, 'Prizes')).toBe('**Prizes:** TBD');
    });
  });

  describe('eligible roles', () => {
    it('lists the discord interaction task roles as role mentions', async () => {
      const lines = await descriptionLines({
        tasks: [interactionTask(['111', '222'])]
      });

      expect(lineFor(lines, 'Eligible Roles')).toBe(
        '**Eligible Roles:** <@&111>, <@&222>'
      );
    });

    it('places the roles line between status and participants', async () => {
      const lines = await descriptionLines({
        tasks: [interactionTask(['111'])]
      });

      expect(lines.map((line) => line.split(':**')[0])).toEqual([
        '**Name',
        '**Hosted By',
        '**Ends At',
        '**Prizes',
        '**Status',
        '**Eligible Roles',
        '**Participants',
        '**Entries'
      ]);
    });

    it('uses the job roles when there is no discord interaction task', async () => {
      const lines = await descriptionLines(
        { tasks: [bonusTask()] },
        discordJob(['333'])
      );

      expect(lineFor(lines, 'Eligible Roles')).toBe(
        '**Eligible Roles:** <@&333>'
      );
    });

    it('prefers the task roles over the job roles', async () => {
      const lines = await descriptionLines(
        { tasks: [interactionTask(['111'])] },
        discordJob(['333'])
      );

      expect(lineFor(lines, 'Eligible Roles')).toBe(
        '**Eligible Roles:** <@&111>'
      );
    });

    it('uses the job roles when the task has no roles configured', async () => {
      const lines = await descriptionLines(
        { tasks: [interactionTask()] },
        discordJob(['333'])
      );

      expect(lineFor(lines, 'Eligible Roles')).toBe(
        '**Eligible Roles:** <@&333>'
      );
    });

    it('omits the roles line when the task roles are empty even if the job has roles', async () => {
      const lines = await descriptionLines(
        { tasks: [interactionTask([])] },
        discordJob(['333'])
      );

      expect(lineFor(lines, 'Eligible Roles')).toBeUndefined();
    });

    it('omits the roles line when there is no task and no job', async () => {
      const lines = await descriptionLines({ tasks: [bonusTask()] });

      expect(lineFor(lines, 'Eligible Roles')).toBeUndefined();
    });

    it('uses the first discord interaction task when there are several', async () => {
      const lines = await descriptionLines({
        tasks: [
          bonusTask(),
          interactionTask(['first'], 'task-a'),
          interactionTask(['second'], 'task-b')
        ]
      });

      expect(lineFor(lines, 'Eligible Roles')).toBe(
        '**Eligible Roles:** <@&first>'
      );
    });

    it('throws when a task config cannot be parsed', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);

      const error = await buildEmbed({
        tasks: [discordPostTask({ type: 'NOT_A_TASK' })]
      }).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to parse task config'
      });
    });
  });

  describe('winners', () => {
    const completedPrizes = [
      discordPostPrize('Bone', [
        discordPostDraw('Rex'),
        discordPostDraw('Cheater', 'DISQUALIFIED'),
        discordPostDraw(null)
      ]),
      discordPostPrize('Ball', [discordPostDraw(''), discordPostDraw('Fido')])
    ];

    it('appends winners from every prize for a completed sweepstakes', async () => {
      const lines = await descriptionLines({
        status: 'COMPLETED',
        prizes: completedPrizes
      });

      expect(lines.at(-1)).toBe('**Winners:** Rex, Anonymous, Anonymous, Fido');
    });

    it('shows an empty winners line when no one has won yet', async () => {
      const lines = await descriptionLines({
        status: 'COMPLETED',
        prizes: [discordPostPrize('Bone')]
      });

      expect(lines.at(-1)).toBe('**Winners:** ');
    });

    it('omits winners for a sweepstakes that is not completed', async () => {
      const lines = await descriptionLines({ prizes: completedPrizes });

      expect(lineFor(lines, 'Winners')).toBeUndefined();
      expect(lines.at(-1)).toBe('**Entries:** 10');
    });

    it('appends winners based on the stored status even when the derived status is draft', async () => {
      const embed = await buildEmbed({
        status: 'COMPLETED',
        timing: null,
        prizes: completedPrizes
      });
      const lines = embed.description.split('\n');

      expect(embed.title).toBe('Upcoming Giveaway!');
      expect(lineFor(lines, 'Status')).toBe('**Status:** Draft');
      expect(lineFor(lines, 'Winners')).toBe(
        '**Winners:** Rex, Anonymous, Anonymous, Fido'
      );
    });
  });

  describe('banner image', () => {
    it('omits the image when the banner is missing', async () => {
      const embed = await buildEmbed({
        details: {
          id: 'd',
          sweepstakesId: 'sweep-1',
          name: 'Treats',
          description: null,
          banner: null
        }
      });

      expect(embed.image).toBeUndefined();
    });

    it('omits the image when there are no details', async () => {
      const embed = await buildEmbed({ details: null });

      expect(embed.image).toBeUndefined();
    });
  });

  it('stamps the embed with the current time', async () => {
    vi.setSystemTime(new Date('2027-03-04T05:06:07.000Z'));

    const embed = await buildEmbed();

    expect(embed.timestamp).toBe('2027-03-04T05:06:07.000Z');
  });

  it('renders zero activity counts', async () => {
    mockActivity(0, 0);

    const lines = await descriptionLines();

    expect(lineFor(lines, 'Participants')).toBe('**Participants:** 0');
    expect(lineFor(lines, 'Entries')).toBe('**Entries:** 0');
  });
});
