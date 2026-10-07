import 'server-only';

import z from 'zod';
import { twitchFeatureSchema } from '@giveaway/integration-model/scopes';
import {
  eventSubSubscriptionSchema,
  eventSubSubscriptionsListSchema
} from '@giveaway/twitch-model/schemas';

export const twitchStateSchema = z.object({
  teamId: z.string(),
  teamSlug: z.string(),
  features: z.array(twitchFeatureSchema).default(['CHAT_COMMANDS'])
});

export const twitchAppTokenResponseSchema = z.object({
  access_token: z.string()
});

export const twitchRefreshTokenResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  refresh_token: z.string().nullish(),
  scope: z.array(z.string()),
  token_type: z.string().nullish()
});

export const twitchBotTokenResponseSchema =
  twitchRefreshTokenResponseSchema.pick({
    access_token: true,
    expires_in: true
  });

export const twitchUsersResponseSchema = z.object({
  data: z
    .array(
      z.object({
        id: z.string(),
        login: z.string(),
        display_name: z.string(),
        profile_image_url: z.string()
      })
    )
    .nonempty()
});

export const twitchCreatedSubscriptionResponseSchema =
  eventSubSubscriptionsListSchema.extend({
    data: z.array(eventSubSubscriptionSchema).nonempty()
  });
