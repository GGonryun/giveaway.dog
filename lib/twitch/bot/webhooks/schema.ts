import z from 'zod';

export const twitchChatMessageEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  chatter_user_id: z.string(),
  chatter_user_login: z.string(),
  chatter_user_name: z.string(),
  message_id: z.string(),
  message: z.object({
    text: z.string(),
    fragments: z.array(z.any()).optional()
  }),
  color: z.string().optional(),
  badges: z.array(z.any()).optional(),
  message_type: z.string().optional(),
  cheer: z.any().optional(),
  reply: z.any().optional(),
  channel_points_custom_reward_id: z.string().nullable().optional()
});

export type TwitchChatMessageEvent = z.infer<
  typeof twitchChatMessageEventSchema
>;

export const twitchEventSubNotificationSchema = z.object({
  subscription: z.object({
    id: z.string(),
    type: z.string(),
    version: z.string(),
    status: z.string(),
    condition: z.record(z.string()),
    transport: z.object({
      method: z.string(),
      callback: z.string().optional()
    }),
    created_at: z.string()
  }),
  event: z.unknown()
});

export type TwitchEventSubNotification = z.infer<
  typeof twitchEventSubNotificationSchema
>;

export const twitchSubscriptionVerificationSchema = z.object({
  challenge: z.string(),
  subscription: z.object({
    id: z.string(),
    type: z.string(),
    version: z.string(),
    status: z.string(),
    condition: z.record(z.string()),
    transport: z.object({
      method: z.string(),
      callback: z.string().optional()
    }),
    created_at: z.string()
  })
});

export type TwitchSubscriptionVerification = z.infer<
  typeof twitchSubscriptionVerificationSchema
>;

export const twitchRevocationSchema = z.object({
  subscription: z.object({
    id: z.string(),
    type: z.string(),
    version: z.string(),
    status: z.string(),
    condition: z.record(z.string()),
    transport: z.object({
      method: z.string(),
      callback: z.string().optional()
    }),
    created_at: z.string()
  })
});

export type TwitchRevocation = z.infer<typeof twitchRevocationSchema>;

export const parseGiveawayCommand = (
  text: string,
  trigger: string = '!giveaway'
): boolean => {
  const escapedTrigger = trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Match just the trigger, optionally at the start of the message
  const pattern = new RegExp(`^${escapedTrigger}(?:\\s|$)`, 'i');
  return pattern.test(text);
};
