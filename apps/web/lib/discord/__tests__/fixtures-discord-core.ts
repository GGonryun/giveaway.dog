import type { Prisma, Task } from '@prisma/client';
import type { SWEEPSTAKES_DISCORD_POST_SELECT_QUERY } from '@/lib/automation/db';

export type DiscordPostSweepstakes = Prisma.SweepstakesGetPayload<{
  select: typeof SWEEPSTAKES_DISCORD_POST_SELECT_QUERY;
}>;

export type DiscordPostPrize = DiscordPostSweepstakes['prizes'][number];

export type DiscordPostDraw = DiscordPostPrize['draws'][number];

const FIXTURE_DATE = new Date('2024-01-01T00:00:00.000Z');

export const discordPostSweepstakes = (
  overrides: Partial<DiscordPostSweepstakes> = {}
): DiscordPostSweepstakes => ({
  id: 'sweep-1',
  tasks: [],
  visibility: {
    id: 'visibility-1',
    sweepstakesId: 'sweep-1',
    visibility: 'PUBLIC',
    slug: 'dog-treats',
    createdAt: FIXTURE_DATE,
    updatedAt: FIXTURE_DATE
  },
  teamId: 'team-1',
  details: {
    id: 'details-1',
    sweepstakesId: 'sweep-1',
    name: 'Dog Treats',
    description: 'Win a year of treats',
    banner: 'https://cdn.example.com/banner.png'
  },
  timing: {
    id: 'timing-1',
    sweepstakesId: 'sweep-1',
    startDate: new Date('2024-01-01T00:00:00.000Z'),
    endDate: new Date('2030-01-01T00:00:00.000Z'),
    timeZone: 'UTC'
  },
  status: 'ACTIVE',
  posts: [],
  team: {
    name: 'Good Dogs',
    logo: 'https://cdn.example.com/logo.png'
  },
  prizes: [],
  ...overrides
});

export const discordPostDraw = (
  name: string | null,
  result: DiscordPostDraw['result'] = 'WINNER'
): DiscordPostDraw => ({
  result,
  taskCompletion: {
    participant: {
      user: { id: `user-${name ?? 'anonymous'}`, name }
    }
  }
});

export const discordPostPrize = (
  name: string | null,
  draws: DiscordPostDraw[] = []
): DiscordPostPrize => ({
  name,
  quota: 1,
  draws
});

export const discordPostTask = (
  config: Prisma.JsonValue,
  id = 'task-1'
): Task => ({
  id,
  sweepstakesId: 'sweep-1',
  index: 0,
  config
});
