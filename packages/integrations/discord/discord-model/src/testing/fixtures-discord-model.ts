import type {
  DiscordApplicationCommandInteractionSchema,
  DiscordButtonInteractionSchema,
  DiscordChannelSchema,
  DiscordGuildSchema,
  DiscordMemberSchema,
  DiscordPingInteractionSchema,
  DiscordUserSchema
} from '../schema';

export const discordUser = (
  overrides: Partial<DiscordUserSchema> = {}
): DiscordUserSchema => ({
  avatar: 'avatar-hash',
  discriminator: '0',
  global_name: 'Discord Tester',
  id: 'discord-user-1',
  public_flags: 0,
  username: 'discordtester',
  ...overrides
});

export const discordMember = (
  overrides: Partial<DiscordMemberSchema> = {}
): DiscordMemberSchema => ({
  deaf: false,
  flags: 0,
  joined_at: '2024-01-01T00:00:00.000Z',
  mute: false,
  pending: false,
  permissions: '8',
  roles: ['role-1'],
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
  permissions: '8',
  position: 0,
  rate_limit_per_user: 0,
  type: 0,
  ...overrides
});

export const discordGuild = (
  overrides: Partial<DiscordGuildSchema> = {}
): DiscordGuildSchema => ({
  features: ['COMMUNITY'],
  id: 'guild-1',
  locale: 'en-US',
  ...overrides
});

const baseInteraction = () => ({
  app_permissions: '8',
  application_id: 'app-1',
  attachment_size_limit: 8388608,
  authorizing_integration_owners: { '0': 'guild-1' },
  entitlements: [],
  id: 'interaction-1',
  token: 'interaction-token',
  version: 1
});

export const pingInteraction = (
  overrides: Partial<DiscordPingInteractionSchema> = {}
): DiscordPingInteractionSchema => ({
  ...baseInteraction(),
  type: 1,
  user: discordUser(),
  ...overrides
});

export const applicationCommandInteraction = (
  overrides: Partial<DiscordApplicationCommandInteractionSchema> = {}
): DiscordApplicationCommandInteractionSchema => ({
  ...baseInteraction(),
  type: 2,
  channel: discordChannel(),
  channel_id: 'channel-1',
  data: { id: 'command-1', name: 'connect', type: 1 },
  guild: discordGuild(),
  guild_id: 'guild-1',
  locale: 'en-US',
  member: discordMember(),
  ...overrides
});

export const buttonInteraction = (
  customId = 'task:enter:task-1',
  overrides: Partial<DiscordButtonInteractionSchema> = {}
): DiscordButtonInteractionSchema => ({
  ...baseInteraction(),
  type: 3,
  channel: discordChannel(),
  data: { custom_id: customId, component_type: 2 },
  guild_id: 'guild-1',
  member: discordMember(),
  message: { id: 'message-1', channel_id: 'channel-1' },
  ...overrides
});
