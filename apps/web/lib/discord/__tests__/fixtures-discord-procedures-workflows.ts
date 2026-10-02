import { TeamRole, TeamTier } from '@prisma/client';
import type {
  DiscordApplicationCommandInteractionSchema,
  DiscordButtonInteractionSchema,
  DiscordChannelSchema,
  DiscordGuildSchema,
  DiscordMemberSchema,
  DiscordUserSchema
} from '../bot/schema';
import { TEST_USER } from '@/test/session';

export const TEAM_ID = 'team-1';
export const TEAM_SLUG = 'acme';

export const teamWithRole = (
  role: TeamRole = TeamRole.OWNER,
  overrides: { tier?: TeamTier; userId?: string } = {}
) => ({
  id: TEAM_ID,
  slug: TEAM_SLUG,
  name: 'Acme',
  tier: overrides.tier ?? TeamTier.FREE,
  members: [
    {
      id: 'membership-1',
      teamId: TEAM_ID,
      userId: overrides.userId ?? TEST_USER.id,
      role
    }
  ]
});

export const expectedTeamLookup = (slug: string = TEAM_SLUG) => ({
  where: { slug, members: { some: { userId: TEST_USER.id } } },
  include: { members: true }
});

export const discordUser = (
  overrides: Partial<DiscordUserSchema> = {}
): DiscordUserSchema => ({
  id: 'discord-user-1',
  username: 'doggo',
  global_name: 'Doggo Global',
  avatar: 'avatar-hash',
  discriminator: '0',
  public_flags: 0,
  ...overrides
});

export const discordMember = (
  overrides: Partial<DiscordMemberSchema> = {}
): DiscordMemberSchema => ({
  deaf: false,
  flags: 0,
  joined_at: '2024-01-01T00:00:00.000Z',
  mute: false,
  nick: 'Doggo Nick',
  pending: false,
  permissions: '0',
  roles: ['role-a', 'role-b'],
  user: discordUser(),
  ...overrides
});

export const discordChannel = (
  overrides: Partial<DiscordChannelSchema> = {}
): DiscordChannelSchema => ({
  flags: 0,
  guild_id: 'guild-1',
  id: 'channel-1',
  name: 'general',
  nsfw: false,
  permissions: '0',
  position: 0,
  rate_limit_per_user: 0,
  type: 0,
  ...overrides
});

export const discordGuild = (
  overrides: Partial<DiscordGuildSchema> = {}
): DiscordGuildSchema => ({
  features: [],
  id: 'guild-1',
  locale: 'en-US',
  ...overrides
});

const baseInteraction = {
  app_permissions: '0',
  application_id: 'app-1',
  attachment_size_limit: 0,
  authorizing_integration_owners: {},
  entitlements: [],
  id: 'interaction-1',
  token: 'interaction-token',
  version: 1
};

export const buttonInteraction = (
  overrides: Partial<DiscordButtonInteractionSchema> = {}
): DiscordButtonInteractionSchema => ({
  ...baseInteraction,
  type: 3,
  data: { custom_id: 'task:enter:task-1', component_type: 2 },
  guild_id: 'guild-1',
  member: discordMember(),
  message: { id: 'message-1', channel_id: 'channel-1' },
  ...overrides
});

export const commandInteraction = (
  overrides: Partial<DiscordApplicationCommandInteractionSchema> = {}
): DiscordApplicationCommandInteractionSchema => ({
  ...baseInteraction,
  type: 2,
  channel: discordChannel(),
  data: {
    id: 'command-1',
    name: 'connect',
    type: 1,
    options: [{ name: 'key', value: 'state-1' }]
  },
  guild: discordGuild(),
  guild_id: 'guild-1',
  locale: 'en-US',
  member: discordMember(),
  ...overrides
});

export const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init
  });

export const discordPostSweepstakes = (
  overrides: Record<string, unknown> = {}
) => ({
  id: 'sweep-1',
  teamId: TEAM_ID,
  status: 'ACTIVE',
  tasks: [] as unknown[],
  visibility: { slug: 'cool-giveaway' },
  details: { name: 'Cool Giveaway', banner: null },
  timing: {
    startDate: new Date('2026-01-01T00:00:00.000Z'),
    endDate: new Date('2026-12-31T00:00:00.000Z')
  },
  posts: [],
  team: { name: 'Acme', logo: 'https://example.com/logo.png' },
  prizes: [{ name: 'Gift Card', quota: 1, draws: [] }],
  ...overrides
});

export const storedTask = (id: string, config: Record<string, unknown>) => ({
  id,
  sweepstakesId: 'sweep-1',
  index: 0,
  config
});

export const bonusTaskConfig = {
  type: 'BONUS_TASK',
  title: 'Bonus',
  value: 1,
  mandatory: false,
  tasksRequired: 0
};

export const discordInteractionTaskConfig = (
  overrides: Record<string, unknown> = {}
) => ({
  type: 'DISCORD_INTERACTION_IMPORT',
  title: 'Interact on Discord',
  value: 1,
  mandatory: false,
  tasksRequired: 0,
  importingAccount: 'integration-1',
  roles: ['role-a'],
  link: 'https://discord.com/channels/111/222/333',
  ...overrides
});
