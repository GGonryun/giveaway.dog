import z from 'zod';

export const discordIntegrationSettingsSchema = z.object({
  registrationKey: z.string().optional(),
  registrationKeyExpiry: z.string().optional(),
  guildName: z.string().optional(),
  guildIcon: z.string().url().nullable().optional(),
  channelId: z.string().optional(),
  channelName: z.string().optional(),
  notifyOnNewGiveaway: z.boolean().default(true)
});

export type DiscordIntegrationSettings = z.infer<
  typeof discordIntegrationSettingsSchema
>;
