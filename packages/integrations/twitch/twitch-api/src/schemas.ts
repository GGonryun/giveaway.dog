import 'server-only';

import z from 'zod';
import { twitchFeatureSchema } from '@giveaway/integration-model/scopes';

export const twitchStateSchema = z.object({
  teamId: z.string(),
  teamSlug: z.string(),
  features: z.array(twitchFeatureSchema).default(['CHAT_COMMANDS'])
});

export const twitchAppAccessTokenSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  token_type: z.string()
});

export const twitchUserTokenSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  refresh_token: z.string().nullish(),
  scope: z.array(z.string()),
  token_type: z.string().nullish()
});

export const twitchBotTokenSchema = z.object({
  access_token: z.string(),
  expires_in: z.number()
});

export const twitchUserSchema = z.object({
  id: z.string(),
  login: z.string(),
  display_name: z.string(),
  profile_image_url: z.string()
});

export const twitchUsersSchema = z.object({
  data: z.array(twitchUserSchema)
});
