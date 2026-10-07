import { ApplicationError } from '@giveaway/util-errors';
import { z } from 'zod';

const subscriptionSchema = z.object({
  id: z.string(),
  status: z.literal('enabled'),
  type: z.literal('channel.chat.message'),
  version: z.literal('1'),
  condition: z.object({
    broadcaster_user_id: z.string(),
    user_id: z.string()
  }),
  transport: z.object({
    method: z.literal('webhook'),
    callback: z.string().url()
  }),
  created_at: z.coerce.date(),
  cost: z.number()
});

const textFragmentSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
  cheermote: z.null(),
  emote: z.null(),
  mention: z.null()
});

const emoteFragmentSchema = z.object({
  type: z.literal('emote'),
  text: z.string(),
  cheermote: z.null(),
  mention: z.null(),
  emote: z.object({
    id: z.string(),
    emote_set_id: z.string(),
    owner_id: z.string(),
    format: z.array(z.string())
  })
});

const mentionFragmentSchema = z.object({
  type: z.literal('mention'),
  text: z.string(),
  emote: z.null(),
  cheermote: z.null(),
  mention: z.object({
    user_id: z.string(),
    user_login: z.string(),
    user_name: z.string()
  })
});

const cheermoteFragmentSchema = z.object({
  type: z.literal('cheermote'),
  text: z.string(),
  emote: z.null(),
  mention: z.null(),
  cheermote: z.object({
    prefix: z.string(),
    bits: z.number(),
    tier: z.number().optional()
  })
});

const messageFragmentSchema = z.discriminatedUnion('type', [
  textFragmentSchema,
  emoteFragmentSchema,
  mentionFragmentSchema,
  cheermoteFragmentSchema
]);

const chatMessageSchema = z.object({
  text: z.string(),
  fragments: z.array(messageFragmentSchema)
});

const badgeSchema = z.object({
  set_id: z.string(),
  id: z.string(),
  info: z.string()
});

const channelChatMessageEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),

  source_broadcaster_user_id: z.unknown(),
  source_broadcaster_user_login: z.unknown(),
  source_broadcaster_user_name: z.unknown(),

  chatter_user_id: z.string(),
  chatter_user_login: z.string(),
  chatter_user_name: z.string(),

  message_id: z.string(),
  source_message_id: z.unknown(),
  is_source_only: z.unknown(),

  message: chatMessageSchema,

  color: z.string(),
  badges: z.array(badgeSchema),
  source_badges: z.unknown(),

  message_type: z.literal('text'),
  cheer: z.unknown(),
  reply: z.unknown(),

  channel_points_custom_reward_id: z.unknown(),
  channel_points_animation_id: z.unknown()
});

export const channelChatMessageEventSubSchema = z.object({
  subscription: subscriptionSchema,
  event: channelChatMessageEventSchema
});

export const eventSubTransportSchema = z
  .object({
    method: z.string(),
    callback: z.string().url().optional()
  })
  .passthrough();

export const eventSubConditionSchema = z
  .object({
    broadcaster_user_id: z.string(),
    user_id: z.string().optional()
  })
  .passthrough();

export const eventSubSubscriptionSchema = z
  .object({
    id: z.string(),
    status: z.string(),
    type: z.string(),
    version: z.string(),
    condition: eventSubConditionSchema,
    created_at: z.string(),
    transport: eventSubTransportSchema,
    cost: z.number()
  })
  .passthrough();

export const eventSubSubscriptionsListSchema = z
  .object({
    total: z.number(),
    data: z.array(eventSubSubscriptionSchema),
    max_total_cost: z.number(),
    total_cost: z.number(),
    pagination: z.record(z.string()).optional()
  })
  .passthrough();

export const toEventSubSubscriptionSchema = (data: unknown) => {
  const result = eventSubSubscriptionSchema.safeParse(data);
  if (!result.success) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      cause: result.error,
      message: 'Failed to validate EventSub subscription schema'
    });
  }
  return result.data;
};
