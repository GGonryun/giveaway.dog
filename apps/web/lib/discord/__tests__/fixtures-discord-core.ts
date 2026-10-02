import nacl from 'tweetnacl';
import { NextRequest } from 'next/server';
import type { Prisma, Task } from '@prisma/client';
import type { SWEEPSTAKES_DISCORD_POST_SELECT_QUERY } from '@/lib/automation/db';
import type {
  DiscordApplicationCommandInteractionSchema,
  DiscordButtonInteractionSchema,
  DiscordChannelSchema,
  DiscordGuildSchema,
  DiscordMemberSchema,
  DiscordPingInteractionSchema,
  DiscordUserSchema
} from '../bot/schema';

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

const signingKeys = nacl.sign.keyPair.fromSeed(new Uint8Array(32).fill(7));

export const DISCORD_TEST_PUBLIC_KEY = Buffer.from(
  signingKeys.publicKey
).toString('hex');

export const DISCORD_TEST_TIMESTAMP = '1700000000';

export const signDiscordBody = (
  body: string,
  timestamp = DISCORD_TEST_TIMESTAMP
) =>
  Buffer.from(
    nacl.sign.detached(Buffer.from(timestamp + body), signingKeys.secretKey)
  ).toString('hex');

export const discordRequest = ({
  body,
  signature,
  timestamp = DISCORD_TEST_TIMESTAMP
}: {
  body: string;
  signature?: string | null;
  timestamp?: string | null;
}) => {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  const resolvedSignature =
    signature === undefined
      ? signDiscordBody(body, timestamp ?? '')
      : signature;
  if (resolvedSignature !== null) {
    headers.set('X-Signature-Ed25519', resolvedSignature);
  }
  if (timestamp !== null) {
    headers.set('X-Signature-Timestamp', timestamp);
  }
  return new NextRequest('http://localhost:3000/api/discord/interactions', {
    method: 'POST',
    headers,
    body
  });
};
