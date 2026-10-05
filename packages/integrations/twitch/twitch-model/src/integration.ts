import z from 'zod';

export const TWITCH_EVENTSUB_TYPES = ['channel.chat.message'] as const;

export type TwitchEventSubType = (typeof TWITCH_EVENTSUB_TYPES)[number];

export const twitchEventSubSubscriptionSchema = z.object({
  id: z.string(),
  type: z.enum(TWITCH_EVENTSUB_TYPES),
  status: z.string()
});

export type TwitchEventSubSubscription = z.infer<
  typeof twitchEventSubSubscriptionSchema
>;

export const botStatusSchema = z.object({
  isModded: z.boolean(),
  lastChecked: z.string().datetime().optional(),
  botUserId: z.string(),
  botUsername: z.string()
});

export type BotStatus = z.infer<typeof botStatusSchema>;

export const twitchIntegrationSettingsSchema = z.object({
  broadcasterId: z.string(),
  broadcasterLogin: z.string(),
  broadcasterDisplayName: z.string(),
  channelUrl: z.string(),
  botStatus: botStatusSchema.optional()
});

export type TwitchIntegrationSettings = z.infer<
  typeof twitchIntegrationSettingsSchema
>;
