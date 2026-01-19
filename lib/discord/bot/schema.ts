import z from 'zod';
import { ApplicationError } from '../../errors';

export const discordUserSchema = z.object({
  avatar: z.string().nullable(),
  avatar_decoration_data: z.any().nullable(),
  bot: z.boolean().optional(),
  clan: z.any().nullable(),
  collectibles: z.any().nullable(),
  discriminator: z.string(),
  display_name_styles: z.any().nullable(),
  global_name: z.string().nullable(),
  id: z.string(),
  primary_guild: z.any().nullable(),
  public_flags: z.number(),
  system: z.boolean().optional(),
  username: z.string()
});

export const discordChannelSchema = z.object({
  flags: z.number(),
  guild_id: z.string(),
  id: z.string(),
  last_message_id: z.string().optional(),
  name: z.string(),
  nsfw: z.boolean(),
  parent_id: z.string().nullable(),
  permissions: z.string(),
  position: z.number(),
  rate_limit_per_user: z.number(),
  topic: z.string().nullable(),
  type: z.number()
});

export const discordGuildSchema = z.object({
  features: z.array(z.string()),
  id: z.string(),
  locale: z.string()
});

export const discordMemberSchema = z.object({
  avatar: z.string().nullable(),
  banner: z.string().nullable(),
  collectibles: z.any().nullable(),
  communication_disabled_until: z.string().nullable(),
  deaf: z.boolean(),
  display_name_styles: z.any().nullable(),
  flags: z.number(),
  joined_at: z.string(),
  mute: z.boolean(),
  nick: z.string().nullable(),
  pending: z.boolean(),
  permissions: z.string(),
  premium_since: z.string().nullable(),
  roles: z.array(z.string()),
  unusual_dm_activity_until: z.string().nullable(),
  user: discordUserSchema
});

export const discordCommandOptionSchema = z.object({
  name: z.string(),
  value: z.string()
});

export const discordInteractionDataSchema = z.object({
  guild_id: z.string().optional(),
  id: z.string(),
  name: z.string(),
  options: z.array(discordCommandOptionSchema).optional(),
  type: z.number()
});

const baseInteractionSchema = z.object({
  app_permissions: z.string(),
  application_id: z.string(),
  attachment_size_limit: z.number(),
  authorizing_integration_owners: z.record(z.string()),
  entitlements: z.array(z.any()),
  entitlement_sku_ids: z.array(z.string()).optional(),
  id: z.string(),
  token: z.string(),
  version: z.number()
});

export const discordPingInteractionSchema = baseInteractionSchema.extend({
  type: z.literal(1),
  user: discordUserSchema
});

export const discordApplicationCommandInteractionSchema =
  baseInteractionSchema.extend({
    type: z.literal(2),
    channel: discordChannelSchema.optional(),
    channel_id: z.string().optional(),
    context: z.number().optional(),
    data: discordInteractionDataSchema,
    guild: discordGuildSchema.optional(),
    guild_id: z.string().optional(),
    guild_locale: z.string().optional(),
    locale: z.string(),
    member: discordMemberSchema.optional(),
    user: discordUserSchema.optional()
  });

export const discordInteractionSchema = z.discriminatedUnion('type', [
  discordPingInteractionSchema,
  discordApplicationCommandInteractionSchema
]);

export type DiscordUserSchema = z.infer<typeof discordUserSchema>;
export type DiscordChannelSchema = z.infer<typeof discordChannelSchema>;
export type DiscordGuildSchema = z.infer<typeof discordGuildSchema>;
export type DiscordMemberSchema = z.infer<typeof discordMemberSchema>;
export type DiscordCommandOptionSchema = z.infer<
  typeof discordCommandOptionSchema
>;
export type DiscordInteractionDataSchema = z.infer<
  typeof discordInteractionDataSchema
>;
export type DiscordPingInteractionSchema = z.infer<
  typeof discordPingInteractionSchema
>;
export type DiscordApplicationCommandInteractionSchema = z.infer<
  typeof discordApplicationCommandInteractionSchema
>;
export type DiscordInteractionSchema = z.infer<typeof discordInteractionSchema>;

export const toDiscordInteraction = (
  data: unknown
): DiscordInteractionSchema => {
  const parsed = discordInteractionSchema.safeParse(data);
  if (!parsed.success) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid Discord interaction data',
      cause: parsed.error
    });
  }
  return parsed.data;
};

export const toDiscordApplicationCommandInteraction = (
  data: unknown
): DiscordApplicationCommandInteractionSchema => {
  const parsed = discordApplicationCommandInteractionSchema.safeParse(data);
  if (!parsed.success) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid Discord application command interaction data',
      cause: parsed.error
    });
  }
  return parsed.data;
};
