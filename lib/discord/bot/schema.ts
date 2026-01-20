import z from 'zod';
import { ApplicationError } from '../../errors';

export const discordUserSchema = z.object({
  avatar: z.string().nullish(),
  avatar_decoration_data: z.any().nullish(),
  bot: z.boolean().optional(),
  clan: z.any().nullish(),
  collectibles: z.any().nullish(),
  discriminator: z.string(),
  display_name_styles: z.any().nullish(),
  global_name: z.string().nullish(),
  id: z.string(),
  primary_guild: z.any().nullish(),
  public_flags: z.number(),
  system: z.boolean().optional(),
  username: z.string()
});

export const discordChannelSchema = z.object({
  flags: z.number(),
  guild_id: z.string(),
  id: z.string(),
  last_message_id: z.string().nullish(),
  name: z.string(),
  nsfw: z.boolean(),
  parent_id: z.string().nullish(),
  permissions: z.string(),
  position: z.number(),
  rate_limit_per_user: z.number(),
  topic: z.string().nullish(),
  type: z.number()
});

export const discordGuildSchema = z.object({
  features: z.array(z.string()),
  id: z.string(),
  locale: z.string()
});

export const discordMemberSchema = z.object({
  avatar: z.string().nullish(),
  banner: z.string().nullish(),
  collectibles: z.any().nullish(),
  communication_disabled_until: z.string().nullish(),
  deaf: z.boolean(),
  display_name_styles: z.any().nullish(),
  flags: z.number(),
  joined_at: z.string(),
  mute: z.boolean(),
  nick: z.string().nullish(),
  pending: z.boolean(),
  permissions: z.string(),
  premium_since: z.string().nullish(),
  roles: z.array(z.string()),
  unusual_dm_activity_until: z.string().nullish(),
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

export const discordButtonInteractionSchema = baseInteractionSchema.extend({
  type: z.literal(3),
  channel: discordChannelSchema.optional(),
  data: z.object({
    custom_id: z.string(),
    component_type: z.number()
  }),
  guild_id: z.string().optional(),
  member: discordMemberSchema.optional(),
  user: discordUserSchema.optional(),
  message: z.object({
    id: z.string(),
    channel_id: z.string()
  })
});

export const discordInteractionSchema = z.discriminatedUnion('type', [
  discordPingInteractionSchema,
  discordApplicationCommandInteractionSchema,
  discordButtonInteractionSchema
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
export type DiscordButtonInteractionSchema = z.infer<
  typeof discordButtonInteractionSchema
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
