import { z } from 'zod';

export const discordGuildInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().nullable(),
  owner_id: z.string()
});

export type DiscordGuildInfoSchema = z.infer<typeof discordGuildInfoSchema>;

export const discordBotTokenSchema = z
  .string()
  .min(1, 'Discord bot token is required');
