import { z } from 'zod';

export const discordGuildInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().nullable(),
  owner_id: z.string()
});

export type DiscordGuildInfoSchema = z.infer<typeof discordGuildInfoSchema>;

export const discordRoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.number(),
  hoist: z.boolean(),
  icon: z.string().nullish(),
  unicode_emoji: z.string().nullish(),
  position: z.number(),
  permissions: z.string(),
  managed: z.boolean(),
  mentionable: z.boolean()
});

export type DiscordRoleSchema = z.infer<typeof discordRoleSchema>;

export const discordGuildRolesSchema = z.array(discordRoleSchema);

export type DiscordGuildRolesSchema = z.infer<typeof discordGuildRolesSchema>;

export const discordChannelSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.number(),
  position: z.number(),
  parent_id: z.string().nullish()
});

export type DiscordChannelSchema = z.infer<typeof discordChannelSchema>;

export const discordGuildChannelsSchema = z.array(discordChannelSchema);

export type DiscordGuildChannelsSchema = z.infer<
  typeof discordGuildChannelsSchema
>;

export const discordMessageResponseSchema = z.object({
  id: z.string(),
  channel_id: z.string(),
  guild_id: z.string().optional()
});

export type DiscordMessageResponseSchema = z.infer<
  typeof discordMessageResponseSchema
>;

export const discordBotTokenSchema = z
  .string()
  .min(1, 'Discord bot token is required');

export type DiscordMessageComponent = {
  type: 1;
  components: {
    type: number;
    style?: number;
    label?: string;
    custom_id?: string;
    url?: string;
  }[];
};

export type DiscordMessageEmbed = {
  title: string;
  description: string;
  fields: Array<{ name: string; value: string; inline?: boolean }>;
  image?: { url: string };
  author?: { name: string; icon_url?: string };
  color?: number;
  timestamp?: string;
  url: string;
};

export type PostDiscordMessageOptions = {
  channelId: string;
  embed: DiscordMessageEmbed;
  components: DiscordMessageComponent[];
};

export type UpdateDiscordMessageOptions = {
  channelId: string;
  messageId: string;
  embed: DiscordMessageEmbed;
  components?: DiscordMessageComponent[];
};
